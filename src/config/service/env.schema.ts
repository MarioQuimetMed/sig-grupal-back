import * as Joi from "joi";

export const EnvSchema = Joi.object({
  //APP ENV
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().default("development"),
  SECRET_JWT_KEY: Joi.string().required(),
  //DB ENV
  // DB_PORT: Joi.number().default(27017),
  // DB_USERNAME: Joi.string().required(),
  // DB_PASS: Joi.string().required(),
  // DB_NAME: Joi.string().required(),
  // DB_HOST: Joi.string().default("localhost"),
  DB_URL: Joi.string().required(),
  //STORAGE AZURE
  CONNECTION_STORAGE: Joi.string().required(),
});