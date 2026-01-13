import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccountRepository } from '../account/account.repository';
import { TypedConfigModule } from 'src/common/typed-config/typed-config.module';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from '../account/account.entity';

@Module({
  imports: [
    TypedConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([AccountEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccountRepository],
})
export class AuthModule {}
