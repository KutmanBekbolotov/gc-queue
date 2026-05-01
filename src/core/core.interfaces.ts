import { ModuleMetadata } from '@nestjs/common';

export type ActorRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'AUDITOR'
  | 'MANAGER'
  | 'OPERATOR'
  | 'TERMINAL'
  | 'TV'
  | 'SYSTEM';

export type CoreLanguage = 'ru' | 'ky';

export type CoreHttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface CoreActor {
  actorId: string;
  role: ActorRole;
  departmentId?: string;
  windowId?: string;
  language?: CoreLanguage;
  requestId?: string;
}

export interface CoreModuleOptions {
  baseUrl: string;
  internalToken: string;
  timeoutMs?: number;
}

export interface CoreModuleAsyncOptions {
  imports?: ModuleMetadata['imports'];
  inject?: any[];
  useFactory: (
    ...args: unknown[]
  ) => Promise<CoreModuleOptions> | CoreModuleOptions;
}

export interface ResolvedCoreModuleOptions {
  baseUrl: string;
  internalToken: string;
  timeoutMs: number;
}

export type CoreProxyResponse =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export interface CoreRequestOptions {
  body?: unknown;
  params?: Record<string, unknown>;
}
