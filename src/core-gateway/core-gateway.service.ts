import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import type { Request } from 'express';
import { CoreActor, CoreHttpMethod } from '../core/core.interfaces';
import { EqueueCoreClient } from '../core/equeue-core.client';

const ALLOWED_METHODS: CoreHttpMethod[] = [
  'GET',
  'POST',
  'PATCH',
  'PUT',
  'DELETE',
];

@Injectable()
export class CoreGatewayService {
  constructor(private readonly core: EqueueCoreClient) {}

  proxy<T>(
    request: Request,
    path: string,
    actor: CoreActor,
    bodyOverride?: unknown,
  ): Promise<T> {
    const method = request.method.toUpperCase();

    if (!ALLOWED_METHODS.includes(method as CoreHttpMethod)) {
      throw new MethodNotAllowedException(`${method} is not supported`);
    }

    return this.core.request<T>(method as CoreHttpMethod, path, actor, {
      params: request.query as Record<string, unknown>,
      body: this.hasBody(method)
        ? (bodyOverride ?? request.body ?? {})
        : undefined,
    });
  }

  private hasBody(method: string): boolean {
    return method !== 'GET';
  }
}
