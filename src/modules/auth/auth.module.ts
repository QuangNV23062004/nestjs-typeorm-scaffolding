import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountRepository } from '../account/account.repository';
import { TypedConfigModule } from 'src/common/typed-config/typed-config.module';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../account/account.entity';
import { ResetPasswordTokenModule } from '../reset-password-token/reset-password-token.module';
import { AuthJwtService } from './services/auth-jwt.service';
import { AuthPasswordService } from './services/auth-password.service';
import { AuthEmailService } from './services/auth-email.service';
import { AuthTemplateService } from './services/auth-template.service';
import { MailerModule } from '@nestjs-modules/mailer';
@Module({
  imports: [
    ResetPasswordTokenModule,
    TypedConfigModule,
    JwtModule.register({}),
    MailerModule,
    TypeOrmModule.forFeature([AccountEntity]),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    AccountRepository,
    AuthJwtService,
    AuthPasswordService,
    AuthEmailService,
    AuthTemplateService,
  ],
  exports: [AuthJwtService],
})
export class AuthModule {}
