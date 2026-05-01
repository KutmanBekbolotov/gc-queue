import {
  CoreModuleOptions,
  ResolvedCoreModuleOptions,
} from './core.interfaces';

export function resolveCoreOptions(
  options: CoreModuleOptions,
): ResolvedCoreModuleOptions {
  const baseUrl = options.baseUrl?.trim().replace(/\/+$/, '');
  const internalToken = options.internalToken?.trim();

  if (!baseUrl) {
    throw new Error('EQUEUE_CORE_URL must be provided');
  }

  if (!internalToken) {
    throw new Error('EQUEUE_CORE_INTERNAL_TOKEN must be provided');
  }

  return {
    baseUrl,
    internalToken,
    timeoutMs:
      typeof options.timeoutMs === 'number' &&
      Number.isFinite(options.timeoutMs) &&
      options.timeoutMs > 0
        ? options.timeoutMs
        : 10_000,
  };
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
