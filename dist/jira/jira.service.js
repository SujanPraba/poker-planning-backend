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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jira_client_1 = __importDefault(require("jira-client"));
const node_fetch_1 = __importDefault(require("node-fetch"));
let JiraService = class JiraService {
    constructor(configService) {
        this.configService = configService;
        const jiraConfig = this.configService.get('jira');
        this.host = jiraConfig?.host || this.configService.get('JIRA_HOST');
        this.username = jiraConfig?.username || this.configService.get('JIRA_USERNAME');
        this.apiToken = jiraConfig?.apiToken || this.configService.get('JIRA_API_TOKEN');
        this.jira = new jira_client_1.default({
            protocol: 'https',
            host: this.host,
            username: this.username,
            password: this.apiToken,
            apiVersion: '3',
            strictSSL: true
        });
    }
    async getAllStoriesForSprint(sprintId) {
        try {
            const jql = `Sprint = ${sprintId} AND issuetype = Story`;
            const result = await this.jira.searchJira(jql, {
                maxResults: 1000,
                fields: ['summary', 'description', 'status', 'customfield_10004']
            });
            return result.issues;
        }
        catch (error) {
            this.handleJiraError(error);
            throw new common_1.BadRequestException('Failed to fetch stories from Jira');
        }
    }
    async getStoriesForEpic(epicKey) {
        try {
            const jql = `"Epic Link" = "${epicKey}"`;
            const result = await this.jira.searchJira(jql);
            return result.issues;
        }
        catch (error) {
            this.handleJiraError(error);
            throw new common_1.BadRequestException('Failed to fetch epic stories');
        }
    }
    async getAllUsers() {
        try {
            const users = await this.jira.searchUsers({
                query: '+',
                maxResults: 1000
            });
            return users.map(user => ({
                id: user.accountId,
                name: user.displayName,
                email: user.emailAddress,
                avatarUrl: user.avatarUrls['48x48']
            }));
        }
        catch (error) {
            this.handleJiraError(error);
            throw new common_1.BadRequestException('Failed to fetch Jira users');
        }
    }
    async getAllProjects() {
        try {
            const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
            const response = await (0, node_fetch_1.default)(`https://${this.host}/rest/api/3/project/search?maxResults=200`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.values.map(project => ({
                id: project.id,
                key: project.key,
                name: project.name,
                lead: project.lead ? project.lead.displayName : null,
                avatarUrl: project.avatarUrls ? project.avatarUrls['48x48'] : null
            }));
        }
        catch (error) {
            this.handleJiraError(error);
            throw new common_1.BadRequestException('Failed to fetch Jira projects');
        }
    }
    async getSprints(boardId) {
        try {
            const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
            const response = await (0, node_fetch_1.default)(`https://${this.host}/rest/agile/1.0/board/${boardId}/sprint`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.values;
        }
        catch (error) {
            this.handleJiraError(error);
            throw new common_1.BadRequestException('Failed to fetch sprints');
        }
    }
    async getBoardsForProject(projectKeyOrId) {
        try {
            const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');
            const response = await (0, node_fetch_1.default)(`https://${this.host}/rest/agile/1.0/board?projectKeyOrId=${projectKeyOrId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.values;
        }
        catch (error) {
            this.handleJiraError(error);
            throw new common_1.BadRequestException('Failed to fetch boards');
        }
    }
    handleJiraError(error) {
        if (error.statusCode === 429) {
            const retryAfter = error.headers ? error.headers['retry-after'] || 60 : 60;
            console.log(`Rate limited. Retry after ${retryAfter} seconds`);
        }
        console.error('Jira API error:', error.message);
    }
};
exports.JiraService = JiraService;
exports.JiraService = JiraService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JiraService);
//# sourceMappingURL=jira.service.js.map