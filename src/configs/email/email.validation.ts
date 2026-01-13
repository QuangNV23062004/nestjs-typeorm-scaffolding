import * as Joi from 'joi';

export const emailValidation = {
  EMAIL_HOST: Joi.string()
    .required()
    .default('smtp.google.com')
    .description('Email server host')
    .error(new Error('EMAIL_HOST is required')),
  EMAIL_PORT: Joi.number()
    .required()
    .default(587)
    .description('Email server port')
    .error(new Error('EMAIL_PORT is required')),
  EMAIL_USER: Joi.string()
    .required()
    .description('Email server user')
    .error(new Error('EMAIL_USER is required')),
  EMAIL_PASSWORD: Joi.string()
    .required()
    .description('Email server password')
    .error(new Error('EMAIL_PASSWORD is required')),
};
