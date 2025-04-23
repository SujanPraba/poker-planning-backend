import { JiraService } from './jira.service';
export declare class JiraController {
    private readonly jiraService;
    constructor(jiraService: JiraService);
    getProjects(): Promise<any[]>;
    getUsers(): Promise<any[]>;
    getStories(sprintId: string): Promise<any[]>;
    getEpicStories(epicKey: string): Promise<any[]>;
    getBoards(projectId: string): Promise<any[]>;
    getSprints(boardId: string): Promise<any[]>;
}
