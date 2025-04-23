import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import jiraConfig from './config/jira.config';
import { DatabaseModule } from './database/database.module';
import { JiraModule } from './jira/jira.module';
import { Session } from './session/entities/session.entity';
import { Story } from './session/entities/story.entity';
import { User } from './session/entities/user.entity';
import { SessionModule } from './session/session.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jiraConfig],
    }),
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
          entities: [Session, Story, User],
          synchronize: dbConfig.synchronize,
          dropSchema: dbConfig.dropSchema,
          logging: dbConfig.logging,
        };
      },
    }),
    DatabaseModule,
    SessionModule,
    SocketModule,
    JiraModule,
  ],
})
export class AppModule {}
