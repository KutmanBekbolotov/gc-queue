import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { AuditService } from '../audit/audit.service';
import {
  OPERATOR_AUTH_LOGIN_ATTEMPT_TRACKER,
  OPERATOR_AUTH_OPTIONS,
  OPERATOR_AUTH_SESSION_STORE,
  OPERATOR_AUTH_USER_SERVICE,
} from './operator-auth.constants';
import { OperatorAuthResponseDto } from './dto/operator-auth-response.dto';
import { OperatorAuthenticatedUserDto } from './dto/operator-authenticated-user.dto';
import { OperatorLoginDto } from './dto/operator-login.dto';
import { OperatorRefreshTokenDto } from './dto/operator-refresh-token.dto';
import {
  OperatorAuthIdentity,
  OperatorAuthLoginAttemptTracker,
  OperatorAuthRequestContext,
  OperatorAuthRequestUser,
  OperatorAuthSessionStore,
  OperatorAuthTokenPayload,
  OperatorAuthUserService,
  OperatorSessionRecord,
  ResolvedOperatorAuthModuleOptions,
} from './operator-auth.interfaces';
import { OperatorPasswordHashService } from './operator-password-hash.service';
import {
  normalizeLogin,
  normalizeRoleCode,
  safeCompare,
  toJwtExpiresIn,
  unauthorized,
} from './operator-auth.utils';

@Injectable()
export class OperatorAuthService {
  constructor(
    @Inject(OPERATOR_AUTH_OPTIONS)
    private readonly options: ResolvedOperatorAuthModuleOptions,
    @Inject(OPERATOR_AUTH_USER_SERVICE)
    private readonly userService: OperatorAuthUserService,
    @Inject(OPERATOR_AUTH_SESSION_STORE)
    private readonly sessionStore: OperatorAuthSessionStore,
    @Inject(OPERATOR_AUTH_LOGIN_ATTEMPT_TRACKER)
    private readonly loginAttemptTracker: OperatorAuthLoginAttemptTracker,
    private readonly jwtService: JwtService,
    private readonly passwordHashService: OperatorPasswordHashService,
    private readonly auditService: AuditService,
  ) {}

  async login(
    dto: OperatorLoginDto,
    context: OperatorAuthRequestContext,
  ): Promise<OperatorAuthResponseDto> {
    const attemptKey = this.buildAttemptKey(dto.login, context.ip);
    await this.loginAttemptTracker.assertCanAttempt(attemptKey);

    const identity = await this.userService.findForAuth(dto.login);
    const passwordMatches =
      identity !== null
        ? await this.passwordHashService.verify(dto.password, identity.passwordHash)
        : false;

    if (!identity || !passwordMatches || !this.canAuthenticate(identity)) {
      await this.loginAttemptTracker.registerFailure(attemptKey);
      this.auditService.record({
        actorType: 'USER',
        actorId: identity?.id,
        ip: context.ip,
        userAgent: context.userAgent,
        action: 'operator-auth.login.failed',
        entityType: 'OperatorAuth',
        afterState: {
          login: normalizeLogin(dto.login),
        },
      });
      unauthorized();
    }

    await this.loginAttemptTracker.reset(attemptKey);

    const sessionId = randomUUID();
    const refreshToken = await this.signRefreshToken(identity, sessionId);
    const refreshTokenHash = this.passwordHashService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.options.refreshTokenTtlMs);

    const session = await this.sessionStore.create({
      id: sessionId,
      userId: identity.id,
      refreshTokenHash,
      expiresAt,
      ip: context.ip,
      userAgent: context.userAgent,
      deviceFingerprint: context.deviceFingerprint,
    });

    const accessToken = await this.signAccessToken(identity, session.id);

    this.auditService.record({
      actorType: 'USER',
      actorId: identity.id,
      ip: context.ip,
      userAgent: context.userAgent,
      action: 'operator-auth.login.succeeded',
      entityType: 'OperatorAuthSession',
      entityId: session.id,
      afterState: {
        sessionId: session.id,
        roles: identity.roles,
      },
    });

    return this.toAuthResponse(identity, session, accessToken, refreshToken);
  }

  async refresh(
    dto: OperatorRefreshTokenDto,
    context: OperatorAuthRequestContext,
  ): Promise<OperatorAuthResponseDto> {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const session = await this.requireValidSession(
      payload.sid,
      payload.sub,
      dto.refreshToken,
      context.deviceFingerprint,
    );

    const identity = await this.userService.findById(payload.sub);
    if (!identity || !this.canAuthenticate(identity)) {
      await this.sessionStore.revoke(payload.sid, 'REVOKED');
      throw new ForbiddenException('Operator access has been revoked');
    }

    const nextRefreshToken = await this.signRefreshToken(identity, session.id);
    const nextRefreshTokenHash = this.passwordHashService.hashToken(
      nextRefreshToken,
    );
    const nextExpiresAt = new Date(Date.now() + this.options.refreshTokenTtlMs);
    const rotatedSession = await this.sessionStore.rotateRefreshToken({
      sessionId: session.id,
      refreshTokenHash: nextRefreshTokenHash,
      expiresAt: nextExpiresAt,
      lastUsedAt: new Date(),
    });

    if (!rotatedSession) {
      throw new UnauthorizedException('Session has already been revoked');
    }

    const accessToken = await this.signAccessToken(identity, rotatedSession.id);

    this.auditService.record({
      actorType: 'USER',
      actorId: identity.id,
      ip: context.ip,
      userAgent: context.userAgent,
      action: 'operator-auth.token.refreshed',
      entityType: 'OperatorAuthSession',
      entityId: rotatedSession.id,
      afterState: {
        sessionId: rotatedSession.id,
      },
    });

    return this.toAuthResponse(
      identity,
      rotatedSession,
      accessToken,
      nextRefreshToken,
    );
  }

  async logout(user: OperatorAuthRequestUser): Promise<void> {
    await this.sessionStore.revoke(user.sessionId, 'REVOKED');
    this.auditService.record({
      actorType: 'USER',
      actorId: user.id,
      action: 'operator-auth.session.revoked',
      entityType: 'OperatorAuthSession',
      entityId: user.sessionId,
    });
  }

  async logoutAll(user: OperatorAuthRequestUser): Promise<number> {
    const revokedSessions = await this.sessionStore.revokeAllForUser(user.id);
    this.auditService.record({
      actorType: 'USER',
      actorId: user.id,
      action: 'operator-auth.sessions.revoked_all',
      entityType: 'OperatorAuthSession',
      entityId: user.sessionId,
      afterState: {
        revokedSessions,
      },
    });
    return revokedSessions;
  }

  async getCurrentUser(user: OperatorAuthRequestUser): Promise<OperatorAuthenticatedUserDto> {
    const identity = await this.userService.findById(user.id);
    if (!identity || !this.canAuthenticate(identity)) {
      throw new ForbiddenException('Operator access has been revoked');
    }

    return this.toCurrentUserDto(identity, user.sessionId);
  }

  async validateAccessToken(token: string): Promise<OperatorAuthRequestUser> {
    const payload = (await this.jwtService.verifyAsync(token, {
      secret: this.options.accessTokenSecret,
      audience: this.options.audience,
      issuer: this.options.issuer,
    })) as OperatorAuthTokenPayload;

    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    const session = await this.sessionStore.findById(payload.sid);
    if (!session || session.userId !== payload.sub || session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session is not active');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionStore.revoke(session.id, 'EXPIRED');
      throw new UnauthorizedException('Session has expired');
    }

    const identity = await this.userService.findById(payload.sub);
    if (!identity || !this.canAuthenticate(identity)) {
      await this.sessionStore.revoke(session.id, 'REVOKED');
      throw new ForbiddenException('Operator access has been revoked');
    }

    return {
      id: identity.id,
      username: identity.username,
      fullName: identity.fullName,
      email: identity.email,
      roles: identity.roles,
      metadata: identity.metadata,
      sessionId: session.id,
    };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<OperatorAuthTokenPayload> {
    const payload = (await this.jwtService.verifyAsync(refreshToken, {
      secret: this.options.refreshTokenSecret,
      audience: this.options.audience,
      issuer: this.options.issuer,
    })) as OperatorAuthTokenPayload;

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return payload;
  }

  private async requireValidSession(
    sessionId: string,
    userId: string,
    refreshToken: string,
    deviceFingerprint?: string,
  ): Promise<OperatorSessionRecord> {
    const session = await this.sessionStore.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.status !== 'ACTIVE') {
      throw new UnauthorizedException('Session is not active');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessionStore.revoke(session.id, 'EXPIRED');
      throw new UnauthorizedException('Session has expired');
    }

    if (
      session.deviceFingerprint &&
      deviceFingerprint &&
      session.deviceFingerprint !== deviceFingerprint
    ) {
      await this.sessionStore.revoke(session.id, 'REVOKED');
      throw new UnauthorizedException('Session fingerprint mismatch');
    }

    const refreshTokenHash = this.passwordHashService.hashToken(refreshToken);
    if (!safeCompare(refreshTokenHash, session.refreshTokenHash)) {
      await this.sessionStore.revoke(session.id, 'REVOKED');
      this.auditService.record({
        actorType: 'USER',
        actorId: session.userId,
        action: 'operator-auth.refresh.replay_detected',
        entityType: 'OperatorAuthSession',
        entityId: session.id,
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    return session;
  }

  private canAuthenticate(identity: OperatorAuthIdentity): boolean {
    if (!identity.isActive || identity.isBlocked) {
      return false;
    }

    const normalizedRoles = identity.roles.map(normalizeRoleCode);
    return this.options.allowedRoleCodes.some((role) =>
      normalizedRoles.includes(role),
    );
  }

  private buildAttemptKey(login: string, ip?: string): string {
    return `${normalizeLogin(login)}:${ip ?? 'unknown'}`;
  }

  private async signAccessToken(
    identity: OperatorAuthIdentity,
    sessionId: string,
  ): Promise<string> {
    const payload: OperatorAuthTokenPayload = {
      sub: identity.id,
      sid: sessionId,
      username: identity.username,
      roles: identity.roles,
      typ: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.options.accessTokenSecret,
      expiresIn: toJwtExpiresIn(this.options.accessTokenTtl),
      audience: this.options.audience,
      issuer: this.options.issuer,
    });
  }

  private async signRefreshToken(
    identity: OperatorAuthIdentity,
    sessionId: string,
  ): Promise<string> {
    const payload: OperatorAuthTokenPayload = {
      sub: identity.id,
      sid: sessionId,
      username: identity.username,
      roles: identity.roles,
      typ: 'refresh',
      jti: randomUUID(),
    };

    return this.jwtService.signAsync(payload, {
      secret: this.options.refreshTokenSecret,
      expiresIn: toJwtExpiresIn(this.options.refreshTokenTtl),
      audience: this.options.audience,
      issuer: this.options.issuer,
    });
  }

  private toAuthResponse(
    identity: OperatorAuthIdentity,
    session: OperatorSessionRecord,
    accessToken: string,
    refreshToken: string,
  ): OperatorAuthResponseDto {
    return {
      user: this.toCurrentUserDto(identity, session.id),
      session: {
        id: session.id,
        status: session.status,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        ip: session.ip,
        userAgent: session.userAgent,
        deviceFingerprint: session.deviceFingerprint,
      },
      tokens: {
        tokenType: 'Bearer',
        accessToken,
        refreshToken,
        expiresIn: Math.floor(this.options.accessTokenTtlMs / 1000),
        refreshExpiresIn: Math.floor(this.options.refreshTokenTtlMs / 1000),
      },
    };
  }

  private toCurrentUserDto(
    identity: OperatorAuthIdentity,
    sessionId: string,
  ): OperatorAuthenticatedUserDto {
    return {
      id: identity.id,
      username: identity.username,
      fullName: identity.fullName,
      email: identity.email,
      roles: identity.roles,
      metadata: identity.metadata,
      sessionId,
    };
  }
}
