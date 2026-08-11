import { DynamicModule, Module, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { registerDataSource } from './transaction.context';
import { DatabaseConfig } from 'src/interfaces/configs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypedConfigService } from '../typed-config/typed-config.service';
import { TypedConfigModule } from '../typed-config/typed-config.module';

@Module({})
export class DatabaseModule implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Lets @Transactional() work on classes that hold no repository of their
   * own. One DataSource per process, so this is a registration, not a cache.
   */
  onModuleInit(): void {
    registerDataSource(this.dataSource);
  }

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
