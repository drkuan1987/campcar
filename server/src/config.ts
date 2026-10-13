import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

const production = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (production ? '' : randomBytes(32).toString('hex'));
if (!jwtSecret || (production && jwtSecret.length < 32)) {
  throw new Error('Production requires JWT_SECRET with at least 32 characters.');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

export const config = {
  production,
  host: process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1'),
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || 'http://127.0.0.1:4000').replace(/\/$/, ''),
  jwtSecret,
  devLoginEnabled: !production && process.env.DEV_LOGIN_ENABLED === 'true',
  wechatAppId: process.env.WECHAT_APP_ID || '',
  wechatAppSecret: process.env.WECHAT_APP_SECRET || '',
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
  uploadDirectory: path.join(process.cwd(), 'uploads'),
  oss: {
    region: process.env.OSS_REGION || '',
    bucket: process.env.OSS_BUCKET || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    publicBaseUrl: (process.env.OSS_PUBLIC_BASE_URL || '').replace(/\/$/, ''),
  },
};

if (production && !config.publicBaseUrl.startsWith('https://')) {
  throw new Error('Production PUBLIC_BASE_URL must use HTTPS.');
}
if (production && !Object.values(config.oss).every(Boolean)) {
  throw new Error('Production requires OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET and OSS_PUBLIC_BASE_URL.');
}
if (production && !config.oss.publicBaseUrl.startsWith('https://')) {
  throw new Error('Production OSS_PUBLIC_BASE_URL must use HTTPS.');
}
