import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ServiceEntity } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceNodeType } from './entities/service-node-type.enum';

@Injectable()
export class ServicesService {
  private services: ServiceEntity[] = [];
  private nextId = 1;

  constructor(private readonly auditService: AuditService) {
    this.seedRootCategories();
  }

  create(dto: CreateServiceDto): ServiceEntity {
    const type = this.resolveTypeForCreate(dto);
    const parentId = this.resolveParentIdForCreate(dto.parentId);
    this.ensureCodeIsUnique(dto.code);
    const now = new Date();
    const item: ServiceEntity = {
      id: this.nextId++,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? '',
      type,
      parentId,
      isSystem: false,
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
    return [...this.services].sort((left, right) => left.id - right.id);
  }

  findOne(id: number): ServiceEntity | undefined {
    return this.services.find((item) => item.id === id);
  }

  update(id: number, dto: UpdateServiceDto): ServiceEntity | undefined {
    const item = this.findOne(id);
    if (!item) return undefined;
    this.assertNodeCanBeUpdated(item, dto);
    if (dto.code !== undefined) {
      this.ensureCodeIsUnique(dto.code, item.id);
    }
    const beforeState = { ...item };
    if (dto.code !== undefined) item.code = dto.code;
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.description !== undefined) item.description = dto.description;
    if (dto.type !== undefined) item.type = dto.type;
    if (dto.parentId !== undefined) item.parentId = this.resolveParentIdForUpdate(item.id, dto.parentId);
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
    const item = this.services[index];
    if (item.isSystem) {
      throw new BadRequestException('System root categories cannot be removed');
    }
    if (this.hasChildren(item.id)) {
      throw new BadRequestException('Cannot remove a catalog node that has child categories or services');
    }
    const [removed] = this.services.splice(index, 1);
    this.auditService.record({
      action: 'service.removed',
      entityType: 'Service',
      entityId: removed.id,
      beforeState: removed,
    });
    return true;
  }

  private seedRootCategories() {
    const now = new Date();
    this.services.push(
      {
        id: this.nextId++,
        code: 'ВС',
        name: 'ВС',
        description: 'System root category',
        type: ServiceNodeType.CATEGORY,
        parentId: null,
        isSystem: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: this.nextId++,
        code: 'ТС',
        name: 'ТС',
        description: 'System root category',
        type: ServiceNodeType.CATEGORY,
        parentId: null,
        isSystem: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  private resolveTypeForCreate(dto: CreateServiceDto): ServiceNodeType {
    if (dto.type !== undefined) {
      return dto.type;
    }
    if (dto.parentId !== undefined && dto.parentId !== null) {
      return ServiceNodeType.CATEGORY;
    }
    throw new BadRequestException('New root catalog nodes are not allowed. Use the ВС or ТС category as parent.');
  }

  private resolveParentIdForCreate(parentId?: number | null): number {
    if (parentId === undefined || parentId === null) {
      throw new BadRequestException('parentId is required for new catalog nodes');
    }
    return this.requireCategoryParent(parentId).id;
  }

  private resolveParentIdForUpdate(itemId: number, parentId: number | null): number {
    if (parentId === null) {
      throw new BadRequestException('Only system root categories can exist without a parent');
    }
    const parent = this.requireCategoryParent(parentId);
    if (parent.id === itemId) {
      throw new BadRequestException('A catalog node cannot be its own parent');
    }
    if (this.isDescendant(parent.id, itemId)) {
      throw new BadRequestException('A catalog node cannot be moved under its own descendant');
    }
    return parent.id;
  }

  private requireCategoryParent(parentId: number): ServiceEntity {
    const parent = this.findOne(parentId);
    if (!parent) {
      throw new NotFoundException('Parent catalog category not found');
    }
    if (parent.type !== ServiceNodeType.CATEGORY) {
      throw new BadRequestException('Parent node must be a category');
    }
    return parent;
  }

  private assertNodeCanBeUpdated(item: ServiceEntity, dto: UpdateServiceDto) {
    if (item.isSystem) {
      const isChangingProtectedField =
        (dto.code !== undefined && dto.code !== item.code) ||
        (dto.name !== undefined && dto.name !== item.name) ||
        (dto.description !== undefined && dto.description !== item.description) ||
        (dto.type !== undefined && dto.type !== item.type) ||
        dto.parentId !== undefined ||
        (dto.isActive !== undefined && dto.isActive !== item.isActive);
      if (isChangingProtectedField) {
        throw new BadRequestException('System root categories cannot be modified');
      }
    }

    if (dto.type === ServiceNodeType.SERVICE && this.hasChildren(item.id)) {
      throw new BadRequestException('A category with child nodes cannot be converted to a service');
    }

    if (dto.parentId !== undefined && dto.parentId !== null && dto.parentId === item.id) {
      throw new BadRequestException('A catalog node cannot be its own parent');
    }
  }

  private hasChildren(id: number): boolean {
    return this.services.some((item) => item.parentId === id);
  }

  private ensureCodeIsUnique(code: string, excludeId?: number) {
    const duplicate = this.services.find((item) => item.code === code && item.id !== excludeId);
    if (duplicate) {
      throw new BadRequestException('Catalog node code must be unique');
    }
  }

  private isDescendant(candidateParentId: number, itemId: number): boolean {
    let current = this.findOne(candidateParentId);
    while (current) {
      if (current.parentId === null) {
        return false;
      }
      if (current.parentId === itemId) {
        return true;
      }
      current = this.findOne(current.parentId);
    }
    return false;
  }
}
