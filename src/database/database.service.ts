import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const dbAction = this.configService.get<string>('POSTGRES_DB_ACTION');

    if (dbAction === 'CREATE') {
      this.logger.log('Database action is CREATE. Tables will be automatically created.');

      try {
        // Check if database is connected
        if (!this.dataSource.isInitialized) {
          await this.dataSource.initialize();
        }

        // TypeORM will handle table creation through synchronize: true
        this.logger.log('Database tables created successfully');
      } catch (error) {
        this.logger.error('Error creating database tables:', error);
        throw error;
      }
    } else {
      this.logger.log('Database action is not CREATE. Skipping table creation.');
    }
  }
}