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
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SuccessResponseDto } from '../common/dto/success-response.dto';
import { DepartmentServicesService } from './department-services.service';
import { AssignDepartmentServiceDto } from './dto/assign-department-service.dto';
import { DepartmentScopedServiceDto } from './dto/department-scoped-service.dto';
import { ServiceScopedDepartmentDto } from './dto/service-scoped-department.dto';
import { UpdateDepartmentServiceDto } from './dto/update-department-service.dto';
import { DepartmentServiceLink } from './entities/department-service.entity';

@ApiTags('department-services')
@Controller('department-services')
export class DepartmentServicesController {
  constructor(private readonly departmentServices: DepartmentServicesService) {}

  @ApiOperation({ summary: 'Assign service to department' })
  @ApiCreatedResponse({ type: DepartmentServiceLink })
  @Post('assign')
  assign(@Body() dto: AssignDepartmentServiceDto) {
    return this.departmentServices.assign(dto);
  }

  @ApiOperation({ summary: 'Unassign service from department' })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiNotFoundResponse({ description: 'DepartmentService link not found' })
  @Post('unassign')
  unassign(@Body() dto: AssignDepartmentServiceDto) {
    const removed = this.departmentServices.unassign(
      dto.departmentId,
      dto.serviceId,
    );
    if (!removed)
      throw new NotFoundException('DepartmentService link not found');
    return { success: true };
  }

  @ApiOperation({ summary: 'List raw service links by department' })
  @ApiParam({ name: 'departmentId', example: 1 })
  @ApiOkResponse({ type: DepartmentServiceLink, isArray: true })
  @Public()
  @Get('by-department/:departmentId')
  getByDepartment(@Param('departmentId') departmentId: string) {
    return this.departmentServices.findByDepartment(Number(departmentId));
  }

  @ApiOperation({ summary: 'List available services for a department' })
  @ApiParam({ name: 'departmentId', example: 1 })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: ['booking', 'terminal', 'operator'],
  })
  @ApiOkResponse({ type: DepartmentScopedServiceDto, isArray: true })
  @Public()
  @Get('by-department/:departmentId/services')
  getServicesByDepartment(
    @Param('departmentId') departmentId: string,
    @Query('channel') channel?: 'booking' | 'terminal' | 'operator',
  ) {
    return this.departmentServices.findAvailableServicesByDepartment(
      Number(departmentId),
      channel,
    );
  }

  @ApiOperation({ summary: 'List raw department links by service' })
  @ApiParam({ name: 'serviceId', example: 1 })
  @ApiOkResponse({ type: DepartmentServiceLink, isArray: true })
  @Public()
  @Get('by-service/:serviceId')
  getByService(@Param('serviceId') serviceId: string) {
    return this.departmentServices.findByService(Number(serviceId));
  }

  @ApiOperation({ summary: 'List departments where a service is available' })
  @ApiParam({ name: 'serviceId', example: 1 })
  @ApiQuery({
    name: 'channel',
    required: false,
    enum: ['booking', 'terminal', 'operator'],
  })
  @ApiOkResponse({ type: ServiceScopedDepartmentDto, isArray: true })
  @Public()
  @Get('by-service/:serviceId/departments')
  getDepartmentsByService(
    @Param('serviceId') serviceId: string,
    @Query('channel') channel?: 'booking' | 'terminal' | 'operator',
  ) {
    return this.departmentServices.findAvailableDepartmentsByService(
      Number(serviceId),
      channel,
    );
  }

  @ApiOperation({ summary: 'Update department-service link' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: DepartmentServiceLink })
  @ApiNotFoundResponse({ description: 'DepartmentService not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentServiceDto) {
    const item = this.departmentServices.update(Number(id), dto);
    if (!item) throw new NotFoundException('DepartmentService not found');
    return item;
  }

  @ApiOperation({ summary: 'Delete department-service link by id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiNotFoundResponse({ description: 'DepartmentService not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    const removed = this.departmentServices.remove(Number(id));
    if (!removed) throw new NotFoundException('DepartmentService not found');
    return { success: true };
  }
}
