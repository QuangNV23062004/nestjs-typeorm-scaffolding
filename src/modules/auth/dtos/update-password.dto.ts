import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'oldpassword123',
    description: 'Current password',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'New password',
  })
  @IsString()
  newPassword: string;
}
