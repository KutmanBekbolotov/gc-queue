import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  private branches: Branch[] = [];
  private nextId = 1;

  constructor(private readonly auditService: AuditService) {}

  create(dto: CreateBranchDto): Branch {
    const now = new Date();
    const branch: Branch = {
      id: this.nextId++,
      code: dto.code,
      name: dto.name,
      isActive: dto.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };
    this.branches.push(branch);
    this.auditService.record({
      action: 'branch.created',
      entityType: 'Branch',
      entityId: branch.id,
      afterState: branch,
    });
    return branch;
  }

  findAll(): Branch[] {
    return this.branches;
  }

  findOne(id: number): Branch | undefined {
    return this.branches.find((item) => item.id === id);
  }

  update(id: number, dto: UpdateBranchDto): Branch | undefined {
    const branch = this.findOne(id);
    if (!branch) return undefined;
    const beforeState = { ...branch };
    if (dto.code !== undefined) branch.code = dto.code;
    if (dto.name !== undefined) branch.name = dto.name;
    if (dto.isActive !== undefined) branch.isActive = dto.isActive;
    branch.updatedAt = new Date();
    this.auditService.record({
      action: 'branch.updated',
      entityType: 'Branch',
      entityId: branch.id,
      beforeState,
      afterState: branch,
    });
    return branch;
  }

  remove(id: number): boolean {
    const index = this.branches.findIndex((item) => item.id === id);
    if (index === -1) return false;
    const [removed] = this.branches.splice(index, 1);
    this.auditService.record({
      action: 'branch.removed',
      entityType: 'Branch',
      entityId: removed.id,
      beforeState: removed,
    });
    return true;
  }
}
