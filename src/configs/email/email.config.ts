import { registerAs } from '@nestjs/config';

export const emailConfig = registerAs('email', () => ({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASSWORD,
}));
