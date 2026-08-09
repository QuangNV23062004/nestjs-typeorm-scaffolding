import {
  HttpStatus,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { RequestContextMiddleware } from './common/context/request-context.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';

import { TypedConfigModule } from './common/typed-config/typed-config.module';
import { TypedConfigService } from './common/typed-config/typed-config.service';
import { AccountModule } from './modules/account/account.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/role.guard';
import {
  ResponseTransformInterceptor,
  LoggingInterceptor,
  TimeoutInterceptor,
} from './interceptors';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HttpExceptionFilter } from './filters';
import { PrismaModule } from './common/database/prisma.module';
import { ResetPasswordTokenModule } from './modules/reset-password-token/reset-password-token.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ErrorLogsModule } from './modules/error-logs/error-logs.module';
import { ErrorLoggingInterceptor } from './interceptors/error-logging.interceptor';
import { ErrorLogRepository } from './modules/error-logs/error-logs.repository';
import { AccountRepository } from './modules/account/account.repository';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { UserModule } from './modules/user/user.module';

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
    //db module (global — one PrismaClient for the process)
    PrismaModule,

    //modules
    AccountModule,
    AuthModule,
    ErrorLogsModule,
    ResetPasswordTokenModule,

    //GraphQL module
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      debug: true,
      playground: true,
    }),

    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
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
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
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
    // Fix: Use useFactory to pass dependencies (ErrorLogRepository and the array of statuses)
    {
      provide: APP_INTERCEPTOR,
      useFactory: (errorLogRepo: ErrorLogRepository) =>
        new ErrorLoggingInterceptor(errorLogRepo, [
          HttpStatus.UNAUTHORIZED,
          HttpStatus.FORBIDDEN,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ]), // Configurable statuses
      inject: [ErrorLogRepository],
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: () => new TimeoutInterceptor(30000),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Must cover every route: guards and services read the store downstream.
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
