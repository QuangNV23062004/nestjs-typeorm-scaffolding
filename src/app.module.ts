import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TypedConfigModule } from './common/typed-config/typed-config.module';
import { TypedConfigService } from './common/typed-config/typed-config.service';
import { AccountModule } from './modules/account/account.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import {
  ResponseTransformInterceptor,
  LoggingInterceptor,
  TimeoutInterceptor,
} from './interceptors';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HttpExceptionFilter } from './filters';

@Module({
  imports: [
    //config module
    TypedConfigModule,
    JwtModule,
    //db module
    TypeOrmModule.forRootAsync({
      imports: [TypedConfigModule],
      inject: [TypedConfigService],
      useFactory: (configService: TypedConfigService) => ({
        type: 'postgres',
        host: configService.database.host,
        port: configService.database.port,
        username: configService.database.username,
        password: configService.database.password,
        database: configService.database.database,
        entities: [__dirname + '/modules/**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: configService.database.synchronize,
      }),
    }),

    //modules
    AccountModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TypedConfigService,
    JwtService,
    // Exception Filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Guards
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    // Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new TimeoutInterceptor(30000),
    },
  ],
})
export class AppModule {}
