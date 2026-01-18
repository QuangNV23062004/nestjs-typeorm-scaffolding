import * as Joi from 'joi';

export const jwtValidation = {
  JWT_ACCESS_PUBLIC_SECRET: Joi.string()
    .required()
    .description('JWT access public secret key')
    .required()
    .error(new Error('JWT_ACCESS_PUBLIC_SECRET is required')),
  JWT_ACCESS_PRIVATE_SECRET: Joi.string()
    .required()
    .description('JWT access private secret key')
    .required()
    .error(new Error('JWT_ACCESS_PRIVATE_SECRET is required')),
  JWT_ACCESS_EXPIRES_IN: Joi.string()
    .default('15m')
    .description('JWT access token expiration time')
    .error(new Error('JWT_ACCESS_EXPIRES_IN is required')),
  JWT_REFRESH_PUBLIC_SECRET: Joi.string()
    .required()
    .description('JWT refresh public secret key')
    .required()
    .error(new Error('JWT_REFRESH_PUBLIC_SECRET is required')),
  JWT_REFRESH_PRIVATE_SECRET: Joi.string()
    .required()
    .description('JWT refresh private secret key')
    .required()
    .error(new Error('JWT_REFRESH_PRIVATE_SECRET is required')),
  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d')
    .description('JWT refresh token expiration time')
    .error(new Error('JWT_REFRESH_EXPIRES_IN is required')),
  JWT_RESET_PASSWORD_SECRET: Joi.string()
    .required()
    .description('JWT reset password private secret key')
    .required()
    .error(new Error('JWT_RESET_PASSWORD_SECRET is required')),
  JWT_RESET_PASSWORD_EXPIRES_IN: Joi.string()
    .default('15m')
    .description('JWT reset password token expiration time')
    .error(new Error('JWT_RESET_PASSWORD_EXPIRES_IN is required')),
};
