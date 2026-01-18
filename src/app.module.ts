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
import { DatabaseModule } from './common/database/database.module';
import { ResetPasswordTokenModule } from './modules/reset-password-token/reset-password-token.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    //config module
    TypedConfigModule,
    JwtModule,
    MailerModule.forRootAsync({
      inject: [TypedConfigService],
      useFactory: (configService: TypedConfigService) => ({
        transport: {
          host: configService.email.host,
          port: configService.email.port,
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.email.user,
            pass: configService.email.pass,
          },
        },
        defaults: {
          from: '"No Reply" <noreply@example.com>',
        },
        template: {
          dir: process.cwd() + '/src/modules/auth/templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
    //db module
    DatabaseModule.forRoot(),

    //modules
    AccountModule,
    AuthModule,
    ResetPasswordTokenModule,
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
