import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { extractBearerToken } from './auth.utils';

@ApiTags('admin users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'List users' })
  @ApiOkResponse({ description: 'Common Auth users list response' })
  @Get()
  findAll(@Req() request: Request) {
    return this.authService.listUsers(this.getBearerToken(request), request);
  }

  @ApiOperation({ summary: 'Create user' })
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ description: 'Common Auth user create response' })
  @Post()
  create(@Body() body: Record<string, unknown>, @Req() request: Request) {
    return this.authService.createUser(
      this.getBearerToken(request),
      body,
      request,
    );
  }

  @ApiOperation({ summary: 'Update user profile and scope' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Common Auth user update response' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.authService.updateUser(
      this.getBearerToken(request),
      id,
      body,
      request,
    );
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Common Auth user delete response' })
  @HttpCode(200)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    return this.authService.deleteUser(
      this.getBearerToken(request),
      id,
      request,
    );
  }

  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiOkResponse({ description: 'Common Auth user role update response' })
  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() request: Request,
  ) {
    return this.authService.updateUserRole(
      this.getBearerToken(request),
      id,
      body,
      request,
    );
  }

  private getBearerToken(request: Request): string {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    return token;
  }
}
