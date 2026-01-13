import { registerAs } from '@nestjs/config';
import { ServerConfig } from 'src/interfaces/configs/server.interface';

export const serverConfig = registerAs(
  'server',
  (): ServerConfig => ({
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT ?? 2000),
    prefix: process.env.API_PREFIX || '/api',
    version: process.env.API_VERSION || 'v1',
  }),
);
