import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLog } from './entities/audit-log.entity';
import { AuditRecord } from './interfaces/audit-record.interface';

@Injectable()
export class AuditService {
  private readonly logs: AuditLog[] = [];
  private nextId = 1;

  record(entry: AuditRecord): AuditLog {
    const log: AuditLog = {
      id: this.nextId++,
      actorId: entry.actorId,
      actorType: entry.actorType ?? 'SYSTEM',
      ip: entry.ip,
      userAgent: entry.userAgent,
      deviceId: entry.deviceId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId?.toString(),
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      timestamp: new Date(),
      correlationId: entry.correlationId ?? randomUUID(),
    };

    this.logs.unshift(log);
    return log;
  }

  findAll(query?: QueryAuditLogsDto): AuditLog[] {
    return this.logs.filter((log) => {
      if (query?.actorId && log.actorId !== query.actorId) return false;
      if (query?.actorType && log.actorType !== query.actorType) return false;
      if (query?.action && log.action !== query.action) return false;
      if (query?.entityType && log.entityType !== query.entityType) return false;
      if (query?.entityId && log.entityId !== query.entityId) return false;
      if (query?.correlationId && log.correlationId !== query.correlationId) return false;
      return true;
    });
  }
}
