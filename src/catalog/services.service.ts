import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ServiceEntity } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  private services: ServiceEntity[] = [];
  private nextId = 1;

  constructor(private readonly auditService: AuditService) {}

  create(dto: CreateServiceDto): ServiceEntity {
    const now = new Date();
    const item: ServiceEntity = {
      id: this.nextId++,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? '',
      isActive: dto.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.services.push(item);
    this.auditService.record({
      action: 'service.created',
      entityType: 'Service',
      entityId: item.id,
      afterState: item,
    });
    return item;
  }

  findAll(): ServiceEntity[] {
    return this.services;
  }

  findOne(id: number): ServiceEntity | undefined {
    return this.services.find((item) => item.id === id);
  }

  update(id: number, dto: UpdateServiceDto): ServiceEntity | undefined {
    const item = this.findOne(id);
    if (!item) return undefined;
    const beforeState = { ...item };
    if (dto.code !== undefined) item.code = dto.code;
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.isActive !== undefined) item.isActive = dto.isActive;
    item.updatedAt = new Date();
    this.auditService.record({
      action: 'service.updated',
      entityType: 'Service',
      entityId: item.id,
      beforeState,
      afterState: item,
    });
    return item;
  }

  remove(id: number): boolean {
    const index = this.services.findIndex((item) => item.id === id);
    if (index === -1) return false;
    const [removed] = this.services.splice(index, 1);
    this.auditService.record({
      action: 'service.removed',
      entityType: 'Service',
      entityId: removed.id,
      beforeState: removed,
    });
    return true;
  }
}
