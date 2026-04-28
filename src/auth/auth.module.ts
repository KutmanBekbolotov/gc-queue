import {
  DynamicModule,
  Module,
  ModuleMetadata,
  Provider,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AdminUsersController } from './admin-users.controller';
import { AUTH_MODULE_OPTIONS } from './auth.constants';
import { AuthController } from './auth.controller';
import { AuthModuleAsyncOptions, AuthModuleOptions } from './auth.interfaces';
import { AuthService } from './auth.service';
import { resolveAuthOptions } from './auth.utils';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({})
export class AuthModule {
  static register(options: AuthModuleOptions): DynamicModule {
    return this.createDynamicModule(
      {
        provide: AUTH_MODULE_OPTIONS,
        useValue: resolveAuthOptions(options),
      },
      [],
    );
  }

  static registerAsync(options: AuthModuleAsyncOptions): DynamicModule {
    return this.createDynamicModule(
      {
        provide: AUTH_MODULE_OPTIONS,
        inject: options.inject ?? [],
        useFactory: async (...args: unknown[]) =>
          resolveAuthOptions(await options.useFactory(...args)),
      },
      options.imports ?? [],
    );
  }

  private static createDynamicModule(
    optionsProvider: Provider,
    imports: ModuleMetadata['imports'],
  ): DynamicModule {
    return {
      module: AuthModule,
      imports: imports ?? [],
      controllers: [AuthController, AdminUsersController],
      providers: [
        optionsProvider,
        AuthService,
        AuthGuard,
        RolesGuard,
        {
          provide: APP_GUARD,
          useExisting: AuthGuard,
        },
        {
          provide: APP_GUARD,
          useExisting: RolesGuard,
        },
      ],
      exports: [AUTH_MODULE_OPTIONS, AuthService, AuthGuard, RolesGuard],
    };
  }
}
