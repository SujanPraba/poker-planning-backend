import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JiraController } from './jira.controller';
import { JiraService } from './jira.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraOAuthToken } from './entities/jira_ouath_token.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([JiraOAuthToken]),],
  controllers: [JiraController],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {} 