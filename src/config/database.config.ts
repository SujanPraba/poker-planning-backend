import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  synchronize: process.env.POSTGRES_DB_ACTION === 'CREATE',
  dropSchema: process.env.POSTGRES_DB_ACTION === 'CREATE', // This will drop existing tables before creating new ones
  logging: true,
}));
