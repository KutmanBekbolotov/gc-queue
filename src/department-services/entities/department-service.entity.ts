export class DepartmentServiceLink {
  id: number;
  departmentId: number;
  serviceId: number;
  isActive: boolean;
  bookingEnabled: boolean;
  terminalEnabled: boolean;
  operatorEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}
