import { JiraService } from './jira.service';
export declare class JiraController {
    private readonly jiraService;
    constructor(jiraService: JiraService);
    getAuthUrl(): Promise<{
        url: string;
        state: string;
    }>;
    handleCallback(body: {
        code: string;
    }): Promise<{
        access_token: any;
        refresh_token: any;
        expires_in: any;
    }>;
    getInstances(req: any): Promise<any>;
    getProjects(cloudId: string, req: any): Promise<any>;
    getSprints(projectId: string, cloudId: string, req: any): Promise<{
        id: any;
        name: any;
        state: any;
        startDate: any;
        endDate: any;
        boardId: any;
    }[]>;
    getStories(sprintId: string, cloudId: string, req: any): Promise<any>;
    handleJiraCallback(code: string, state: string): Promise<{
        success: boolean;
        data: import("./entities/jira_ouath_token.entity").JiraOAuthToken;
    }>;
}
