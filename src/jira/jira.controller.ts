import { Controller, Get, Post, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JiraService } from './jira.service';
import { JiraAuthGuard } from './jira.guard';

@Controller('api/jira')
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

  @Get('auth/url')
  async getAuthUrl() {
    return this.jiraService.getAuthUrl();
  }

  @Post('auth/callback')
  async handleCallback(@Body() body: { code: string }) {
    return this.jiraService.exchangeCodeForToken(body.code);
  }

  @Get('instances')
  @UseGuards(JiraAuthGuard)
  async getInstances(@Req() req: any) {
    return this.jiraService.getAccessibleResources(req.jiraToken);
  }

  @Get('projects')
  @UseGuards(JiraAuthGuard)
  async getProjects(
    @Query('cloudId') cloudId: string,
    @Req() req: any
  ) {
    return this.jiraService.getProjects(cloudId, req.jiraToken);
  }

  @Get('sprints')
  @UseGuards(JiraAuthGuard)
  async getSprints(
    @Query('projectId') projectId: string,
    @Query('cloudId') cloudId: string,
    @Req() req: any
  ) {
    return this.jiraService.getSprints(projectId, cloudId, req.jiraToken);
  }

  @Get('stories')
  @UseGuards(JiraAuthGuard)
  async getStories(
    @Query('sprintId') sprintId: string,
    @Query('cloudId') cloudId: string,
    @Req() req: any
  ) {
    return this.jiraService.getStoriesFromSprint(sprintId, cloudId, req.jiraToken);
  }

  @Get('oauth/callback')
async handleJiraCallback(
  @Query('code') code: string,
  @Query('state') state: string,
) {
  // Optionally get userId from req.user
  const userId = "1";
  const tokenEntity = await this.jiraService.handleOAuthCallback(code, state, userId);
  return { success: true, data: tokenEntity };
}
}