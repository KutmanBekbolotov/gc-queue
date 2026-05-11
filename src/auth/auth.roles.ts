export enum AuthRoleCode {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CEO = 'CEO',
  LICENSE = 'LICENSE',
  SPEC = 'SPEC',
  HR = 'HR',
  OVK = 'OVK',
  TV = 'TV',
  TERMINAL = 'TERMINAL',
  MANAGER = 'MANAGER',
  AUDITOR = 'AUDITOR',
  OPERATOR = 'OPERATOR',
  SYSTEM = 'SYSTEM',
}

const ROLE_ALIASES: Record<string, AuthRoleCode> = {
  SUPERADMIN: AuthRoleCode.SUPER_ADMIN,
  SUPER_ADMIN: AuthRoleCode.SUPER_ADMIN,
};

const COMMON_AUTH_ROLE_BY_CODE: Record<AuthRoleCode, string> = {
  [AuthRoleCode.SUPER_ADMIN]: 'SuperAdmin',
  [AuthRoleCode.ADMIN]: 'admin',
  [AuthRoleCode.CEO]: 'ceo',
  [AuthRoleCode.LICENSE]: 'license',
  [AuthRoleCode.SPEC]: 'spec',
  [AuthRoleCode.HR]: 'hr',
  [AuthRoleCode.OVK]: 'ovk',
  [AuthRoleCode.TV]: 'TV',
  [AuthRoleCode.TERMINAL]: 'Terminal',
  [AuthRoleCode.MANAGER]: 'Manager',
  [AuthRoleCode.AUDITOR]: 'Auditor',
  [AuthRoleCode.OPERATOR]: 'Operator',
  [AuthRoleCode.SYSTEM]: 'System',
};

export function normalizeRoleCode(role: string): string {
  const normalized = role
    .trim()
    .replace(/^ROLE[_\s-]*/i, '')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toUpperCase();

  return ROLE_ALIASES[normalized] ?? normalized;
}

export function toCommonAuthRole(role: string): string {
  const normalized = normalizeRoleCode(role);
  return COMMON_AUTH_ROLE_BY_CODE[normalized as AuthRoleCode] ?? role.trim();
}
