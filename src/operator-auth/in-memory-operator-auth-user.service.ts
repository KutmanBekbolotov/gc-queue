import { randomUUID } from 'crypto';
import {
  InMemoryOperatorAuthUser,
  OperatorAuthIdentity,
  OperatorAuthUserService,
} from './operator-auth.interfaces';
import {
  normalizeLogin,
  normalizeRoleCode,
} from './operator-auth.utils';
import { OperatorPasswordHashService } from './operator-password-hash.service';

export class InMemoryOperatorAuthUserService implements OperatorAuthUserService {
  private readonly identitiesById = new Map<string, OperatorAuthIdentity>();
  private readonly loginIndex = new Map<string, string>();

  private constructor(users: OperatorAuthIdentity[]) {
    for (const user of users) {
      const normalizedUsername = normalizeLogin(user.username);
      this.assertUniqueLogin(normalizedUsername);
      this.loginIndex.set(normalizedUsername, user.id);

      if (user.email) {
        const normalizedEmail = normalizeLogin(user.email);
        this.assertUniqueLogin(normalizedEmail);
        this.loginIndex.set(normalizedEmail, user.id);
      }

      this.identitiesById.set(user.id, structuredClone(user));
    }
  }

  static async fromSeedUsers(
    users: InMemoryOperatorAuthUser[],
    passwordHashService: OperatorPasswordHashService,
  ): Promise<InMemoryOperatorAuthUserService> {
    const identities = await Promise.all(
      users.map(async (user) => {
        const passwordHash =
          user.passwordHash ??
          (user.password
            ? await passwordHashService.hash(user.password)
            : undefined);

        if (!passwordHash) {
          throw new Error(
            `Seed auth user "${user.username}" must have password or passwordHash`,
          );
        }

        return {
          id: user.id ?? randomUUID(),
          username: user.username.trim(),
          fullName: user.fullName.trim(),
          passwordHash,
          email: user.email?.trim(),
          roles: (user.roles ?? ['OPERATOR']).map(normalizeRoleCode),
          isActive: user.isActive ?? true,
          isBlocked: user.isBlocked ?? false,
          metadata: user.metadata,
        } satisfies OperatorAuthIdentity;
      }),
    );

    return new InMemoryOperatorAuthUserService(identities);
  }

  async findForAuth(login: string): Promise<OperatorAuthIdentity | null> {
    const userId = this.loginIndex.get(normalizeLogin(login));
    if (!userId) {
      return null;
    }
    return structuredClone(this.identitiesById.get(userId) ?? null);
  }

  async findById(userId: string): Promise<OperatorAuthIdentity | null> {
    return structuredClone(this.identitiesById.get(userId) ?? null);
  }

  private assertUniqueLogin(login: string) {
    if (this.loginIndex.has(login)) {
      throw new Error(`Duplicate auth login "${login}" in seed users`);
    }
  }
}
