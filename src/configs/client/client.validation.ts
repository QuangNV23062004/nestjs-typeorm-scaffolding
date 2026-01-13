import * as Joi from 'joi';

export const clientValidation = {
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
