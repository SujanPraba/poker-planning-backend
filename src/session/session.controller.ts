import { Controller, Get, InternalServerErrorException, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { SessionService } from './session.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('export/:sessionId')
  async exportSession(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    try {
      const exportData = await this.sessionService.generateSessionExport(sessionId);

      // Create CSV content with UTF-8 BOM for Excel compatibility
      let csvContent = '\ufeff';

      // Project Details Section
      csvContent += 'Project Details\n';
      csvContent += `Project Name,${exportData.name}\n`;
      csvContent += `Session ID,${exportData.sessionId}\n`;
      csvContent += `Voting System,${exportData.votingSystem}\n\n`;

      // Team Members Section
      csvContent += 'Team Members\n';
      csvContent += 'Name,Role,Participation Rate (%)\n';
      exportData.participants.forEach(participant => {
        csvContent += `${escapeCsvField(participant.name)},${participant.isHost ? 'Host' : 'Member'},${participant.participationRate.toFixed(1)}\n`;
      });
      csvContent += '\n';

      // Stories Section
      csvContent += 'User Stories\n';
      csvContent += 'Title,Description,Status,Final Estimate,Average Vote,Most Frequent Vote,Individual Votes\n';
      exportData.stories.forEach(story => {
        const votes = Object.entries(story.votes || {})
          .map(([userId, vote]) => {
            const voter = exportData.participants.find(p => p.id === userId)?.name || 'Unknown';
            return `${voter}: ${vote}`;
          })
          .join(' | ');

        csvContent += `${escapeCsvField(story.title)},`;
        csvContent += `${escapeCsvField(story.description || 'No description')},`;
        csvContent += `${story.finalEstimate ? 'Completed' : 'Pending'},`;
        csvContent += `${story.finalEstimate || 'Not estimated'},`;
        csvContent += `${story.averageVote?.toFixed(1) || 'N/A'},`;
        csvContent += `${story.mostFrequentVote || 'N/A'},`;
        csvContent += `${escapeCsvField(votes)}\n`;
      });
      csvContent += '\n';

      // Summary Section
      csvContent += 'Summary\n';
      csvContent += `Total Stories,${exportData.summary.totalStories}\n`;
      csvContent += `Completed Stories,${exportData.summary.completedStories}\n`;
      csvContent += `Average Estimate,${exportData.summary.averageEstimate.toFixed(1)}\n`;
      csvContent += `Start Time,${exportData.summary.startTime.toISOString()}\n`;
      csvContent += `End Time,${exportData.summary.endTime.toISOString()}\n`;

      const filename = `${exportData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;

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

// Helper function to escape CSV fields
function escapeCsvField(field: string): string {
  if (!field) return '';
  // If the field contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

