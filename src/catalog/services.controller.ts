import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SuccessResponseDto } from '../common/dto/success-response.dto';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceEntity } from './entities/service.entity';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @ApiOperation({ summary: 'Create service' })
  @ApiCreatedResponse({ type: ServiceEntity })
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @ApiOperation({ summary: 'List services' })
  @ApiOkResponse({ type: ServiceEntity, isArray: true })
  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @ApiOperation({ summary: 'Get service by id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: ServiceEntity })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    const item = this.servicesService.findOne(Number(id));
    if (!item) throw new NotFoundException('Service not found');
    return item;
  }

  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: ServiceEntity })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    const item = this.servicesService.update(Number(id), dto);
    if (!item) throw new NotFoundException('Service not found');
    return item;
  }

  @ApiOperation({ summary: 'Delete service' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiNotFoundResponse({ description: 'Service not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    const deleted = this.servicesService.remove(Number(id));
    if (!deleted) throw new NotFoundException('Service not found');
    return { success: true };
  }
}
