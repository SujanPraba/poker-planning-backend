import { DynamicModule, Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { JiraMCPService } from './jira-mcp.service';
import { JiraModule } from '../modules/jira.module';

@Module({})
export class JiraMCPModule {
  static forRoot(): DynamicModule {
    return {
      module: JiraMCPModule,
      imports: [
        McpModule.forRoot({
          name: 'PokerPlanningJiraSync',
          version: '1.0.0',
          sseEndpoint: '/mcp/sse',
          capabilities: {
            jiraSync: {
              version: '1.0.0',
              features: ['projects', 'sprints', 'stories', 'auth']
            }
          }
        }),
        JiraModule,
      ],
      providers: [JiraMCPService],
      exports: [JiraMCPService],
    };
  }
}