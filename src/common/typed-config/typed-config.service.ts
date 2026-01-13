import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerConfig } from 'src/interfaces/configs/server.interface';
import { Config } from 'src/interfaces/configs/config.interface';
import { DatabaseConfig } from 'src/interfaces/configs/database.interface';
import { JwtConfig } from 'src/interfaces/configs/jwt.interface';
import { serverValidation } from 'src/configs/server/server.validation';
import { databaseValidation } from 'src/configs/database/database.validation';
import { jwtValidation } from 'src/configs/jwt/jwt.validation';
import { emailValidation } from 'src/configs/email/email.validation';
import * as Joi from 'joi';
import { clientValidation } from 'src/configs/client/client.validation';

@Injectable()
export class TypedConfigService {
  constructor(private configService: ConfigService<Config, true>) {}

  get server(): ServerConfig {
    return this.configService.get('server', { infer: true });
  }

  get database(): DatabaseConfig {
    return this.configService.get('database', { infer: true });
  }

  get jwt(): JwtConfig {
    return this.configService.get('jwt', { infer: true });
  }

  get client() {
    return this.configService.get('client', { infer: true });
  }

  getValidatedSchema() {
    const validation = Joi.object({
      ...serverValidation,
      ...databaseValidation,
      ...jwtValidation,
      ...emailValidation,
      ...clientValidation,
    });
    return validation;
  }
}
