import {
  applyCreatorDepartmentScope,
  assertManagerCreateContext,
  AuthRoleCode,
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
          username: 'operator',
          orgId: 'ord-1',
          departmentId: 'department-1',
          role: 'Operator',
          roles: ['SuperAdmin', 'ROLE_Manager'],
        },
        scope: 'queue:read queue:write',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'user-1',
        email: 'operator@example.com',
        username: 'operator',
        fullName: 'operator',
        ordId: 'ord-1',
        departmentId: 'department-1',
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
        fullName: 'operator',
        role: 'OPERATOR',
        ordId: 'ord-1',
        departmentId: 'department-1',
        scopes: ['queue:read'],
      }),
    ).toEqual({
      email: 'operator@example.com',
      password: 'StrongPassword_123!',
      username: 'operator',
      role: 'Operator',
      ordId: 'ord-1',
      departmentId: 'department-1',
    });
  });

  it('prefers explicit username over compatibility fullName', () => {
    expect(
      toCommonAuthUserWriteBody({
        email: 'operator@example.com',
        password: 'StrongPassword_123!',
        username: 'operator-login',
        fullName: 'Queue Operator',
        role: 'OPERATOR',
      }),
    ).toEqual({
      email: 'operator@example.com',
      password: 'StrongPassword_123!',
      username: 'operator-login',
      role: 'Operator',
    });
  });

  it('requires organization and department when creating a manager', () => {
    expect(() =>
      assertManagerCreateContext({
        email: 'manager@example.com',
        password: 'StrongPassword_123!',
        username: 'manager',
        role: AuthRoleCode.MANAGER,
      }),
    ).toThrow('ordId and departmentId are required when creating MANAGER');

    expect(() =>
      assertManagerCreateContext({
        email: 'manager@example.com',
        password: 'StrongPassword_123!',
        username: 'manager',
        role: AuthRoleCode.MANAGER,
        ordId: 'ord-1',
        departmentId: 'department-1',
      }),
    ).not.toThrow();
  });

  it('applies current manager organization and department to created users', () => {
    expect(
      applyCreatorDepartmentScope(
        {
          email: 'operator@example.com',
          password: 'StrongPassword_123!',
          username: 'operator',
          role: AuthRoleCode.OPERATOR,
          ordId: 'other-ord',
          departmentId: 'other-department',
        },
        {
          id: 'manager-1',
          role: 'MANAGER',
          roles: ['MANAGER'],
          scopes: [],
          ordId: 'ord-1',
          departmentId: 'department-1',
        },
      ),
    ).toEqual(
      expect.objectContaining({
        ordId: 'ord-1',
        departmentId: 'department-1',
      }),
    );
  });
});
