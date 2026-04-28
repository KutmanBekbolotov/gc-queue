import { extractBearerToken, normalizeAuthContext } from './auth.utils';

describe('auth utils', () => {
  it('extracts bearer tokens', () => {
    expect(extractBearerToken('Bearer access-token')).toBe('access-token');
    expect(extractBearerToken('Basic access-token')).toBeNull();
    expect(extractBearerToken()).toBeNull();
  });

  it('normalizes Common Auth user context', () => {
    expect(
      normalizeAuthContext({
        user: {
          id: 'user-1',
          email: 'operator@example.com',
          name: 'Queue Operator',
          role: 'OPERATOR',
        },
        scope: 'queue:read queue:write',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'operator@example.com',
        fullName: 'Queue Operator',
        roles: ['OPERATOR'],
        scopes: ['queue:read', 'queue:write'],
      }),
    );
  });
});
