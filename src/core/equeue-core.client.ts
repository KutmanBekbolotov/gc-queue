import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EQUEUE_CORE_MODULE_OPTIONS } from './core.constants';
import {
  CoreActor,
  CoreHttpMethod,
  CoreProxyResponse,
  CoreRequestOptions,
  ResolvedCoreModuleOptions,
} from './core.interfaces';
import { isRecord } from './core.utils';

@Injectable()
export class EqueueCoreClient {
  constructor(
    @Inject(EQUEUE_CORE_MODULE_OPTIONS)
    private readonly options: ResolvedCoreModuleOptions,
  ) {}

  get<T = CoreProxyResponse>(
    path: string,
    actor: CoreActor,
    params?: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>('GET', path, actor, { params });
  }

  post<T = CoreProxyResponse>(
    path: string,
    actor: CoreActor,
    body?: unknown,
  ): Promise<T> {
    return this.request<T>('POST', path, actor, { body: body ?? {} });
  }

  patch<T = CoreProxyResponse>(
    path: string,
    actor: CoreActor,
    body?: unknown,
  ): Promise<T> {
    return this.request<T>('PATCH', path, actor, { body: body ?? {} });
  }

  delete<T = CoreProxyResponse>(
    path: string,
    actor: CoreActor,
    body?: unknown,
  ): Promise<T> {
    return this.request<T>('DELETE', path, actor, {
      body: body ?? undefined,
    });
  }

  async request<T = CoreProxyResponse>(
    method: CoreHttpMethod,
    path: string,
    actor: CoreActor,
    requestOptions: CoreRequestOptions = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs,
    );
    const headers = this.headers(actor, requestOptions.body !== undefined);

    let response: Response;

    try {
      response = await fetch(this.buildUrl(path, requestOptions.params), {
        method,
        headers,
        body:
          requestOptions.body === undefined
            ? undefined
            : JSON.stringify(requestOptions.body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('Spring core request timed out');
      }

      throw new ServiceUnavailableException('Spring core is unavailable');
    } finally {
      clearTimeout(timeout);
    }

    const body = await this.parseBody(response);

    if (!response.ok) {
      throw this.toHttpException(
        body,
        response.status,
        headers['X-Request-Id'],
      );
    }

    return (body ?? { success: true }) as T;
  }

  private headers(actor: CoreActor, hasBody: boolean): Record<string, string> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      'X-Internal-Token': this.options.internalToken,
      'X-Actor-Id': actor.actorId,
      'X-Actor-Role': actor.role,
      'X-Request-Id': actor.requestId ?? randomUUID(),
      'Accept-Language': actor.language ?? 'ru',
    };

    if (hasBody) {
      headers['content-type'] = 'application/json';
    }

    if (actor.departmentId) {
      headers['X-Department-Id'] = actor.departmentId;
    }

    if (actor.windowId) {
      headers['X-Window-Id'] = actor.windowId;
    }

    return headers;
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.options.baseUrl}${normalizedPath}`);

    for (const [key, value] of Object.entries(params ?? {})) {
      this.appendQueryParam(url, key, value);
    }

    return url.toString();
  }

  private appendQueryParam(url: URL, key: string, value: unknown) {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        this.appendQueryParam(url, key, item);
      }
      return;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      url.searchParams.append(key, String(value));
      return;
    }

    url.searchParams.append(key, JSON.stringify(value));
  }

  private async parseBody(response: Response): Promise<CoreProxyResponse> {
    const text = await response.text();

    if (!text) {
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text) as CoreProxyResponse;
      } catch {
        throw new BadGatewayException('Spring core returned invalid JSON');
      }
    }

    try {
      return JSON.parse(text) as CoreProxyResponse;
    } catch {
      return text;
    }
  }

  private toHttpException(
    body: CoreProxyResponse,
    status: number,
    requestId: string,
  ): HttpException {
    if (isRecord(body)) {
      return new HttpException(
        {
          status: typeof body.status === 'number' ? body.status : status,
          code: typeof body.code === 'string' ? body.code : 'CORE_HTTP_ERROR',
          message:
            typeof body.message === 'string'
              ? body.message
              : 'Spring core rejected the request',
          errors: body.errors,
          requestId:
            typeof body.requestId === 'string' ? body.requestId : requestId,
        },
        status,
      );
    }

    return new HttpException(
      {
        status,
        code: 'CORE_HTTP_ERROR',
        message:
          typeof body === 'string' ? body : 'Spring core rejected the request',
        requestId,
      },
      status,
    );
  }
}
