import { connect } from 'http2';

export const EnvConfig = () => ({
  //APP env
  port: +process.env.PORT || 3001,
  node_env: process.env.NODE_ENV || 'development',
  secret_jwt_key: process.env.SECRET_JWT_KEY,
  //DB env
  //produccion
  db_url: process.env.DB_URL,
  //local
  // db_port: +process.env.DB_PORT || 27017,
  // db_username: process.env.DB_USERNAME,
  // db_pass: process.env.DB_PASS,
  // db_name: process.env.DB_NAME,
  // db_host: process.env.DB_HOST || 'localhost',
  //STORAGE AZURE
  connection_storage: process.env.CONNECTION_STORAGE,
  //STRIPE
  stripe_key: process.env.STRIPE_KEY,
  stripe_success_url: process.env.STRIPE_SUCCESS_URL,
  // stripe_sucess_url: process.env.STRIPE_SUCESS_URL,
  stripe_cancel_url: process.env.STRIPE_CANCEL_URL,
  stripe_webhook_secret: process.env.STRIPE_WEBOOK_SECRET,
});
