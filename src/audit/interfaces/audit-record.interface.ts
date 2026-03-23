export interface AuditRecord {
  actorId?: string;
  actorType?: string;
  ip?: string;
  userAgent?: string;
  deviceId?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  beforeState?: unknown;
  afterState?: unknown;
  correlationId?: string;
}
