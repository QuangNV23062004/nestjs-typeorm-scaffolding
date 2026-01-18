import { ServerConfig } from './server.interface';
import { DatabaseConfig } from './database.interface';
import { EmailConfig } from './email.interface';
import { ClientConfig } from './client.interface';
import { JwtConfig } from './jwt.interface';

export interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  email: EmailConfig;
  client: ClientConfig;
}
