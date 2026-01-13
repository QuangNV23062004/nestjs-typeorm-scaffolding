import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../enums/role.enum';

export class CreateAccountDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsEnum(Role)
  role: Role;
}
