export class AuditLog {
  id: number;
  actorId?: string;
  actorType: string;
  ip?: string;
  userAgent?: string;
  deviceId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeState?: unknown;
  afterState?: unknown;
  timestamp: Date;
  correlationId: string;
}
