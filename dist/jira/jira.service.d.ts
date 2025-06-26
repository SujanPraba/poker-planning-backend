import { ConfigService } from '@nestjs/config';
import { JiraOAuthToken } from './entities/jira_ouath_token.entity';
import { Repository } from 'typeorm';
export declare class JiraService {
    private readonly configService;
    private readonly tokenRepo;
    private readonly clientId;
    private readonly clientSecret;
    private readonly redirectUri;
    constructor(configService: ConfigService, tokenRepo: Repository<JiraOAuthToken>);
    getAuthUrl(): {
        url: string;
        state: string;
    };
    exchangeCodeForToken(code: string): Promise<{
        access_token: any;
        refresh_token: any;
        expires_in: any;
    }>;
    getAccessibleResources(accessToken: string): Promise<any>;
    getProjects(cloudId: string, accessToken: string): Promise<any>;
    getSprints(projectId: string, cloudId: string, accessToken: string): Promise<{
        id: any;
        name: any;
        state: any;
        startDate: any;
        endDate: any;
        boardId: any;
    }[]>;
    getStoriesFromSprint(sprintId: string, cloudId: string, accessToken: string): Promise<any>;
    handleOAuthCallback(code: string, state: string, userId?: string): Promise<JiraOAuthToken>;
}
