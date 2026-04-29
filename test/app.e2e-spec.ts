import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { HealthController } from '../src/health/health.controller';
import { ServicesService } from '../src/catalog/services.service';
import { BranchesService } from '../src/branches/branches.service';
import { DepartmentsService } from '../src/departments/departments.service';
import { DepartmentServicesService } from '../src/department-services/department-services.service';
import { ServiceNodeType } from '../src/catalog/entities/service-node-type.enum';
import { BookingsService } from '../src/bookings/bookings.service';
import request from 'supertest';

describe('HealthController (e2e)', () => {
  let app: INestApplication;
  let healthController: HealthController;
  let servicesService: ServicesService;
  let branchesService: BranchesService;
  let departmentsService: DepartmentsService;
  let departmentServicesService: DepartmentServicesService;
  let bookingsService: BookingsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    healthController = moduleFixture.get(HealthController);
    servicesService = moduleFixture.get(ServicesService);
    branchesService = moduleFixture.get(BranchesService);
    departmentsService = moduleFixture.get(DepartmentsService);
    departmentServicesService = moduleFixture.get(DepartmentServicesService);
    bookingsService = moduleFixture.get(BookingsService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    const response = healthController.getStatus();

    expect(response.status).toBe('ok');
    expect(response.service).toBe('gc-queue-nest');
    expect(typeof response.timestamp).toBe('string');
    expect(typeof response.uptimeSeconds).toBe('number');
  });

  it('/services (GET) returns seeded root categories', () => {
    expect(servicesService.findAll()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'ВС',
          name: 'ВС',
          type: ServiceNodeType.CATEGORY,
          parentId: null,
          isSystem: true,
        }),
        expect.objectContaining({
          code: 'ТС',
          name: 'ТС',
          type: ServiceNodeType.CATEGORY,
          parentId: null,
          isSystem: true,
        }),
      ]),
    );
  });

  it('creates a subcategory under the ВС root category', () => {
    const vsRoot = servicesService.findAll().find((item) => item.code === 'ВС');
    expect(vsRoot).toBeDefined();

    const created = servicesService.create({
      code: 'VS_SUBCATEGORY',
      name: 'ВС подкатегория',
      parentId: vsRoot!.id,
    });

    expect(created).toEqual(
      expect.objectContaining({
        code: 'VS_SUBCATEGORY',
        name: 'ВС подкатегория',
        type: ServiceNodeType.CATEGORY,
        parentId: vsRoot!.id,
        isSystem: false,
        isActive: true,
      }),
    );
  });

  it('rejects creating an additional root catalog node', () => {
    expect(() =>
      servicesService.create({
        code: 'ROOT_NODE',
        name: 'Root node',
      }),
    ).toThrow(
      'New root catalog nodes are not allowed. Use the ВС or ТС category as parent.',
    );
  });

  it('rejects assigning a category to a department', () => {
    const vsRoot = servicesService.findAll().find((item) => item.code === 'ВС');
    expect(vsRoot).toBeDefined();

    const branch = branchesService.create({
      code: 'ALM',
      name: 'Almaty Central Branch',
      isActive: true,
    });

    const department = departmentsService.create({
      branchId: branch.id,
      code: 'OPS-01',
      name: 'Operations Desk',
      isActive: true,
    });

    expect(() =>
      departmentServicesService.assign({
        departmentId: department.id,
        serviceId: vsRoot!.id,
      }),
    ).toThrow('Only executable services can be assigned to departments');
  });

  it('renders booking QR as SVG without calling the queue core', async () => {
    const vsRoot = servicesService.findAll().find((item) => item.code === 'ВС');
    expect(vsRoot).toBeDefined();

    const branch = branchesService.create({
      code: 'QR-ALM',
      name: 'QR Almaty Branch',
      isActive: true,
    });
    const department = departmentsService.create({
      branchId: branch.id,
      code: 'QR-OPS',
      name: 'QR Operations Desk',
      isActive: true,
    });
    const service = servicesService.create({
      code: 'QR_SERVICE',
      name: 'QR Service',
      type: ServiceNodeType.SERVICE,
      parentId: vsRoot!.id,
    });
    departmentServicesService.assign({
      departmentId: department.id,
      serviceId: service.id,
    });

    const booking = bookingsService.create({
      branchId: branch.id,
      departmentId: department.id,
      serviceId: service.id,
      customerName: 'Ivan Petrov',
      customerContact: '+77001234567',
      scheduledAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    });

    await request(app.getHttpServer())
      .get(`/bookings/${booking.id}/qr.svg`)
      .expect(200)
      .expect('Content-Type', /image\/svg\+xml/);

    const svg = await bookingsService.getQrSvg(booking.id);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<path');
  });
});
