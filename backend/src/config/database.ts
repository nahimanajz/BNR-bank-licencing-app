import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bank_licensing',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || undefined,
  logging: false,
});
