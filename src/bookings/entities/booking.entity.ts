export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export class Booking {
  id: number;
  branchId: number;
  departmentId: number;
  serviceId: number;
  customerName: string;
  customerContact: string;
  scheduledAt: Date;
  status: BookingStatus;
  qrToken: string;
  qrExpiresAt: Date;
  qrUsedAt?: Date;
  cancelReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
