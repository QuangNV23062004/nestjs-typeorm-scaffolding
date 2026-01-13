import { ServerConfig } from './server.interface';
import { DatabaseConfig } from './database.interface';
import { JwtConfig } from './jwt.interface';
import { ClientConfig } from './client.interface';

export interface Config {
  server: ServerConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  client: ClientConfig;
}
