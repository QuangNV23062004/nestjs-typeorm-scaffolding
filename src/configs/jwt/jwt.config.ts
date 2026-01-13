import { registerAs } from '@nestjs/config';
import { JwtConfig } from 'src/interfaces/configs/jwt.interface';

// Helper to wrap raw base64 key with PEM headers for RS256
const wrapPem = (key: string, type: 'PUBLIC' | 'PRIVATE'): string => {
  const header = `-----BEGIN RSA ${type} KEY-----`;
  const footer = `-----END RSA ${type} KEY-----`;
  // If already has PEM headers, return as-is
  if (key.includes(header)) return key;
  // Split into 64-char lines for proper PEM format
  const formatted = key.match(/.{1,64}/g)?.join('\n') || key;
  return `${header}\n${formatted}\n${footer}`;
};

export const jwtConfig = registerAs(
  'jwt',
  (): JwtConfig => ({
    publicAccessKey: wrapPem(
      process.env.JWT_ACCESS_PUBLIC_SECRET as string,
      'PUBLIC',
    ),
    privateAccessKey: wrapPem(
      process.env.JWT_ACCESS_PRIVATE_SECRET as string,
      'PRIVATE',
    ),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN as string,
    publicRefreshKey: wrapPem(
      process.env.JWT_REFRESH_PUBLIC_SECRET as string,
      'PUBLIC',
    ),
    privateRefreshKey: wrapPem(
      process.env.JWT_REFRESH_PRIVATE_SECRET as string,
      'PRIVATE',
    ),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN as string,
  }),
);
