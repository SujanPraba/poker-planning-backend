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
exports.JiraController = void 0;
const common_1 = require("@nestjs/common");
const jira_service_1 = require("./jira.service");
const jira_guard_1 = require("./jira.guard");
let JiraController = class JiraController {
    constructor(jiraService) {
        this.jiraService = jiraService;
    }
    async getAuthUrl() {
        return this.jiraService.getAuthUrl();
    }
    async handleCallback(body) {
        return this.jiraService.exchangeCodeForToken(body.code);
    }
    async getInstances(req) {
        return this.jiraService.getAccessibleResources(req.jiraToken);
    }
    async getProjects(cloudId, req) {
        return this.jiraService.getProjects(cloudId, req.jiraToken);
    }
    async getSprints(projectId, cloudId, req) {
        return this.jiraService.getSprints(projectId, cloudId, req.jiraToken);
    }
    async getStories(sprintId, cloudId, req) {
        return this.jiraService.getStoriesFromSprint(sprintId, cloudId, req.jiraToken);
    }
    async handleJiraCallback(code, state) {
        const userId = "1";
        const tokenEntity = await this.jiraService.handleOAuthCallback(code, state, userId);
        return { success: true, data: tokenEntity };
    }
};
exports.JiraController = JiraController;
__decorate([
    (0, common_1.Get)('auth/url'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getAuthUrl", null);
__decorate([
    (0, common_1.Post)('auth/callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "handleCallback", null);
__decorate([
    (0, common_1.Get)('instances'),
    (0, common_1.UseGuards)(jira_guard_1.JiraAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getInstances", null);
__decorate([
    (0, common_1.Get)('projects'),
    (0, common_1.UseGuards)(jira_guard_1.JiraAuthGuard),
    __param(0, (0, common_1.Query)('cloudId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getProjects", null);
__decorate([
    (0, common_1.Get)('sprints'),
    (0, common_1.UseGuards)(jira_guard_1.JiraAuthGuard),
    __param(0, (0, common_1.Query)('projectId')),
    __param(1, (0, common_1.Query)('cloudId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getSprints", null);
__decorate([
    (0, common_1.Get)('stories'),
    (0, common_1.UseGuards)(jira_guard_1.JiraAuthGuard),
    __param(0, (0, common_1.Query)('sprintId')),
    __param(1, (0, common_1.Query)('cloudId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getStories", null);
__decorate([
    (0, common_1.Get)('oauth/callback'),
    __param(0, (0, common_1.Query)('code')),
    __param(1, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "handleJiraCallback", null);
exports.JiraController = JiraController = __decorate([
    (0, common_1.Controller)('api/jira'),
    __metadata("design:paramtypes", [jira_service_1.JiraService])
], JiraController);
//# sourceMappingURL=jira.controller.js.map