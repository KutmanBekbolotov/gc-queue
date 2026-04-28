import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SuccessResponseDto } from '../common/dto/success-response.dto';
import { Department } from './entities/department.entity';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@ApiTags('departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @ApiOperation({ summary: 'Create department' })
  @ApiCreatedResponse({ type: Department })
  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @ApiOperation({ summary: 'List departments' })
  @ApiOkResponse({ type: Department, isArray: true })
  @Public()
  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @ApiOperation({ summary: 'Get department by id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: Department })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    const item = this.departmentsService.findOne(Number(id));
    if (!item) throw new NotFoundException('Department not found');
    return item;
  }

  @ApiOperation({ summary: 'Update department' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: Department })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    const item = this.departmentsService.update(Number(id), dto);
    if (!item) throw new NotFoundException('Department not found');
    return item;
  }

  @ApiOperation({ summary: 'Delete department' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    const deleted = this.departmentsService.remove(Number(id));
    if (!deleted) throw new NotFoundException('Department not found');
    return { success: true };
  }
}
