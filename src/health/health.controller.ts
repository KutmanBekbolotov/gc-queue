import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: 'Service health status' })
  @ApiOkResponse({ type: HealthResponseDto })
  @Get()
  getStatus() {
    return {
      status: 'ok',
      service: 'gc-queue-nest',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
