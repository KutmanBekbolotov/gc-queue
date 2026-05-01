import {
  DynamicModule,
  Global,
  Module,
  ModuleMetadata,
  Provider,
} from '@nestjs/common';
import { EQUEUE_CORE_MODULE_OPTIONS } from './core.constants';
import { CoreActorFactory } from './core-actor.factory';
import { CoreModuleAsyncOptions, CoreModuleOptions } from './core.interfaces';
import { resolveCoreOptions } from './core.utils';
import { EqueueCoreClient } from './equeue-core.client';

@Global()
@Module({})
export class CoreModule {
  static register(options: CoreModuleOptions): DynamicModule {
    return this.createDynamicModule(
      {
        provide: EQUEUE_CORE_MODULE_OPTIONS,
        useValue: resolveCoreOptions(options),
      },
      [],
    );
  }

  static registerAsync(options: CoreModuleAsyncOptions): DynamicModule {
    return this.createDynamicModule(
      {
        provide: EQUEUE_CORE_MODULE_OPTIONS,
        inject: options.inject ?? [],
        useFactory: async (...args: unknown[]) =>
          resolveCoreOptions(await options.useFactory(...args)),
      },
      options.imports ?? [],
    );
  }

  private static createDynamicModule(
    optionsProvider: Provider,
    imports: ModuleMetadata['imports'],
  ): DynamicModule {
    return {
      module: CoreModule,
      imports: imports ?? [],
      providers: [optionsProvider, EqueueCoreClient, CoreActorFactory],
      exports: [EQUEUE_CORE_MODULE_OPTIONS, EqueueCoreClient, CoreActorFactory],
    };
  }
}
