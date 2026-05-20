import { Controller, Get } from '@nestjs/common';

/** Root probe for Railway/browser; real liveness is GET /health */
@Controller()
export class AppController {
  @Get()
  root() {
    return {
      ok: true,
      service: 'bio-vera-api',
      health: '/health',
      detailedHealth: '/health/detailed',
    };
  }
}
