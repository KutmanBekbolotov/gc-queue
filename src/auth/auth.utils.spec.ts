import {
  extractBearerToken,
  normalizeAuthContext,
  normalizeRoleCode,
  toCommonAuthUserWriteBody,
} from './auth.utils';

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
          role: 'Operator',
          roles: ['SuperAdmin', 'ROLE_Manager'],
        },
        scope: 'queue:read queue:write',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'operator@example.com',
        fullName: 'Queue Operator',
        role: 'OPERATOR',
        roles: ['SUPER_ADMIN', 'MANAGER', 'OPERATOR'],
        scopes: ['queue:read', 'queue:write'],
      }),
    );
  });

  it('normalizes role codes to the public CAPS contract', () => {
    expect(normalizeRoleCode('Operator')).toBe('OPERATOR');
    expect(normalizeRoleCode('admin')).toBe('ADMIN');
    expect(normalizeRoleCode('SuperAdmin')).toBe('SUPER_ADMIN');
    expect(normalizeRoleCode('ROLE_Manager')).toBe('MANAGER');
  });

  it('maps public user writes to Common Auth shape', () => {
    expect(
      toCommonAuthUserWriteBody({
        email: 'operator@example.com',
        password: 'StrongPassword_123!',
        fullName: 'Queue Operator',
        role: 'OPERATOR',
        scopes: ['queue:read'],
      }),
    ).toEqual({
      email: 'operator@example.com',
      password: 'StrongPassword_123!',
      name: 'Queue Operator',
      role: 'Operator',
    });
  });
});
