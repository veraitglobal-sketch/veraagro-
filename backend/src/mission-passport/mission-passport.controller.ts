import { Controller, Get, Res, HttpException, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { MissionPassportService } from './mission-passport.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mission-passport')
export class MissionPassportController {
  constructor(private readonly missionPassportService: MissionPassportService) {}

  /**
   * Download Digital Passport PDF for a mission
   * GET /mission-passport/:missionId/download
   */
  @Get(':missionId/download')
  @UseGuards(JwtAuthGuard)
  async downloadMissionPassport(@Param('missionId') missionId: string, @Res() res: Response) {
    try {
      const pdfBuffer = await this.missionPassportService.generateMissionPassportPDF(missionId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="bio-vera-mission-${missionId}-passport.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating mission passport PDF:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new HttpException(
        `Failed to generate mission passport PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
