import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { AuthContextDto } from './dto/auth-context.dto';
import { LoginDto } from './dto/login.dto';
import { AuthRequestUser } from './auth.interfaces';
import { extractBearerToken } from './auth.utils';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Common Auth login response' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto, @Req() request: Request) {
    return this.authService.login(dto, request);
  }

  @ApiOperation({ summary: 'Get current user auth context' })
  @ApiBearerAuth()
  @ApiOkResponse({ type: AuthContextDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @Get('me')
  me(@CurrentUser() user: AuthRequestUser) {
    return user;
  }

  @ApiOperation({ summary: 'Logout current access-token session' })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Common Auth logout response' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  @HttpCode(200)
  @Post('logout')
  logout(@Req() request: Request) {
    return this.authService.logout(this.getBearerToken(request), request);
  }

  private getBearerToken(request: Request): string {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    return token;
  }
}
