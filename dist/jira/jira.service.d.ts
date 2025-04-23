import { ConfigService } from '@nestjs/config';
export declare class JiraService {
    private configService;
    private jira;
    private host;
    private username;
    private apiToken;
    constructor(configService: ConfigService);
    getAllStoriesForSprint(sprintId: string): Promise<any[]>;
    getStoriesForEpic(epicKey: string): Promise<any[]>;
    getAllUsers(): Promise<any[]>;
    getAllProjects(): Promise<any[]>;
    getSprints(boardId: string): Promise<any[]>;
    getBoardsForProject(projectKeyOrId: string): Promise<any[]>;
    private handleJiraError;
}
