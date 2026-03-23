import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Get()
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const branch = this.branchesService.findOne(Number(id));
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    const branch = this.branchesService.update(Number(id), dto);
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const removed = this.branchesService.remove(Number(id));
    if (!removed) {
      throw new NotFoundException('Branch not found');
    }
    return { success: true };
  }
}
