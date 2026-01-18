import { Module, Global } from '@nestjs/common';
import { TypedConfigService } from './typed-config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseConfig } from 'src/configs/database/database.config';
import { jwtConfig } from 'src/configs/jwt/jwt.config';
import { serverConfig } from 'src/configs/server/server.config';
import { emailConfig } from 'src/configs/email/email.config';
import { clientConfig } from 'src/configs/client/client.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        serverConfig,
        databaseConfig,
        jwtConfig,
        emailConfig,
        clientConfig,
      ],
      validate: (configService: Record<string, unknown>) => {
        const typedConfigService = new TypedConfigService(
          new ConfigService(configService),
        );
        const schema = typedConfigService.getValidatedSchema();
        const { error, value } = schema.validate(configService, {
          abortEarly: false,
          allowUnknown: true,
        });
        if (error) {
          throw error;
        }
        return value;
      },
    }),
  ],
  providers: [TypedConfigService],
  exports: [TypedConfigService],
})
export class TypedConfigModule {}
