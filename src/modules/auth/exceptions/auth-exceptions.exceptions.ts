import { HttpException, HttpStatus } from '@nestjs/common';

export const AuthException = {
  UNAUTHORIZED: new HttpException(
    'Unauthorized access',
    HttpStatus.UNAUTHORIZED,
  ),

  INVALID_ACCESS_TOKEN: new HttpException(
    'Invalid access token',
    HttpStatus.UNAUTHORIZED,
  ),

  ACCOUNT_NOT_FOUND: new HttpException(
    'Account not found',
    HttpStatus.NOT_FOUND,
  ),
  ACCOUNT_INACTIVE: new HttpException(
    'Account is inactive',
    HttpStatus.FORBIDDEN,
  ),

  INVALID_PASSWORD: new HttpException('Invalid password', HttpStatus.FORBIDDEN),

  PASSWORD_NOT_MATCH: new HttpException(
    'Password not match',
    HttpStatus.BAD_REQUEST,
  ),

  REFRESH_TOKEN_NOT_FOUND: new HttpException(
    'Refresh token not found',
    HttpStatus.UNAUTHORIZED,
  ),

  INVALID_REFRESH_TOKEN: new HttpException(
    'Invalid refresh token',
    HttpStatus.UNAUTHORIZED,
  ),

  INSUFFICIENT_PERMISSION: new HttpException(
    'Insufficient permission to perform this action',
    HttpStatus.FORBIDDEN,
  ),

  RESET_PASSWORD_TOKEN_NOT_FOUND: new HttpException(
    'Reset password token not found',
    HttpStatus.NOT_FOUND,
  ),

  INVALID_RESET_PASSWORD_TOKEN: new HttpException(
    'Invalid reset password token',
    HttpStatus.UNAUTHORIZED,
  ),

  RESET_TOKEN_NOT_USABLE: new HttpException(
    'Reset password token is no longer usable, please use the latest token provided',
    HttpStatus.FORBIDDEN,
  ),

  FAILED_TO_SEND_RESET_PASSWORD_EMAIL: new HttpException(
    'Failed to send email, please try again later',
    HttpStatus.INTERNAL_SERVER_ERROR,
  ),

  PASSWORD_NOT_STRONG_ENOUGH: new HttpException(
    'Password is not strong enough',
    HttpStatus.BAD_REQUEST,
  ),
};
