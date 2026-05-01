import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CoreModule } from './core.module';
import { EqueueCoreClient } from './equeue-core.client';

describe('EqueueCoreClient', () => {
  let moduleRef: TestingModule;
  let client: EqueueCoreClient;
  let fetchMock: jest.MockedFunction<typeof fetch>;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    fetchMock = jest.fn() as unknown as jest.MockedFunction<typeof fetch>;
    global.fetch = fetchMock as unknown as typeof fetch;

    moduleRef = await Test.createTestingModule({
      imports: [
        CoreModule.register({
          baseUrl: 'http://spring-core.test/api/',
          internalToken: 'internal-secret',
          timeoutMs: 1000,
        }),
      ],
    }).compile();

    client = moduleRef.get(EqueueCoreClient);
  });

  afterEach(async () => {
    await moduleRef.close();
    global.fetch = originalFetch;
  });

  it('sends internal token and actor headers to Spring core', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ticketNumber: '0023' }));

    await client.post(
      '/internal/tickets/operator/next',
      {
        actorId: 'operator-1',
        role: 'OPERATOR',
        departmentId: 'department-1',
        windowId: 'window-1',
        language: 'ky',
        requestId: 'req-1',
      },
      { source: 'test' },
    );

    const [url, init] = getFetchCall(fetchMock, 0);
    const headers = init?.headers as Record<string, string>;

    expect(url).toBe(
      'http://spring-core.test/api/internal/tickets/operator/next',
    );
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe(JSON.stringify({ source: 'test' }));
    expect(headers['X-Internal-Token']).toBe('internal-secret');
    expect(headers['X-Actor-Id']).toBe('operator-1');
    expect(headers['X-Actor-Role']).toBe('OPERATOR');
    expect(headers['X-Department-Id']).toBe('department-1');
    expect(headers['X-Window-Id']).toBe('window-1');
    expect(headers['X-Request-Id']).toBe('req-1');
    expect(headers['Accept-Language']).toBe('ky');
  });

  it('preserves Spring core structured errors', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          status: 409,
          code: 'TICKET_STATE_CONFLICT',
          message: 'Ticket cannot be changed',
          requestId: 'core-req-1',
          errors: {
            ticketId: 'Invalid state',
          },
        },
        409,
      ),
    );

    try {
      await client.get('/internal/tickets/restorable', {
        actorId: 'operator-1',
        role: 'OPERATOR',
        requestId: 'req-1',
      });
      throw new Error('Expected Spring core request to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const exception = error as HttpException;

      expect(exception.getStatus()).toBe(409);
      expect(exception.getResponse()).toEqual({
        status: 409,
        code: 'TICKET_STATE_CONFLICT',
        message: 'Ticket cannot be changed',
        requestId: 'core-req-1',
        errors: {
          ticketId: 'Invalid state',
        },
      });
    }
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
