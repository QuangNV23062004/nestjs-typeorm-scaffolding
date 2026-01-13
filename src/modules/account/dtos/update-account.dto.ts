import { PartialType } from '@nestjs/swagger';
import { CreateAccountDto } from './create-account.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @ApiPropertyOptional({
    example: 'newpassword123',
    description: 'New password',
  })
  @IsOptional()
  @IsString()
  password: string;
}
