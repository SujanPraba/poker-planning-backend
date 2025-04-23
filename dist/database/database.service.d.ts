import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
export declare class DatabaseService implements OnModuleInit {
    private readonly dataSource;
    private readonly configService;
    private readonly logger;
    constructor(dataSource: DataSource, configService: ConfigService);
    onModuleInit(): Promise<void>;
}
