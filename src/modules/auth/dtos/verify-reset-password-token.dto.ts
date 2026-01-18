import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyResetPasswordTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}
