import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from 'src/interfaces/configs/database.interface';

export const databaseConfig = registerAs(
  'database',
  (): DatabaseConfig => ({
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'data_labeling_db',
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || false,
  }),
);
