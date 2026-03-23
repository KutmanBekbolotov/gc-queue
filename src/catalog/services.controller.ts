import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const item = this.servicesService.findOne(Number(id));
    if (!item) throw new NotFoundException('Service not found');
    return item;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    const item = this.servicesService.update(Number(id), dto);
    if (!item) throw new NotFoundException('Service not found');
    return item;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const deleted = this.servicesService.remove(Number(id));
    if (!deleted) throw new NotFoundException('Service not found');
    return { success: true };
  }
}
