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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JiraService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const jira_ouath_token_entity_1 = require("./entities/jira_ouath_token.entity");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
let JiraService = class JiraService {
    constructor(configService, tokenRepo) {
        this.configService = configService;
        this.tokenRepo = tokenRepo;
        this.clientId = this.configService.get('JIRA_CLIENT_ID');
        this.clientSecret = this.configService.get('JIRA_CLIENT_SECRET');
        this.redirectUri = this.configService.get('JIRA_REDIRECT_URI');
    }
    getAuthUrl() {
        const state = (0, crypto_1.randomBytes)(16).toString('hex');
        const scopes = [
            'read:jira-work',
            'manage:jira-project',
            'manage:jira-configuration',
            'read:jira-user',
            'write:jira-work',
            'manage:jira-webhook',
            'manage:jira-data-provider'
        ];
        const authUrl = new URL('https://auth.atlassian.com/authorize');
        authUrl.searchParams.append('audience', 'api.atlassian.com');
        authUrl.searchParams.append('client_id', this.clientId);
        authUrl.searchParams.append('scope', scopes.join(' '));
        authUrl.searchParams.append('redirect_uri', this.redirectUri);
        authUrl.searchParams.append('state', state);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('prompt', 'consent');
        return { url: authUrl.toString(), state };
    }
    async exchangeCodeForToken(code) {
        try {
            const response = await axios_1.default.post('https://auth.atlassian.com/oauth/token', {
                grant_type: 'authorization_code',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code,
                redirect_uri: this.redirectUri,
            });
            return {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expires_in: response.data.expires_in,
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to exchange code for token');
        }
    }
    async getAccessibleResources(accessToken) {
        try {
            const response = await axios_1.default.get('https://api.atlassian.com/oauth/token/accessible-resources', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to get Jira instances');
        }
    }
    async getProjects(cloudId, accessToken) {
        try {
            const response = await axios_1.default.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data.map(project => ({
                id: project.id,
                key: project.key,
                name: project.name,
                projectTypeKey: project.projectTypeKey,
            }));
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to get projects');
        }
    }
    async getSprints(projectId, cloudId, accessToken) {
        try {
            const boardsResponse = await axios_1.default.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board`, {
                params: { projectKeyOrId: projectId },
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const sprints = [];
            for (const board of boardsResponse.data.values) {
                const sprintsResponse = await axios_1.default.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${board.id}/sprint`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                sprints.push(...sprintsResponse.data.values);
            }
            return sprints.map(sprint => ({
                id: sprint.id,
                name: sprint.name,
                state: sprint.state,
                startDate: sprint.startDate,
                endDate: sprint.endDate,
                boardId: sprint.originBoardId,
            }));
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to get sprints');
        }
    }
    async getStoriesFromSprint(sprintId, cloudId, accessToken) {
        try {
            const response = await axios_1.default.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/sprint/${sprintId}/issue`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                params: {
                    fields: [
                        'summary',
                        'description',
                        'priority',
                        'status',
                        'assignee',
                        'customfield_10026',
                        'labels',
                    ].join(','),
                },
            });
            return response.data.issues.map(issue => ({
                id: issue.key,
                summary: issue.fields.summary,
                description: issue.fields.description,
                storyPoints: issue.fields.customfield_10026,
                priority: issue.fields.priority?.name,
                assignee: issue.fields.assignee?.emailAddress,
                status: issue.fields.status.name,
                labels: issue.fields.labels,
            }));
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Failed to get stories');
        }
    }
    async handleOAuthCallback(code, state, userId) {
        const tokenData = await this.exchangeCodeForToken(code);
        console.log('tokenData', tokenData);
        const resources = await this.getAccessibleResources(tokenData.access_token);
        const cloudId = resources[0]?.id || '';
        const tokenEntity = this.tokenRepo.create({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresIn: tokenData.expires_in,
            cloudId,
            userId,
            state,
            rawResponse: JSON.stringify({ tokenData, resources }),
        });
        await this.tokenRepo.save(tokenEntity);
        return tokenEntity;
    }
};
exports.JiraService = JiraService;
exports.JiraService = JiraService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_2.InjectRepository)(jira_ouath_token_entity_1.JiraOAuthToken)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_1.Repository])
], JiraService);
//# sourceMappingURL=jira.service.js.map