import { connect } from "http2";


export const EnvConfig = () => ({
  //APP env
  port: +process.env.PORT || 3001,
  node_env: process.env.NODE_ENV || 'development',
  secret_jwt_key: process.env.SECRET_JWT_KEY,
  //DB env
  db_port: +process.env.DB_PORT || 27017,
  db_username: process.env.DB_USERNAME,
  db_pass: process.env.DB_PASS,
  db_name: process.env.DB_NAME,
  db_host: process.env.DB_HOST || 'localhost',
  //STORAGE AZURE
  connection_storage: process.env.CONNECTION_STORAGE,
});