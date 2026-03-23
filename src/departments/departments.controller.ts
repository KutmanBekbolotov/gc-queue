import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const item = this.departmentsService.findOne(Number(id));
    if (!item) throw new NotFoundException('Department not found');
    return item;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    const item = this.departmentsService.update(Number(id), dto);
    if (!item) throw new NotFoundException('Department not found');
    return item;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const deleted = this.departmentsService.remove(Number(id));
    if (!deleted) throw new NotFoundException('Department not found');
    return { success: true };
  }
}
