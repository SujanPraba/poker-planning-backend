import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import JiraApi from 'jira-client';
// In CommonJS, we need to use the require approach for node-fetch v3
import fetch from 'node-fetch';

interface JiraProject {
  id: string;
  key: string;
  name: string;
  lead?: { displayName: string };
  avatarUrls?: { [key: string]: string };
}

interface JiraResponse<T> {
  values: T[];
}

@Injectable()
export class JiraService {
  private jira: JiraApi;
  private host: string;
  private username: string;
  private apiToken: string;

  constructor(private configService: ConfigService) {
    const jiraConfig = this.configService.get('jira');

    this.host = jiraConfig?.host || this.configService.get<string>('JIRA_HOST');
    this.username = jiraConfig?.username || this.configService.get<string>('JIRA_USERNAME');
    this.apiToken = jiraConfig?.apiToken || this.configService.get<string>('JIRA_API_TOKEN');

    this.jira = new JiraApi({
      protocol: 'https',
      host: this.host,
      username: this.username,
      password: this.apiToken,
      apiVersion: '3',
      strictSSL: true
    });
  }

  async getAllStoriesForSprint(sprintId: string): Promise<any[]> {
    try {
      const jql = `Sprint = ${sprintId} AND issuetype = Story`;
      const result = await this.jira.searchJira(jql, {
        maxResults: 1000,
        fields: ['summary', 'description', 'status', 'customfield_10004'] // Story points field
      });
      return result.issues;
    } catch (error) {
      this.handleJiraError(error);
      throw new BadRequestException('Failed to fetch stories from Jira');
    }
  }

  async getStoriesForEpic(epicKey: string): Promise<any[]> {
    try {
      const jql = `"Epic Link" = "${epicKey}"`;
      const result = await this.jira.searchJira(jql);
      return result.issues;
    } catch (error) {
      this.handleJiraError(error);
      throw new BadRequestException('Failed to fetch epic stories');
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const users = await this.jira.searchUsers({
        query: '+', // Search for all users
        maxResults: 1000
      });

      return users.map(user => ({
        id: user.accountId,
        name: user.displayName,
        email: user.emailAddress,
        avatarUrl: user.avatarUrls['48x48']
      }));
    } catch (error) {
      this.handleJiraError(error);
      throw new BadRequestException('Failed to fetch Jira users');
    }
  }

  async getAllProjects(): Promise<any[]> {
    try {
      const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');

      const response = await fetch(`https://${this.host}/rest/api/3/project/search?maxResults=200`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as JiraResponse<JiraProject>;

      return data.values.map(project => ({
        id: project.id,
        key: project.key,
        name: project.name,
        lead: project.lead ? project.lead.displayName : null,
        avatarUrl: project.avatarUrls ? project.avatarUrls['48x48'] : null
      }));
    } catch (error) {
      this.handleJiraError(error);
      throw new BadRequestException('Failed to fetch Jira projects');
    }
  }

  async getSprints(boardId: string): Promise<any[]> {
    try {
      const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');

      const response = await fetch(`https://${this.host}/rest/agile/1.0/board/${boardId}/sprint`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as JiraResponse<any>;
      return data.values;
    } catch (error) {
      this.handleJiraError(error);
      throw new BadRequestException('Failed to fetch sprints');
    }
  }

  async getBoardsForProject(projectKeyOrId: string): Promise<any[]> {
    try {
      const auth = Buffer.from(`${this.username}:${this.apiToken}`).toString('base64');

      const response = await fetch(`https://${this.host}/rest/agile/1.0/board?projectKeyOrId=${projectKeyOrId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as JiraResponse<any>;
      return data.values;
    } catch (error) {
      this.handleJiraError(error);
      throw new BadRequestException('Failed to fetch boards');
    }
  }

  private handleJiraError(error) {
    if (error.statusCode === 429) {
      // Handle rate limiting
      const retryAfter = error.headers ? error.headers['retry-after'] || 60 : 60;
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    }
    console.error('Jira API error:', error.message);
  }
}