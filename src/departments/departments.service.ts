import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  private departments: Department[] = [];
  private nextId = 1;

  constructor(private readonly auditService: AuditService) {}

  create(dto: CreateDepartmentDto): Department {
    const now = new Date();
    const department: Department = {
      id: this.nextId++,
      branchId: dto.branchId,
      code: dto.code,
      name: dto.name,
      isActive: dto.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.departments.push(department);
    this.auditService.record({
      action: 'department.created',
      entityType: 'Department',
      entityId: department.id,
      afterState: department,
    });
    return department;
  }

  findAll(): Department[] {
    return this.departments;
  }

  findOne(id: number): Department | undefined {
    return this.departments.find((item) => item.id === id);
  }

  update(id: number, dto: UpdateDepartmentDto): Department | undefined {
    const department = this.findOne(id);
    if (!department) return undefined;
    const beforeState = { ...department };
    if (dto.branchId !== undefined) department.branchId = dto.branchId;
    if (dto.code !== undefined) department.code = dto.code;
    if (dto.name !== undefined) department.name = dto.name;
    if (dto.isActive !== undefined) department.isActive = dto.isActive;
    department.updatedAt = new Date();
    this.auditService.record({
      action: 'department.updated',
      entityType: 'Department',
      entityId: department.id,
      beforeState,
      afterState: department,
    });
    return department;
  }

  remove(id: number): boolean {
    const index = this.departments.findIndex((item) => item.id === id);
    if (index === -1) return false;
    const [removed] = this.departments.splice(index, 1);
    this.auditService.record({
      action: 'department.removed',
      entityType: 'Department',
      entityId: removed.id,
      beforeState: removed,
    });
    return true;
  }
}
