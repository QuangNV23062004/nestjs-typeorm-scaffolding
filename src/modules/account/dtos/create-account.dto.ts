import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Status } from '../enums/account-status.enum';

export class CreateAccountDto {
  @ApiProperty({ example: 'user@example.com', description: 'Account email' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'johndoe', description: 'Account username' })
  @IsString()
  username: string;

  @ApiProperty({
    enum: Role,
    example: Role.ANNOTATOR,
    description: 'Account role',
  })
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @ApiProperty({
    enum: Status,
    example: Status.ACTIVE,
    description: 'Account status',
  })
  @IsEnum(Status)
  status: Status = Status.ACTIVE;
}
