import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { SuccessResponseDto } from '../common/dto/success-response.dto';
import { CurrentOperator } from './decorators/current-operator.decorator';
import { Public } from './decorators/public.decorator';
import { OperatorAuthResponseDto } from './dto/operator-auth-response.dto';
import { OperatorAuthenticatedUserDto } from './dto/operator-authenticated-user.dto';
import { OperatorLoginDto } from './dto/operator-login.dto';
import { OperatorLogoutAllResponseDto } from './dto/operator-logout-all-response.dto';
import { OperatorRefreshTokenDto } from './dto/operator-refresh-token.dto';
import { OperatorAuthGuard } from './guards/operator-auth.guard';
import { OperatorAuthRequestContext, OperatorAuthRequestUser } from './operator-auth.interfaces';
import { OperatorAuthService } from './operator-auth.service';

@ApiTags('operator-auth')
@Controller('operator-auth')
export class OperatorAuthController {
  constructor(private readonly operatorAuthService: OperatorAuthService) {}

  @ApiOperation({ summary: 'Login operator and issue access/refresh tokens' })
  @ApiOkResponse({ type: OperatorAuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid operator credentials' })
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts from the same login/IP pair',
  })
  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: OperatorLoginDto, @Req() request: Request) {
    return this.operatorAuthService.login(
      dto,
      this.buildRequestContext(request, dto.deviceFingerprint),
    );
  }

  @ApiOperation({ summary: 'Rotate refresh token and issue a new access token' })
  @ApiOkResponse({ type: OperatorAuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or replayed refresh token' })
  @Public()
  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: OperatorRefreshTokenDto, @Req() request: Request) {
    return this.operatorAuthService.refresh(
      dto,
      this.buildRequestContext(request, dto.deviceFingerprint),
    );
  }

  @ApiOperation({ summary: 'Return the current authenticated operator profile' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: OperatorAuthenticatedUserDto })
  @UseGuards(OperatorAuthGuard)
  @Get('me')
  me(@CurrentOperator() user: OperatorAuthRequestUser) {
    return this.operatorAuthService.getCurrentUser(user);
  }

  @ApiOperation({ summary: 'Revoke the current operator session' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: SuccessResponseDto })
  @UseGuards(OperatorAuthGuard)
  @HttpCode(200)
  @Post('logout')
  async logout(@CurrentOperator() user: OperatorAuthRequestUser) {
    await this.operatorAuthService.logout(user);
    return { success: true };
  }

  @ApiOperation({ summary: 'Revoke all sessions of the current operator' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: OperatorLogoutAllResponseDto })
  @UseGuards(OperatorAuthGuard)
  @HttpCode(200)
  @Post('logout-all')
  async logoutAll(@CurrentOperator() user: OperatorAuthRequestUser) {
    const revokedSessions = await this.operatorAuthService.logoutAll(user);
    return {
      success: true,
      revokedSessions,
    };
  }

  private buildRequestContext(
    request: Request,
    deviceFingerprint?: string,
  ): OperatorAuthRequestContext {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;
    const headerFingerprint = this.readSingleHeader(
      request.headers['x-device-fingerprint'],
    );

    return {
      ip: forwardedIp ?? request.ip,
      userAgent: request.headers['user-agent'],
      deviceFingerprint: deviceFingerprint ?? headerFingerprint,
    };
  }

  private readSingleHeader(value?: string | string[]): string | undefined {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}
