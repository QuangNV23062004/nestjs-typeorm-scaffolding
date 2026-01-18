import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';
import { AccountEntity } from './account.entity';
import { AuthPasswordService } from '../auth/services/auth-password.service';

@Module({
  imports: [TypeOrmModule.forFeature([AccountEntity])],
  controllers: [AccountController],
  providers: [AccountService, AccountRepository, AuthPasswordService],
})
export class AccountModule {}
