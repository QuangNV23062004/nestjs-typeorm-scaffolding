import * as Joi from 'joi';

export const serverValidation = {
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .required()
    .description(
      'Application environment must be one of development, test, production',
    )
    .default('development')
    .error(new Error('NODE_ENV is required')),
  PORT: Joi.number()
    .default(2000)
    .required()
    .description('Application port number')
    .error(new Error('PORT is required')),

  API_PREFIX: Joi.string()
    .default('/api')
    .required()
    .description('API prefix')
    .error(new Error('API_PREFIX is required')),

  API_VERSION: Joi.string()
    .default('v1')
    .required()
    .description('API version')
    .error(new Error('API_VERSION is required')),

  CLIENT_URL_1: Joi.string()
    .uri()
    .required()
    .description('Client URL 1 for CORS')
    .error(new Error('CLIENT_URL_1 is required')),

  CLIENT_URL_2: Joi.string()
    .uri()
    .required()
    .description('Client URL 2 for CORS')
    .error(new Error('CLIENT_URL_2 is required')),
};
