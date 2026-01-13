import { registerAs } from '@nestjs/config';
import { ClientConfig } from 'src/interfaces/configs';

export const clientConfig = registerAs(
  'client',
  (): ClientConfig => ({
    url1: process.env.CLIENT_URL_1 || 'http://localhost:3000',
    url2: process.env.CLIENT_URL_2 || 'http://localhost:5173',
  }),
);
