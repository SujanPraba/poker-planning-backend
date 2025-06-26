import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JiraController } from '../controllers/jira.controller';
import { JiraService } from '../services/jira.service';
import { Story } from '../session/entities/story.entity';
import { Session } from '../session/entities/session.entity';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Story, Session]),
    SessionModule
  ],
  controllers: [JiraController],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {} 