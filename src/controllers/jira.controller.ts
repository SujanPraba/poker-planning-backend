import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { JiraService } from '../services/jira.service';
import {
  JiraAuthRequest,
  JiraAuthResponse,
  JiraProjectRequest,
  JiraProjectResponse,
  JiraSprintRequest,
  JiraSprintResponse,
  JiraStoryRequest,
  JiraStoryResponse,
  JiraImportRequest,
  JiraImportResponse,
} from '../types/jira.types';

@Controller('api/jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Post('login')
  async login(@Body() authRequest: JiraAuthRequest): Promise<JiraAuthResponse> {
    return this.jiraService.login(authRequest.email, authRequest.password);
  }

  private extractCredentials(headers: Record<string, string>) {
    const email = headers['x-jira-email'];
    const token = headers['x-jira-token'];

    if (!email || !token) {
      throw new UnauthorizedException('Missing Jira credentials');
    }

    return { email, token };
  }

  @Post('projects')
  async getProjects(
    @Headers() headers: Record<string, string>,
    @Body() request: JiraProjectRequest
  ): Promise<JiraProjectResponse> {
    const credentials = this.extractCredentials(headers);
    const response = await this.jiraService.getProjectsForUser(credentials.email, credentials.token);
    return { success: response.success, data: response.data || [], error: response.error };
  }

  @Post('sprints')
  async getSprints(
    @Headers() headers: Record<string, string>,
    @Body() request: JiraSprintRequest
  ): Promise<JiraSprintResponse> {
    const credentials = this.extractCredentials(headers);
    const response = await this.jiraService.getSprintsForProject(
      credentials.email,
      credentials.token,
      request.projectId
    );
    return { success: response.success, data: response.data || [], error: response.error };
  }

  @Post('stories')
  async getStories(
    @Headers() headers: Record<string, string>,
    @Body() request: JiraStoryRequest
  ): Promise<JiraStoryResponse> {
    const credentials = this.extractCredentials(headers);
    const response = await this.jiraService.getStoriesForSprint(
      credentials.email,
      credentials.token,
      Number(request.sprintId)
    );
    return { success: response.success, data: response.data || [], error: response.error };
  }

  @Post('stories/import')
  async importStories(
    @Headers() headers: Record<string, string>,
    @Body() request: JiraImportRequest
  ): Promise<JiraImportResponse> {
    this.extractCredentials(headers);
    const response = await this.jiraService.importStories(request.sessionId, request.stories);
    if (!response.success || !response.data) {
      return { success: false, data: [], error: response.error };
    }

    const jiraStories = response.data.map(story => ({
      id: story.id,
      key: story.id,
      self: '',
      fields: {
        summary: story.title,
        description: story.description,
        issuetype: { id: '1', name: 'Story', iconUrl: '' },
        status: { id: '1', name: story.status, statusCategory: { id: 1, key: 'new', name: 'New' } },
        labels: []
      }
    }));
    return { success: true, data: jiraStories };
  }
}