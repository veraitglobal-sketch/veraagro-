import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { StoredDocumentsService } from './stored-documents.service';

@Controller()
export class StoredDocumentsController {
  constructor(private readonly documents: StoredDocumentsService) {}

  @Get('documents/:id')
  async serve(@Param('id') id: string, @Res() res: Response) {
    try {
      const doc = await this.documents.get(id);
      res.setHeader('Content-Type', doc.mimeType);
      if (doc.fileName) {
        res.setHeader('Content-Disposition', `inline; filename="${doc.fileName.replace(/"/g, '')}"`);
      }
      res.send(doc.data);
    } catch (err) {
      if (!(err instanceof NotFoundException)) throw err;
      res.status(404).json({ message: 'Document not found' });
    }
  }

  /** Legacy dev-only uploads path — graceful 404 when file missing after redeploy. */
  @Get('uploads/seed-certificates/:fileName')
  serveLegacyUpload(@Param('fileName') fileName: string, @Res() res: Response) {
    const safe = path.basename(fileName);
    const abs = path.join(process.cwd(), 'uploads', 'seed-certificates', safe);
    if (!fs.existsSync(abs)) {
      res.status(404).json({ message: 'Document not found (local upload expired)' });
      return;
    }
    res.sendFile(abs);
  }
}
