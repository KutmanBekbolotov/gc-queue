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
import { Branch } from './entities/branch.entity';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @ApiOperation({ summary: 'Create branch' })
  @ApiCreatedResponse({ type: Branch })
  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @ApiOperation({ summary: 'List branches' })
  @ApiOkResponse({ type: Branch, isArray: true })
  @Public()
  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @ApiOperation({ summary: 'Get branch by id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: Branch })
  @ApiNotFoundResponse({ description: 'Branch not found' })
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    const branch = this.branchesService.findOne(Number(id));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  @ApiOperation({ summary: 'Update branch' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: Branch })
  @ApiNotFoundResponse({ description: 'Branch not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    const branch = this.branchesService.update(Number(id), dto);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  @ApiOperation({ summary: 'Delete branch' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiOkResponse({ type: SuccessResponseDto })
  @ApiNotFoundResponse({ description: 'Branch not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    const removed = this.branchesService.remove(Number(id));
    if (!removed) {
      throw new NotFoundException('Branch not found');
    }
    return { success: true };
  }
}
