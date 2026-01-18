import { DynamicModule, Module } from '@nestjs/common';
import { DatabaseConfig } from 'src/interfaces/configs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypedConfigService } from '../typed-config/typed-config.service';
import { TypedConfigModule } from '../typed-config/typed-config.module';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypedConfigModule,
        TypeOrmModule.forRootAsync({
          inject: [TypedConfigService],
          useFactory: (configService: TypedConfigService) => {
            const config = configService.database;
            return {
              type: 'postgres',
              host: config.host,
              port: config.port,
              username: config.username,
              password: config.password,
              database: config.database,
              entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
              ssl: config.ssl ? { rejectUnauthorized: false } : false,
              logging: config.logging,
              autoLoadEntities: true,
              synchronize: config.synchronize,
              timezone: 'UTC+7',
            };
          },
        }),
      ],
    };
  }
}
