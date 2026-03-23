import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ServicesService } from '../catalog/services.service';
import { DepartmentsService } from '../departments/departments.service';
import { DepartmentServiceLink } from './entities/department-service.entity';
import { AssignDepartmentServiceDto } from './dto/assign-department-service.dto';
import { UpdateDepartmentServiceDto } from './dto/update-department-service.dto';
import { ServiceNodeType } from '../catalog/entities/service-node-type.enum';

@Injectable()
export class DepartmentServicesService {
  private links: DepartmentServiceLink[] = [];
  private nextId = 1;

  constructor(
    private readonly servicesService: ServicesService,
    private readonly departmentsService: DepartmentsService,
    private readonly auditService: AuditService,
  ) {}

  assign(dto: AssignDepartmentServiceDto): DepartmentServiceLink {
    const department = this.departmentsService.findOne(dto.departmentId);
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const service = this.servicesService.findOne(dto.serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.type !== ServiceNodeType.SERVICE) {
      throw new BadRequestException('Only executable services can be assigned to departments');
    }

    const existing = this.links.find(
      (l) => l.departmentId === dto.departmentId && l.serviceId === dto.serviceId,
    );
    if (existing) {
      const beforeState = { ...existing };
      existing.isActive = dto.isActive ?? existing.isActive;
      existing.bookingEnabled = dto.bookingEnabled ?? existing.bookingEnabled;
      existing.terminalEnabled = dto.terminalEnabled ?? existing.terminalEnabled;
      existing.operatorEnabled = dto.operatorEnabled ?? existing.operatorEnabled;
      existing.priority = dto.priority ?? existing.priority;
      existing.updatedAt = new Date();
      this.auditService.record({
        action: 'service.assigned.to.department',
        entityType: 'DepartmentService',
        entityId: existing.id,
        beforeState,
        afterState: existing,
      });
      return existing;
    }

    const now = new Date();
    const link: DepartmentServiceLink = {
      id: this.nextId++,
      departmentId: dto.departmentId,
      serviceId: dto.serviceId,
      isActive: dto.isActive ?? true,
      bookingEnabled: dto.bookingEnabled ?? true,
      terminalEnabled: dto.terminalEnabled ?? true,
      operatorEnabled: dto.operatorEnabled ?? true,
      priority: dto.priority ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    this.links.push(link);
    this.auditService.record({
      action: 'service.assigned.to.department',
      entityType: 'DepartmentService',
      entityId: link.id,
      afterState: link,
    });
    return link;
  }

  unassign(departmentId: number, serviceId: number): boolean {
    const index = this.links.findIndex(
      (l) => l.departmentId === departmentId && l.serviceId === serviceId,
    );
    if (index === -1) return false;
    const [removed] = this.links.splice(index, 1);
    this.auditService.record({
      action: 'service.removed.from.department',
      entityType: 'DepartmentService',
      entityId: removed.id,
      beforeState: removed,
    });
    return true;
  }

  findByDepartment(departmentId: number): DepartmentServiceLink[] {
    return this.links.filter((l) => l.departmentId === departmentId);
  }

  findByService(serviceId: number): DepartmentServiceLink[] {
    return this.links.filter((l) => l.serviceId === serviceId);
  }

  findOne(id: number): DepartmentServiceLink | undefined {
    return this.links.find((l) => l.id === id);
  }

  findAssignment(departmentId: number, serviceId: number): DepartmentServiceLink | undefined {
    return this.links.find((l) => l.departmentId === departmentId && l.serviceId === serviceId);
  }

  isServiceAvailable(
    departmentId: number,
    serviceId: number,
    channel?: 'booking' | 'terminal' | 'operator',
  ): boolean {
    const service = this.servicesService.findOne(serviceId);
    const department = this.departmentsService.findOne(departmentId);
    const link = this.findAssignment(departmentId, serviceId);
    if (!service || !department || !link) return false;
    if (service.type !== ServiceNodeType.SERVICE) return false;
    if (!service.isActive || !department.isActive || !link.isActive) return false;
    return this.isChannelEnabled(link, channel);
  }

  findAvailableServicesByDepartment(
    departmentId: number,
    channel?: 'booking' | 'terminal' | 'operator',
  ) {
    return this.findByDepartment(departmentId)
      .filter((link) => this.isServiceAvailable(departmentId, link.serviceId, channel))
      .sort((left, right) => left.priority - right.priority)
      .map((link) => {
        const service = this.servicesService.findOne(link.serviceId);
        if (!service) return undefined;
        return {
          ...service,
          departmentService: link,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  findAvailableDepartmentsByService(
    serviceId: number,
    channel?: 'booking' | 'terminal' | 'operator',
  ) {
    return this.findByService(serviceId)
      .filter((link) => this.isServiceAvailable(link.departmentId, serviceId, channel))
      .sort((left, right) => left.priority - right.priority)
      .map((link) => {
        const department = this.departmentsService.findOne(link.departmentId);
        if (!department) return undefined;
        return {
          ...department,
          departmentService: link,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }

  update(id: number, dto: UpdateDepartmentServiceDto): DepartmentServiceLink | undefined {
    const link = this.findOne(id);
    if (!link) return undefined;
    const beforeState = { ...link };
    if (dto.isActive !== undefined) link.isActive = dto.isActive;
    if (dto.bookingEnabled !== undefined) link.bookingEnabled = dto.bookingEnabled;
    if (dto.terminalEnabled !== undefined) link.terminalEnabled = dto.terminalEnabled;
    if (dto.operatorEnabled !== undefined) link.operatorEnabled = dto.operatorEnabled;
    if (dto.priority !== undefined) link.priority = dto.priority;
    link.updatedAt = new Date();
    this.auditService.record({
      action: dto.isActive === false ? 'department.service.disabled' : 'department.service.updated',
      entityType: 'DepartmentService',
      entityId: link.id,
      beforeState,
      afterState: link,
    });
    return link;
  }

  remove(id: number): boolean {
    const index = this.links.findIndex((l) => l.id === id);
    if (index === -1) return false;
    const [removed] = this.links.splice(index, 1);
    this.auditService.record({
      action: 'department.service.removed',
      entityType: 'DepartmentService',
      entityId: removed.id,
      beforeState: removed,
    });
    return true;
  }

  private isChannelEnabled(
    link: DepartmentServiceLink,
    channel?: 'booking' | 'terminal' | 'operator',
  ): boolean {
    if (!channel) return true;
    if (channel === 'booking') return link.bookingEnabled;
    if (channel === 'terminal') return link.terminalEnabled;
    if (channel === 'operator') return link.operatorEnabled;
    return false;
  }
}
