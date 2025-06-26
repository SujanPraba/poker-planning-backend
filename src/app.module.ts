import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule } from '@nestjs/core';
import databaseConfig from './config/database.config';
import jiraConfig from './config/jira.config';
import { DatabaseModule } from './database/database.module';
import { Session } from './session/entities/session.entity';
import { Story } from './session/entities/story.entity';
import { User } from './session/entities/user.entity';
import { SessionModule } from './session/session.module';
import { SocketModule } from './socket/socket.module';
import { RetroModule } from './retro/retro.module';
import { RetroSession } from './retro/entities/retro-session.entity';
import { RetroUser } from './retro/entities/retro-user.entity';
import { RetroItem } from './retro/entities/retro-item.entity';
import { JiraModule } from './jira/jira.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jiraConfig],
    }),
    DiscoveryModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [Session, Story, User, RetroSession, RetroUser, RetroItem],
          synchronize: dbConfig.synchronize,
          dropSchema: dbConfig.dropSchema,
          logging: dbConfig.logging,
        };
      },
    }),
    DatabaseModule,
    SessionModule,
    SocketModule,
    RetroModule,
    JiraModule,
    TypeOrmModule.forFeature([Story, Session]),
  ],
  exports: [DiscoveryModule],
})
export class AppModule {}
