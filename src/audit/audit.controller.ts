import { Controller, Get, Query } from '@nestjs/common';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditService } from './audit.service';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() query: QueryAuditLogsDto) {
    return this.auditService.findAll(query);
  }
}
