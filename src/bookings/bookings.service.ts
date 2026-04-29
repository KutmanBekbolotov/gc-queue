import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { AuditService } from '../audit/audit.service';
import { BranchesService } from '../branches/branches.service';
import { ServiceNodeType } from '../catalog/entities/service-node-type.enum';
import { ServicesService } from '../catalog/services.service';
import { DepartmentsService } from '../departments/departments.service';
import { DepartmentServicesService } from '../department-services/department-services.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingSlotsDto } from './dto/query-booking-slots.dto';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  private readonly bookings: Booking[] = [];
  private nextId = 1;
  private readonly qrTtlMinutes = Number(process.env.QR_TTL_MINUTES ?? 30);

  constructor(
    private readonly branchesService: BranchesService,
    private readonly departmentsService: DepartmentsService,
    private readonly servicesService: ServicesService,
    private readonly departmentServicesService: DepartmentServicesService,
    private readonly auditService: AuditService,
  ) {}

  create(dto: CreateBookingDto): Booking {
    this.assertBookingAvailability(
      dto.branchId,
      dto.departmentId,
      dto.serviceId,
    );

    const scheduledAt = this.parseScheduledAt(dto.scheduledAt);
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('Booking time must be in the future');
    }

    if (this.hasSlotConflict(dto.departmentId, dto.serviceId, scheduledAt)) {
      throw new ConflictException('Selected slot is already booked');
    }

    const now = new Date();
    const booking: Booking = {
      id: this.nextId++,
      branchId: dto.branchId,
      departmentId: dto.departmentId,
      serviceId: dto.serviceId,
      customerName: dto.customerName,
      customerContact: dto.customerContact,
      scheduledAt,
      status: 'PENDING',
      qrToken: randomUUID(),
      qrExpiresAt: new Date(scheduledAt.getTime() + this.qrTtlMinutes * 60_000),
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.bookings.push(booking);

    this.auditService.record({
      action: 'booking.created',
      entityType: 'Booking',
      entityId: booking.id,
      afterState: booking,
    });
    this.auditService.record({
      action: 'qr.generated',
      entityType: 'Booking',
      entityId: booking.id,
      afterState: {
        qrToken: booking.qrToken,
        qrExpiresAt: booking.qrExpiresAt,
      },
    });

    return booking;
  }

  findAll(): Booking[] {
    return this.bookings;
  }

  findOne(id: number): Booking | undefined {
    return this.bookings.find((booking) => booking.id === id);
  }

  getAvailableSlots(query: QueryBookingSlotsDto) {
    this.assertBookingAvailability(
      query.branchId,
      query.departmentId,
      query.serviceId,
    );

    const slotDate = new Date(`${query.date}T00:00:00.000Z`);
    if (Number.isNaN(slotDate.getTime())) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    const bookedSlots = new Set(
      this.bookings
        .filter((booking) => {
          if (booking.departmentId !== query.departmentId) return false;
          if (booking.serviceId !== query.serviceId) return false;
          if (booking.status === 'CANCELLED') return false;
          return booking.scheduledAt.toISOString().startsWith(query.date);
        })
        .map((booking) => booking.scheduledAt.toISOString()),
    );

    const slots = Array.from({ length: 8 }, (_, hourOffset) => {
      const hour = 9 + hourOffset;
      return new Date(
        `${query.date}T${hour.toString().padStart(2, '0')}:00:00.000Z`,
      );
    });

    return slots
      .filter((slot) => slot.getTime() > Date.now())
      .filter((slot) => !bookedSlots.has(slot.toISOString()))
      .map((slot) => slot.toISOString());
  }

  confirm(id: number): Booking {
    const booking = this.requireBooking(id);
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cancelled booking cannot be confirmed');
    }

    const beforeState = { ...booking };
    booking.status = 'CONFIRMED';
    booking.updatedAt = new Date();

    this.auditService.record({
      action: 'booking.confirmed',
      entityType: 'Booking',
      entityId: booking.id,
      beforeState,
      afterState: booking,
    });

    return booking;
  }

  cancel(id: number, dto: CancelBookingDto): Booking {
    const booking = this.requireBooking(id);
    if (booking.status === 'CANCELLED') {
      return booking;
    }

    const beforeState = { ...booking };
    booking.status = 'CANCELLED';
    booking.cancelReason = dto.reason;
    booking.updatedAt = new Date();

    this.auditService.record({
      action: 'booking.cancelled',
      entityType: 'Booking',
      entityId: booking.id,
      beforeState,
      afterState: booking,
    });

    return booking;
  }

  getQrPayload(id: number) {
    const booking = this.requireBooking(id);
    return {
      bookingId: booking.id,
      qrToken: booking.qrToken,
      qrExpiresAt: booking.qrExpiresAt,
      qrUsedAt: booking.qrUsedAt,
      isExpired: booking.qrExpiresAt.getTime() < Date.now(),
      isUsed: Boolean(booking.qrUsedAt),
    };
  }

  getQrSvg(id: number): Promise<string> {
    const booking = this.requireBooking(id);
    return this.renderQrSvg(booking.qrToken);
  }

  getQrSvgByToken(token: string): Promise<string> {
    const booking = this.findByQrToken(token);
    if (!booking) {
      throw new NotFoundException('QR token not found');
    }
    return this.renderQrSvg(booking.qrToken);
  }

  inspectQr(token: string) {
    const booking = this.findByQrToken(token);
    if (!booking) {
      throw new NotFoundException('QR token not found');
    }

    return {
      bookingId: booking.id,
      status: booking.status,
      scheduledAt: booking.scheduledAt,
      qrExpiresAt: booking.qrExpiresAt,
      qrUsedAt: booking.qrUsedAt,
      valid: this.isQrValid(booking),
    };
  }

  consumeQr(token: string) {
    const booking = this.findByQrToken(token);
    if (!booking) {
      throw new NotFoundException('QR token not found');
    }
    if (!this.isQrValid(booking)) {
      throw new BadRequestException(
        'QR token is expired, cancelled, or already used',
      );
    }

    const beforeState = { ...booking };
    booking.qrUsedAt = new Date();
    booking.updatedAt = new Date();

    this.auditService.record({
      action: 'qr.consumed',
      entityType: 'Booking',
      entityId: booking.id,
      beforeState,
      afterState: booking,
    });

    return {
      bookingId: booking.id,
      consumedAt: booking.qrUsedAt,
      valid: true,
    };
  }

  private requireBooking(id: number): Booking {
    const booking = this.findOne(id);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }

  private findByQrToken(token: string): Booking | undefined {
    return this.bookings.find((booking) => booking.qrToken === token);
  }

  private hasSlotConflict(
    departmentId: number,
    serviceId: number,
    scheduledAt: Date,
  ): boolean {
    return this.bookings.some((booking) => {
      if (booking.departmentId !== departmentId) return false;
      if (booking.serviceId !== serviceId) return false;
      if (booking.status === 'CANCELLED') return false;
      return booking.scheduledAt.toISOString() === scheduledAt.toISOString();
    });
  }

  private assertBookingAvailability(
    branchId: number,
    departmentId: number,
    serviceId: number,
  ) {
    const branch = this.branchesService.findOne(branchId);
    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.isActive) throw new BadRequestException('Branch is inactive');

    const department = this.departmentsService.findOne(departmentId);
    if (!department) throw new NotFoundException('Department not found');
    if (!department.isActive)
      throw new BadRequestException('Department is inactive');
    if (department.branchId !== branchId) {
      throw new BadRequestException(
        'Department does not belong to the selected branch',
      );
    }

    const service = this.servicesService.findOne(serviceId);
    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) throw new BadRequestException('Service is inactive');
    if (service.type !== ServiceNodeType.SERVICE) {
      throw new BadRequestException('Catalog categories cannot be booked');
    }

    const isAvailable = this.departmentServicesService.isServiceAvailable(
      departmentId,
      serviceId,
      'booking',
    );
    if (!isAvailable) {
      throw new BadRequestException(
        'Service is not available for booking in the selected department',
      );
    }
  }

  private parseScheduledAt(value: string): Date {
    const scheduledAt = new Date(value);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Invalid scheduledAt value');
    }
    return scheduledAt;
  }

  private isQrValid(booking: Booking): boolean {
    if (booking.status === 'CANCELLED') return false;
    if (booking.qrExpiresAt.getTime() < Date.now()) return false;
    if (booking.qrUsedAt) return false;
    return true;
  }

  private renderQrSvg(content: string): Promise<string> {
    return QRCode.toString(content, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
    });
  }
}
