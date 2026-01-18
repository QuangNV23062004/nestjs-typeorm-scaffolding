import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResetPasswordTokenEntity } from './reset-password-token.entity';
import { ResetPasswordTokenRepository } from './reset-password-token.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ResetPasswordTokenEntity])],
  providers: [ResetPasswordTokenRepository],
  exports: [ResetPasswordTokenRepository],
})
export class ResetPasswordTokenModule {}
