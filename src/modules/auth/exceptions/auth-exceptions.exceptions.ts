import { HttpException, HttpStatus } from '@nestjs/common';

export const AuthException = {
  ACCOUNT_NOT_FOUND: new HttpException(
    'Account not found',
    HttpStatus.NOT_FOUND,
  ),
  ACCOUNT_INACTIVE: new HttpException(
    'Account is inactive',
    HttpStatus.FORBIDDEN,
  ),

  INVALID_PASSWORD: new HttpException('Invalid password', HttpStatus.FORBIDDEN),

  REFRESH_TOKEN_NOT_FOUND: new HttpException(
    'Refresh token not found',
    HttpStatus.UNAUTHORIZED,
  ),

  INVALID_REFRESH_TOKEN: new HttpException(
    'Invalid refresh token',
    HttpStatus.UNAUTHORIZED,
  ),
};
