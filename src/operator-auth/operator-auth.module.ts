import { DynamicModule, Module, ModuleMetadata, Provider } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OperatorAuthController } from './operator-auth.controller';
import {
  OPERATOR_AUTH_LOGIN_ATTEMPT_TRACKER,
  OPERATOR_AUTH_OPTIONS,
  OPERATOR_AUTH_SESSION_STORE,
  OPERATOR_AUTH_USER_SERVICE,
} from './operator-auth.constants';
import { InMemoryOperatorAuthLoginAttemptTracker } from './in-memory-operator-auth-login-attempt-tracker';
import { InMemoryOperatorAuthSessionStore } from './in-memory-operator-auth-session.store';
import { InMemoryOperatorAuthUserService } from './in-memory-operator-auth-user.service';
import {
  OperatorAuthModuleAsyncOptions,
  OperatorAuthModuleOptions,
  ResolvedOperatorAuthModuleOptions,
} from './operator-auth.interfaces';
import { OperatorPasswordHashService } from './operator-password-hash.service';
import { OperatorAuthGuard } from './guards/operator-auth.guard';
import { OperatorRolesGuard } from './guards/operator-roles.guard';
import { OperatorAuthService } from './operator-auth.service';
import { resolveOperatorAuthOptions } from './operator-auth.utils';

@Module({})
export class OperatorAuthModule {
  static register(options: OperatorAuthModuleOptions): DynamicModule {
    return this.createDynamicModule(
      {
        provide: OPERATOR_AUTH_OPTIONS,
        useValue: resolveOperatorAuthOptions(options),
      },
      [],
    );
  }

  static registerAsync(options: OperatorAuthModuleAsyncOptions): DynamicModule {
    return this.createDynamicModule(
      {
        provide: OPERATOR_AUTH_OPTIONS,
        inject: options.inject ?? [],
        useFactory: async (...args: any[]) =>
          resolveOperatorAuthOptions(await options.useFactory(...args)),
      },
      options.imports ?? [],
    );
  }

  private static createDynamicModule(
    optionsProvider: Provider,
    imports: ModuleMetadata['imports'],
  ): DynamicModule {
    return {
      module: OperatorAuthModule,
      imports: [...(imports ?? []), JwtModule.register({})],
      controllers: [OperatorAuthController],
      providers: [
        optionsProvider,
        OperatorPasswordHashService,
        OperatorAuthService,
        OperatorAuthGuard,
        OperatorRolesGuard,
        this.createUserServiceProvider(),
        this.createSessionStoreProvider(),
        this.createLoginAttemptTrackerProvider(),
      ],
      exports: [
        OPERATOR_AUTH_OPTIONS,
        OPERATOR_AUTH_USER_SERVICE,
        OPERATOR_AUTH_SESSION_STORE,
        OPERATOR_AUTH_LOGIN_ATTEMPT_TRACKER,
        OperatorPasswordHashService,
        OperatorAuthService,
        OperatorAuthGuard,
        OperatorRolesGuard,
      ],
    };
  }

  private static createUserServiceProvider(): Provider {
    return {
      provide: OPERATOR_AUTH_USER_SERVICE,
      inject: [OPERATOR_AUTH_OPTIONS, OperatorPasswordHashService],
      useFactory: async (
        options: ResolvedOperatorAuthModuleOptions,
        passwordHashService: OperatorPasswordHashService,
      ) =>
        options.userService ??
        InMemoryOperatorAuthUserService.fromSeedUsers(
          options.seedUsers,
          passwordHashService,
        ),
    };
  }

  private static createSessionStoreProvider(): Provider {
    return {
      provide: OPERATOR_AUTH_SESSION_STORE,
      inject: [OPERATOR_AUTH_OPTIONS],
      useFactory: (options: ResolvedOperatorAuthModuleOptions) =>
        options.sessionStore ?? new InMemoryOperatorAuthSessionStore(),
    };
  }

  private static createLoginAttemptTrackerProvider(): Provider {
    return {
      provide: OPERATOR_AUTH_LOGIN_ATTEMPT_TRACKER,
      inject: [OPERATOR_AUTH_OPTIONS],
      useFactory: (options: ResolvedOperatorAuthModuleOptions) =>
        options.loginAttemptTracker ??
        new InMemoryOperatorAuthLoginAttemptTracker(options.loginRateLimit),
    };
  }
}
