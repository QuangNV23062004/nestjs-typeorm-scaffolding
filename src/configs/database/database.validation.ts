import * as Joi from 'joi';

export const databaseValidation = {
  DB_TYPE: Joi.string()
    .default('postgres')
    .description('Database type')
    .error(new Error('DB_TYPE is required')),
  DB_HOST: Joi.string()
    .default('localhost')
    .required()
    .description('Database host')
    .error(new Error('DB_HOST is required')),
  DB_PORT: Joi.number()
    .default(5432)
    .description('Database port')
    .error(new Error('DB_PORT is required')),
  DB_USERNAME: Joi.string()
    .default('user')
    .required()
    .description('Database username')
    .error(new Error('DB_USERNAME is required')),
  DB_PASSWORD: Joi.string()
    .default('password')
    .required()
    .description('Database password')
    .error(new Error('DB_PASSWORD is required')),
  DB_NAME: Joi.string()
    .default('data_labeling_db')
    .required()
    .description('Database name')
    .error(new Error('DB_NAME is required')),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
};
