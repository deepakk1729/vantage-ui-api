import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  BASE_URL: process.env.BASE_URL!,
  OKTA_USERNAME: process.env.OKTA_USERNAME!,
  OKTA_PASSWORD: process.env.OKTA_PASSWORD!,
  API_BASE_URL: process.env.API_BASE_URL!,
  BEARER_TOKEN: process.env.BEARER_TOKEN!,
  X_API_KEY: process.env.X_API_KEY!,
};