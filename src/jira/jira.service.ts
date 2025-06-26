import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomBytes } from 'crypto';
import { JiraOAuthToken } from './entities/jira_ouath_token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

interface BacklogFilter {
  search?: string;        // Search in summary and description
  types?: string[];       // Filter by issue types (Story, Bug, Task, etc.)
  priorities?: string[];  // Filter by priority levels
  statuses?: string[];    // Filter by status
  labels?: string[];      // Filter by labels
  assignee?: string;      // Filter by assignee
  orderBy?: string;       // Order by field (created, updated, priority, etc.)
  orderDirection?: 'ASC' | 'DESC'; // Order direction
}

@Injectable()
export class JiraService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  constructor(private readonly configService: ConfigService, @InjectRepository(JiraOAuthToken)
  private readonly tokenRepo: Repository<JiraOAuthToken>) {
    this.clientId = this.configService.get<string>('JIRA_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('JIRA_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('JIRA_REDIRECT_URI');
  }

  getAuthUrl() {
    const state = randomBytes(16).toString('hex');
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

  async exchangeCodeForToken(code: string) {
    try {
      const response = await axios.post('https://auth.atlassian.com/oauth/token', {
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
    } catch (error) {
      throw new UnauthorizedException('Failed to exchange code for token');
    }
  }

  async getAccessibleResources(accessToken: string) {
    try {
      const response = await axios.get(
        'https://api.atlassian.com/oauth/token/accessible-resources',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new UnauthorizedException('Failed to get Jira instances');
    }
  }

  async getProjects(cloudId: string, accessToken: string) {
    try {
      const response = await axios.get(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data.map(project => ({
        id: project.id,
        key: project.key,
        name: project.name,
        projectTypeKey: project.projectTypeKey,
      }));
    } catch (error) {
      throw new UnauthorizedException('Failed to get projects');
    }
  }

  async getSprints(projectId: string, cloudId: string, accessToken: string) {
    try {
      // First get all boards for the project
      const boardsResponse = await axios.get(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board`,
        {
          params: { projectKeyOrId: projectId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Then get sprints for each board
      const sprints = [];
      for (const board of boardsResponse.data.values) {
        const sprintsResponse = await axios.get(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/board/${board.id}/sprint`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );
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
    } catch (error) {
      throw new UnauthorizedException('Failed to get sprints');
    }
  }

  async getStoriesFromSprint(sprintId: string, cloudId: string, accessToken: string) {
    try {
      const response = await axios.get(
        `https://api.atlassian.com/ex/jira/${cloudId}/rest/agile/1.0/sprint/${sprintId}/issue`,
        {
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
              'customfield_10026', // Story points (may need to adjust field ID)
              'labels',
            ].join(','),
          },
        },
      );

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
    } catch (error) {
      throw new UnauthorizedException('Failed to get stories');
    }
  }

  async handleOAuthCallback(code: string, state: string, userId?: string) {
    // 1. Exchange code for token
    const tokenData = await this.exchangeCodeForToken(code);
    console.log('tokenData', tokenData);
    // 2. Get accessible resources (cloudId)
    const resources = await this.getAccessibleResources(tokenData.access_token);
    const cloudId = resources[0]?.id || '';

    // 3. Save to DB
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
} 
