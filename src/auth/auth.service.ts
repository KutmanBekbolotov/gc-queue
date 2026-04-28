import {
  GatewayTimeoutException,
  BadGatewayException,
  HttpException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_MODULE_OPTIONS } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import {
  AuthProxyResponse,
  AuthRequestUser,
  ResolvedAuthModuleOptions,
} from './auth.interfaces';
import { normalizeAuthContext } from './auth.utils';

type AuthHttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface AuthProxyRequestOptions {
  token?: string;
  body?: unknown;
  request?: Request;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_MODULE_OPTIONS)
    private readonly options: ResolvedAuthModuleOptions,
  ) {}

  login(dto: LoginDto, request?: Request) {
    return this.request('POST', '/auth/login', {
      body: dto,
      request,
    });
  }

  async getCurrentUser(
    token: string,
    request?: Request,
  ): Promise<AuthRequestUser> {
    const payload = await this.getCurrentUserRaw(token, request);
    return normalizeAuthContext(payload);
  }

  getCurrentUserRaw(token: string, request?: Request) {
    return this.request('GET', '/auth/me', {
      token,
      request,
    });
  }

  logout(token: string, request?: Request) {
    return this.request('POST', '/auth/logout', {
      token,
      request,
    });
  }

  listUsers(token: string, request?: Request) {
    return this.request('GET', '/admin/users', {
      token,
      request,
    });
  }

  createUser(token: string, body: Record<string, unknown>, request?: Request) {
    return this.request('POST', '/admin/users', {
      token,
      body,
      request,
    });
  }

  updateUser(
    token: string,
    id: string,
    body: Record<string, unknown>,
    request?: Request,
  ) {
    return this.request('PATCH', `/admin/users/${encodeURIComponent(id)}`, {
      token,
      body,
      request,
    });
  }

  deleteUser(token: string, id: string, request?: Request) {
    return this.request('DELETE', `/admin/users/${encodeURIComponent(id)}`, {
      token,
      request,
    });
  }

  updateUserRole(
    token: string,
    id: string,
    body: Record<string, unknown>,
    request?: Request,
  ) {
    return this.request(
      'PATCH',
      `/admin/users/${encodeURIComponent(id)}/role`,
      {
        token,
        body,
        request,
      },
    );
  }

  private async request(
    method: AuthHttpMethod,
    path: string,
    options: AuthProxyRequestOptions = {},
  ): Promise<AuthProxyResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs,
    );

    let response: Response;

    try {
      response = await fetch(this.buildUrl(path), {
        method,
        headers: this.buildHeaders(options),
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('Auth service request timed out');
      }

      throw new ServiceUnavailableException('Auth service is unavailable');
    } finally {
      clearTimeout(timeout);
    }

    const body = await this.parseBody(response);

    if (!response.ok) {
      throw new HttpException(
        body ?? { message: 'Auth service rejected the request' },
        response.status,
      );
    }

    return body ?? { success: true };
  }

  private buildUrl(path: string): string {
    return `${this.options.baseUrl}${path}`;
  }

  private buildHeaders(options: AuthProxyRequestOptions): HeadersInit {
    const headers: Record<string, string> = {
      accept: 'application/json',
    };

    if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
    }

    if (options.token) {
      headers.authorization = `Bearer ${options.token}`;
    }

    this.forwardHeader(headers, options.request, 'user-agent');
    this.forwardHeader(headers, options.request, 'x-request-id');
    this.forwardHeader(headers, options.request, 'x-correlation-id');
    this.forwardHeader(headers, options.request, 'x-forwarded-for');
    this.forwardHeader(headers, options.request, 'x-real-ip');

    return headers;
  }

  private forwardHeader(
    target: Record<string, string>,
    request: Request | undefined,
    name: string,
  ) {
    const value = request?.headers[name];

    if (Array.isArray(value)) {
      target[name] = value[0];
      return;
    }

    if (typeof value === 'string') {
      target[name] = value;
    }
  }

  private async parseBody(response: Response): Promise<AuthProxyResponse> {
    const text = await response.text();

    if (!text) {
      return null;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      try {
        return JSON.parse(text) as AuthProxyResponse;
      } catch {
        throw new BadGatewayException('Auth service returned invalid JSON');
      }
    }

    try {
      return JSON.parse(text) as AuthProxyResponse;
    } catch {
      return text;
    }
  }
}
