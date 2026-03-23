import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DepartmentServicesService } from './department-services.service';
import { AssignDepartmentServiceDto } from './dto/assign-department-service.dto';
import { UpdateDepartmentServiceDto } from './dto/update-department-service.dto';

@Controller('department-services')
export class DepartmentServicesController {
  constructor(private readonly departmentServices: DepartmentServicesService) {}

  @Post('assign')
  assign(@Body() dto: AssignDepartmentServiceDto) {
    return this.departmentServices.assign(dto);
  }

  @Post('unassign')
  unassign(@Body() dto: AssignDepartmentServiceDto) {
    const removed = this.departmentServices.unassign(dto.departmentId, dto.serviceId);
    if (!removed) throw new NotFoundException('DepartmentService link not found');
    return { success: true };
  }

  @Get('by-department/:departmentId')
  getByDepartment(@Param('departmentId') departmentId: string) {
    return this.departmentServices.findByDepartment(Number(departmentId));
  }

  @Get('by-department/:departmentId/services')
  getServicesByDepartment(
    @Param('departmentId') departmentId: string,
    @Query('channel') channel?: 'booking' | 'terminal' | 'operator',
  ) {
    return this.departmentServices.findAvailableServicesByDepartment(Number(departmentId), channel);
  }

  @Get('by-service/:serviceId')
  getByService(@Param('serviceId') serviceId: string) {
    return this.departmentServices.findByService(Number(serviceId));
  }

  @Get('by-service/:serviceId/departments')
  getDepartmentsByService(
    @Param('serviceId') serviceId: string,
    @Query('channel') channel?: 'booking' | 'terminal' | 'operator',
  ) {
    return this.departmentServices.findAvailableDepartmentsByService(Number(serviceId), channel);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentServiceDto) {
    const item = this.departmentServices.update(Number(id), dto);
    if (!item) throw new NotFoundException('DepartmentService not found');
    return item;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const removed = this.departmentServices.remove(Number(id));
    if (!removed) throw new NotFoundException('DepartmentService not found');
    return { success: true };
  }
}
