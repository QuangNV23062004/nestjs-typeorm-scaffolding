import { HttpException, HttpStatus } from '@nestjs/common';

export const AccountException = {
  ACCOUNT_NOT_FOUND: new HttpException(
    'Account not found',
    HttpStatus.NOT_FOUND,
  ),

  EMAIL_IN_USE: new HttpException(
    'Email already in use',
    HttpStatus.BAD_REQUEST,
  ),

  INSUFFICIENT_PERMISSION: new HttpException(
    'You do not have sufficient permission to perform actions in this lists: update roles, delete other people account',
    HttpStatus.FORBIDDEN,
  ),

  CANNOT_UPDATE_OTHER_ACCOUNT: new HttpException(
    'Only admin can update other user accounts',
    HttpStatus.FORBIDDEN,
  ),
};
