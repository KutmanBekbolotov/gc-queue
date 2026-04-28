import { ValidationPipe } from '@nestjs/common';
import { INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Server } from 'http';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';

@Module({
  imports: [
    AuthModule.register({
      baseUrl: 'http://common-auth.test',
      timeoutMs: 1000,
    }),
  ],
})
class AuthTestModule {}

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    fetchMock = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock as unknown as typeof fetch;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterEach(async () => {
    await app.close();
    global.fetch = originalFetch;
  });

  it('proxies login to Common Auth', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        accessToken: 'access-token',
        tokenType: 'Bearer',
      }),
    );

    const response = await request(server)
      .post('/auth/login')
      .send({
        email: 'operator@example.com',
        password: 'StrongPassword_123!',
      })
      .expect(200);

    expect(response.body).toEqual({
      accessToken: 'access-token',
      tokenType: 'Bearer',
    });
    const [url, init] = getFetchCall(fetchMock, 0);
    expect(url).toBe('http://common-auth.test/auth/login');
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(
      JSON.stringify({
        email: 'operator@example.com',
        password: 'StrongPassword_123!',
      }),
    );
  });

  it('validates bearer tokens through /auth/me', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: 'user-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        scopes: ['queue:read'],
      }),
    );

    const response = await request(server)
      .get('/auth/me')
      .set('Authorization', 'Bearer access-token')
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'operator@example.com',
        roles: ['OPERATOR'],
        scopes: ['queue:read'],
      }),
    );
    const [url, init] = getFetchCall(fetchMock, 0);
    expect(url).toBe('http://common-auth.test/auth/me');
    expect(init?.method).toBe('GET');
    expect(getHeader(init, 'authorization')).toBe('Bearer access-token');
  });

  it('rejects protected routes without bearer token', async () => {
    await request(server).get('/auth/me').expect(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('proxies admin user operations after token validation', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'admin-1',
          email: 'admin@example.com',
          roles: ['ADMIN'],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'user-2',
          email: 'new-user@example.com',
        }),
      );

    await request(server)
      .post('/admin/users')
      .set('Authorization', 'Bearer admin-token')
      .send({
        email: 'new-user@example.com',
        password: 'StrongPassword_123!',
        role: 'OPERATOR',
      })
      .expect(201);

    const [meUrl] = getFetchCall(fetchMock, 0);
    const [adminUrl, adminInit] = getFetchCall(fetchMock, 1);

    expect(meUrl).toBe('http://common-auth.test/auth/me');
    expect(adminUrl).toBe('http://common-auth.test/admin/users');
    expect(adminInit?.method).toBe('POST');
    expect(getHeader(adminInit, 'authorization')).toBe('Bearer admin-token');
    expect(adminInit?.body).toBe(
      JSON.stringify({
        email: 'new-user@example.com',
        password: 'StrongPassword_123!',
        role: 'OPERATOR',
      }),
    );
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function getFetchCall(
  mock: jest.MockedFunction<typeof fetch>,
  index: number,
): Parameters<typeof fetch> {
  const call = mock.mock.calls[index];

  if (!call) {
    throw new Error(`Expected fetch call ${index} to exist`);
  }

  return call;
}

function getHeader(
  init: RequestInit | undefined,
  name: string,
): string | undefined {
  const headers = init?.headers as Record<string, string> | undefined;
  return headers?.[name];
}
