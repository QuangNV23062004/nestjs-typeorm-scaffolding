import { Module } from '@nestjs/common';
import { ResetPasswordTokenRepository } from './reset-password-token.repository';

@Module({
  providers: [ResetPasswordTokenRepository],
  exports: [ResetPasswordTokenRepository],
})
export class ResetPasswordTokenModule {}
