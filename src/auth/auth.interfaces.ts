import { ModuleMetadata } from '@nestjs/common';

export interface AuthModuleOptions {
  baseUrl: string;
  timeoutMs?: number;
}

export interface AuthModuleAsyncOptions {
  imports?: ModuleMetadata['imports'];
  inject?: any[];
  useFactory: (
    ...args: unknown[]
  ) => Promise<AuthModuleOptions> | AuthModuleOptions;
}

export interface ResolvedAuthModuleOptions {
  baseUrl: string;
  timeoutMs: number;
}

export interface AuthRequestUser extends Record<string, unknown> {
  id?: string;
  email?: string;
  username?: string;
  fullName?: string;
  role?: string;
  roles: string[];
  scopes: string[];
}

export type AuthProxyResponse =
  | Record<string, unknown>
  | unknown[]
  | string
  | null;
