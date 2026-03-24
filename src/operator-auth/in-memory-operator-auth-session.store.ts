import { randomUUID } from 'crypto';
import {
  CreateOperatorSessionInput,
  OperatorAuthSessionStore,
  OperatorSessionRecord,
  OperatorSessionStatus,
  RotateOperatorSessionInput,
} from './operator-auth.interfaces';

export class InMemoryOperatorAuthSessionStore
  implements OperatorAuthSessionStore
{
  private readonly sessions = new Map<string, OperatorSessionRecord>();

  async create(
    input: CreateOperatorSessionInput,
  ): Promise<OperatorSessionRecord> {
    const now = new Date();
    const session: OperatorSessionRecord = {
      id: input.id ?? randomUUID(),
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      status: 'ACTIVE',
      expiresAt: input.expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
      deviceFingerprint: input.deviceFingerprint,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
    };

    this.sessions.set(session.id, session);
    return structuredClone(session);
  }

  async findById(sessionId: string): Promise<OperatorSessionRecord | null> {
    return structuredClone(this.sessions.get(sessionId) ?? null);
  }

  async rotateRefreshToken(
    input: RotateOperatorSessionInput,
  ): Promise<OperatorSessionRecord | null> {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      return null;
    }

    session.refreshTokenHash = input.refreshTokenHash;
    session.expiresAt = input.expiresAt;
    session.updatedAt = new Date();
    session.lastUsedAt = input.lastUsedAt ?? session.lastUsedAt;

    return structuredClone(session);
  }

  async revoke(
    sessionId: string,
    status: OperatorSessionStatus = 'REVOKED',
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    if (session.status !== 'ACTIVE') {
      return true;
    }

    session.status = status;
    session.revokedAt = new Date();
    session.updatedAt = new Date();
    return true;
  }

  async revokeAllForUser(userId: string): Promise<number> {
    let revokedSessions = 0;

    for (const session of this.sessions.values()) {
      if (session.userId !== userId || session.status !== 'ACTIVE') {
        continue;
      }

      session.status = 'REVOKED';
      session.revokedAt = new Date();
      session.updatedAt = new Date();
      revokedSessions += 1;
    }

    return revokedSessions;
  }
}
