import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../session/entities/story.entity';
import { Session } from '../session/entities/session.entity';
import axios from 'axios';
import { JiraProject, JiraSprint, JiraStory } from '../types/jira.types';

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Story)
    private storyRepository: Repository<Story>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>
  ) {}

  async login(email: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Extract domain from email and create base64 credentials
      const domain = email.split('@')[1];
      const jiraUrl = `https://${domain.split('.')[0]}.atlassian.net`;
      const credentials = Buffer.from(`${email}:${password}`).toString('base64');

      // Test the credentials by making a request to get myself
      const response = await axios.get(
        `${jiraUrl}/rest/api/2/myself`,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Accept': 'application/json',
            'X-Atlassian-Token': 'no-check'
          },
          validateStatus: (status) => status < 500 // Don't throw on 401/403
        }
      );

      if (response.status === 401 || response.status === 403) {
        return { 
          success: false, 
          error: 'Invalid credentials. Please note that Jira Cloud requires an API token for authentication. You can generate one at https://id.atlassian.com/manage-profile/security/api-tokens' 
        };
      }

      if (!response.data || !response.data.emailAddress) {
        return { success: false, error: 'Invalid response from Jira' };
      }

      // Store the credentials and domain
      const tokenData = {
        credentials: credentials,
        baseUrl: jiraUrl,
        email: email
      };

      return {
        success: true,
        token: Buffer.from(JSON.stringify(tokenData)).toString('base64')
      };
    } catch (error) {
      this.logger.error('Failed to authenticate with Jira:', error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          error: 'Authentication failed. Jira Cloud requires an API token for authentication. Generate one at https://id.atlassian.com/manage-profile/security/api-tokens' 
        };
      }
      return { 
        success: false, 
        error: 'Failed to connect to Jira. Please check your email domain is correct.' 
      };
    }
  }

  private getAuthHeaders(token: string) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      return {
        'Authorization': `Basic ${tokenData.credentials}`,
        'Accept': 'application/json',
        'X-Atlassian-Token': 'no-check',
        'Content-Type': 'application/json'
      };
    } catch (error) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }

  private getBaseUrl(token: string): string {
    const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
    return tokenData.baseUrl;
  }

  async getProjectsForUser(email: string, token: string): Promise<{ success: boolean; data?: JiraProject[]; error?: string }> {
    try {
      const baseUrl = this.getBaseUrl(token);
      const response = await axios.get(
        `${baseUrl}/rest/api/2/project`,
        {
          headers: this.getAuthHeaders(token)
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch Jira projects';
      this.logger.error(`Projects error: ${message}`, error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { success: false, error: 'Authentication failed. Please check your credentials or generate a new API token.' };
      }
      return { success: false, error: message };
    }
  }

  async getSprintsForProject(email: string, token: string, projectId: string): Promise<{ success: boolean; data?: JiraSprint[]; error?: string }> {
    try {
      const baseUrl = this.getBaseUrl(token);
      const boardsResponse = await axios.get(
        `${baseUrl}/rest/agile/1.0/board?projectKeyOrId=${projectId}`,
        {
          headers: this.getAuthHeaders(token)
        }
      );

      const boards = boardsResponse.data.values;
      if (!boards.length) {
        return { success: true, data: [] };
      }

      const boardId = boards[0].id;
      const sprintsResponse = await axios.get(
        `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint`,
        {
          headers: this.getAuthHeaders(token)
        }
      );

      return { success: true, data: sprintsResponse.data.values };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch Jira sprints';
      this.logger.error(`Sprints error: ${message}`, error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { success: false, error: 'Authentication failed. Please check your credentials or generate a new API token.' };
      }
      return { success: false, error: message };
    }
  }

  async getStoriesForSprint(email: string, token: string, sprintId: number): Promise<{ success: boolean; data?: JiraStory[]; error?: string }> {
    try {
      const baseUrl = this.getBaseUrl(token);
      const response = await axios.get(
        `${baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`,
        {
          headers: this.getAuthHeaders(token),
          params: {
            fields: 'summary,description,issuetype,status,customfield_10004'
          }
        }
      );
      return { success: true, data: response.data.issues };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch Jira stories';
      this.logger.error(`Stories error: ${message}`, error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { success: false, error: 'Authentication failed. Please check your credentials or generate a new API token.' };
      }
      return { success: false, error: message };
    }
  }

  async importStories(sessionId: string, jiraStories: JiraStory[]): Promise<{ success: boolean; data?: Story[]; error?: string }> {
    try {
      const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      const stories = jiraStories.map(jiraStory => {
        const story = new Story();
        story.title = jiraStory.fields.summary;
        story.description = jiraStory.fields.description || '';
        story.session = session;
        story.status = jiraStory.fields.status?.name || 'Not Started';
        story.votes = {};
        return story;
      });

      const savedStories = await this.storyRepository.save(stories);
      return { success: true, data: savedStories };
    } catch (error) {
      this.logger.error('Failed to import stories:', error);
      return { success: false, error: 'Failed to import stories' };
    }
  }
}