"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const session_service_1 = require("./session.service");
let SessionController = class SessionController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    async exportSession(sessionId, res) {
        try {
            const exportData = await this.sessionService.generateSessionExport(sessionId);
            let csvContent = '\ufeff';
            csvContent += 'Project Details\n';
            csvContent += `Project Name,${exportData.name}\n`;
            csvContent += `Session ID,${exportData.sessionId}\n`;
            csvContent += `Voting System,${exportData.votingSystem}\n\n`;
            csvContent += 'Team Members\n';
            csvContent += 'Name,Role,Participation Rate (%)\n';
            exportData.participants.forEach(participant => {
                csvContent += `${escapeCsvField(participant.name)},${participant.isHost ? 'Host' : 'Member'},${participant.participationRate.toFixed(1)}\n`;
            });
            csvContent += '\n';
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
            csvContent += 'Summary\n';
            csvContent += `Total Stories,${exportData.summary.totalStories}\n`;
            csvContent += `Completed Stories,${exportData.summary.completedStories}\n`;
            csvContent += `Average Estimate,${exportData.summary.averageEstimate.toFixed(1)}\n`;
            csvContent += `Start Time,${exportData.summary.startTime.toISOString()}\n`;
            csvContent += `End Time,${exportData.summary.endTime.toISOString()}\n`;
            const filename = `${exportData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
            const buffer = Buffer.from(csvContent, 'utf-8');
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.send(buffer);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error generating export');
        }
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Get)('export/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "exportSession", null);
exports.SessionController = SessionController = __decorate([
    (0, common_1.Controller)('sessions'),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SessionController);
function escapeCsvField(field) {
    if (!field)
        return '';
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}
//# sourceMappingURL=session.controller.js.map