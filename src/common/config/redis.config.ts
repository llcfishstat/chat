import { registerAs } from '@nestjs/config';
import * as process from 'node:process';

export default registerAs(
  'redis',
  (): Record<string, unknown> => ({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
  }),
);