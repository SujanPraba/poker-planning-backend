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
let JiraController = class JiraController {
    constructor(jiraService) {
        this.jiraService = jiraService;
    }
    async getProjects() {
        return this.jiraService.getAllProjects();
    }
    async getUsers() {
        return this.jiraService.getAllUsers();
    }
    async getStories(sprintId) {
        return this.jiraService.getAllStoriesForSprint(sprintId);
    }
    async getEpicStories(epicKey) {
        return this.jiraService.getStoriesForEpic(epicKey);
    }
    async getBoards(projectId) {
        return this.jiraService.getBoardsForProject(projectId);
    }
    async getSprints(boardId) {
        return this.jiraService.getSprints(boardId);
    }
};
exports.JiraController = JiraController;
__decorate([
    (0, common_1.Get)('projects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getProjects", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('stories'),
    __param(0, (0, common_1.Query)('sprintId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getStories", null);
__decorate([
    (0, common_1.Get)('epic-stories'),
    __param(0, (0, common_1.Query)('epicKey')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getEpicStories", null);
__decorate([
    (0, common_1.Get)('boards'),
    __param(0, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getBoards", null);
__decorate([
    (0, common_1.Get)('sprints'),
    __param(0, (0, common_1.Query)('boardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], JiraController.prototype, "getSprints", null);
exports.JiraController = JiraController = __decorate([
    (0, common_1.Controller)('jira'),
    __metadata("design:paramtypes", [jira_service_1.JiraService])
], JiraController);
//# sourceMappingURL=jira.controller.js.map