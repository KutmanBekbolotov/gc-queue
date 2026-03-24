import { ModuleMetadata } from '@nestjs/common';

export type OperatorAuthDuration = string | number;
export type OperatorSessionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED';
export type OperatorTokenType = 'access' | 'refresh';

export interface InMemoryOperatorAuthUser {
  id?: string;
  username: string;
  fullName: string;
  password?: string;
  passwordHash?: string;
  email?: string;
  roles?: string[];
  isActive?: boolean;
  isBlocked?: boolean;
  metadata?: Record<string, unknown>;
}

export interface OperatorAuthLoginRateLimitOptions {
  maxAttempts?: number;
  windowMs?: number;
  blockDurationMs?: number;
}

export interface OperatorAuthModuleOptions {
  accessTokenSecret: string;
  refreshTokenSecret: string;
  accessTokenTtl?: OperatorAuthDuration;
  refreshTokenTtl?: OperatorAuthDuration;
  issuer?: string;
  audience?: string;
  allowedRoleCodes?: string[];
  passwordPepper?: string;
  loginRateLimit?: OperatorAuthLoginRateLimitOptions;
  seedUsers?: InMemoryOperatorAuthUser[];
  userService?: OperatorAuthUserService;
  sessionStore?: OperatorAuthSessionStore;
  loginAttemptTracker?: OperatorAuthLoginAttemptTracker;
}

export interface OperatorAuthModuleAsyncOptions {
  imports?: ModuleMetadata['imports'];
  inject?: any[];
  useFactory: (...args: any[]) =>
    | Promise<OperatorAuthModuleOptions>
    | OperatorAuthModuleOptions;
}

export interface ResolvedOperatorAuthModuleOptions
  extends Omit<
    OperatorAuthModuleOptions,
    'accessTokenTtl' | 'refreshTokenTtl' | 'loginRateLimit'
  > {
  accessTokenTtl: OperatorAuthDuration;
  refreshTokenTtl: OperatorAuthDuration;
  accessTokenTtlMs: number;
  refreshTokenTtlMs: number;
  allowedRoleCodes: string[];
  loginRateLimit: Required<OperatorAuthLoginRateLimitOptions>;
  seedUsers: InMemoryOperatorAuthUser[];
}

export interface OperatorAuthIdentity {
  id: string;
  username: string;
  fullName: string;
  passwordHash: string;
  email?: string;
  roles: string[];
  isActive: boolean;
  isBlocked: boolean;
  metadata?: Record<string, unknown>;
}

export interface OperatorSessionRecord {
  id: string;
  userId: string;
  refreshTokenHash: string;
  status: OperatorSessionStatus;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
  lastUsedAt?: Date;
}

export interface CreateOperatorSessionInput {
  id?: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface RotateOperatorSessionInput {
  sessionId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  lastUsedAt?: Date;
}

export interface OperatorAuthRequestContext {
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string;
}

export interface OperatorAuthUserService {
  findForAuth(login: string):
    | Promise<OperatorAuthIdentity | null>
    | OperatorAuthIdentity
    | null;
  findById(userId: string):
    | Promise<OperatorAuthIdentity | null>
    | OperatorAuthIdentity
    | null;
}

export interface OperatorAuthSessionStore {
  create(
    input: CreateOperatorSessionInput,
  ): Promise<OperatorSessionRecord> | OperatorSessionRecord;
  findById(
    sessionId: string,
  ): Promise<OperatorSessionRecord | null> | OperatorSessionRecord | null;
  rotateRefreshToken(
    input: RotateOperatorSessionInput,
  ): Promise<OperatorSessionRecord | null> | OperatorSessionRecord | null;
  revoke(
    sessionId: string,
    status?: OperatorSessionStatus,
  ): Promise<boolean> | boolean;
  revokeAllForUser(userId: string): Promise<number> | number;
}

export interface OperatorAuthLoginAttemptTracker {
  assertCanAttempt(key: string): Promise<void> | void;
  registerFailure(key: string): Promise<void> | void;
  reset(key: string): Promise<void> | void;
}

export interface OperatorAuthTokenPayload {
  sub: string;
  sid: string;
  username: string;
  roles: string[];
  typ: OperatorTokenType;
  jti?: string;
}

export interface OperatorAuthRequestUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  roles: string[];
  metadata?: Record<string, unknown>;
  sessionId: string;
}
