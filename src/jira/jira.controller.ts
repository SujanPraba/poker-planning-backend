import { Controller, Get, Query } from '@nestjs/common';
import { JiraService } from './jira.service';

@Controller('jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Get('projects')
  async getProjects() {
    return this.jiraService.getAllProjects();
  }

  @Get('users')
  async getUsers() {
    return this.jiraService.getAllUsers();
  }

  @Get('stories')
  async getStories(@Query('sprintId') sprintId: string) {
    return this.jiraService.getAllStoriesForSprint(sprintId);
  }

  @Get('epic-stories')
  async getEpicStories(@Query('epicKey') epicKey: string) {
    return this.jiraService.getStoriesForEpic(epicKey);
  }

  @Get('boards')
  async getBoards(@Query('projectId') projectId: string) {
    return this.jiraService.getBoardsForProject(projectId);
  }

  @Get('sprints')
  async getSprints(@Query('boardId') boardId: string) {
    return this.jiraService.getSprints(boardId);
  }
}