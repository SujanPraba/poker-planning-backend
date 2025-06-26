import { Controller, Get, Param, Res, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { RetroService } from './retro.service';

@Controller('api/retro')
export class RetroController {
  constructor(private readonly retroService: RetroService) {}

  @Get('export/:sessionId')
  async exportSession(@Param('sessionId') sessionId: string, @Res() res: Response) {
    try {
      const csvContent = await this.retroService.exportToCSV(sessionId);
      const filename = `retro-${sessionId}-${new Date().toISOString().split('T')[0]}.csv`;

      // Convert CSV content to Buffer
      const buffer = Buffer.from(csvContent, 'utf-8');

      // Set headers for blob download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);

      // Send the buffer as response
      res.send(buffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error generating export');
    }
  }
} 