import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QualityControlLevelsService } from './quality-control-levels.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('quality-control-levels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QualityControlLevelsController {
  constructor(
    private readonly qualityControlLevelsService: QualityControlLevelsService,
  ) {}

  @Get('batch/:batchId')
  @Roles('SUPER_ADMIN', 'COORDINATOR', 'GROWER', 'BUYER', 'LOGISTICS_PARTNER')
  async getProtocol360Status(@Param('batchId') batchId: string) {
    return this.qualityControlLevelsService.getProtocol360Status(batchId);
  }

  @Get('protocol-360')
  async getProtocol360Info() {
    return {
      name: 'Bio Vera Protocol 360',
      description:
        'Three-tier quality control system ensuring standards beyond expectation',
      levels: [
        {
          level: 1,
          name: 'Eco-Safe Provera',
          location: 'Field',
          badgeText: 'ORIGIN VERIFIED | ECO-SAFE AUDIT PASS',
          checks: [
            'Heavy metals absence',
            'Nitrate levels',
            'PH value',
            'Moisture levels (48h before harvest)',
          ],
        },
        {
          level: 2,
          name: 'Biometric & Visual Scan',
          location: 'Packaging Center',
          badgeText: 'TRIPLE-CHECKED | BIOMETRICALLY SCANNED',
          checks: [
            'Calibration (size)',
            'Fruit firmness',
            'Film integrity',
            'Color deviation (<5%)',
          ],
        },
        {
          level: 3,
          name: 'Logistics Guard',
          location: 'Transport & Storage',
          badgeText: 'COLD-CHAIN GUARANTEED | FRESHNESS SEALED',
          checks: [
            'Temperature range (2-8°C)',
            'Thermal shock detection',
            'Cold chain continuity',
            'Automatic alert system',
          ],
        },
      ],
      brandingSlogans: [
        'Standards Beyond Expectation',
        'Controlled by Science, Grown by Nature',
        'Every Unit a Masterpiece',
      ],
    };
  }
}
