import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';
import { AuthPasswordService } from '../auth/services/auth-password.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, AccountRepository, AuthPasswordService],
  exports: [AccountService, AccountRepository, AuthPasswordService],
})
export class AccountModule {}
