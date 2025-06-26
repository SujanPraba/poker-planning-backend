import { Injectable } from '@nestjs/common';
import { Resource, Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { JiraService } from '../services/jira.service';

@Injectable()
export class JiraMCPService {
  constructor(private readonly jiraService: JiraService) {}

  @Resource({
    name: 'jira.auth',
    description: 'Authenticate with Jira',
    uri: 'mcp://jira/auth/{email}/{password}',
    mimeType: 'application/json'
  })
  async authenticate(uri: URL, { email, password }) {
    const result = await this.jiraService.login(email, password);
    return {
      uri: uri.href,
      text: JSON.stringify(result)
    };
  }

  @Resource({
    name: 'jira.projects',
    description: 'Sync Jira projects',
    uri: 'mcp://jira/projects/{email}/{token}',
    mimeType: 'application/json'
  })
  async syncProjects(uri: URL, { email, token }) {
    const projects = await this.jiraService.getProjectsForUser(email, token);
    return {
      uri: uri.href,
      text: JSON.stringify(projects)
    };
  }

  @Resource({
    name: 'jira.sprints',
    description: 'Sync Jira sprints for a project',
    uri: 'mcp://jira/sprints/{email}/{token}/{projectId}',
    mimeType: 'application/json'
  })
  async syncSprints(uri: URL, { email, token, projectId }) {
    const sprints = await this.jiraService.getSprintsForProject(email, token, projectId);
    return {
      uri: uri.href,
      text: JSON.stringify(sprints)
    };
  }

  @Resource({
    name: 'jira.stories',
    description: 'Sync Jira stories for a sprint',
    uri: 'mcp://jira/stories/{email}/{token}/{sprintId}',
    mimeType: 'application/json'
  })
  async syncStories(uri: URL, { email, token, sprintId }) {
    const stories = await this.jiraService.getStoriesForSprint(email, token, sprintId);
    return {
      uri: uri.href,
      text: JSON.stringify(stories)
    };
  }

  @Tool({
    name: 'jira.fullSync',
    description: 'Trigger full Jira data sync',
    parameters: z.object({
      email: z.string().email(),
      token: z.string(),
      projectId: z.string(),
      sprintId: z.number()
    })
  })
  async runFullSync({ email, token, projectId, sprintId }) {
    const [projects, sprints, stories] = await Promise.all([
      this.jiraService.getProjectsForUser(email, token),
      this.jiraService.getSprintsForProject(email, token, projectId),
      this.jiraService.getStoriesForSprint(email, token, sprintId)
    ]);

    return {
      projects,
      sprints,
      stories,
      syncedAt: new Date().toISOString()
    };
  }
}