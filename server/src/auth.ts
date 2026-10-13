import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { config } from './config.js';
import { db } from './db.js';

const secret = new TextEncoder().encode(config.jwtSecret);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function authenticate(req: Request): Promise<string> {
  const bearer = req.headers.authorization;
  if (!bearer?.startsWith('Bearer ')) throw new ApiError(401, '请先登录');
  try {
    const { payload } = await jwtVerify(bearer.slice(7), secret, { issuer: 'campcar' });
    if (!payload.sub) throw new Error('Missing user id');
    return payload.sub;
  } catch {
    throw new ApiError(401, '登录已失效，请重新登录');
  }
}

export async function ensureUser(provider: 'dev' | 'wechat', subject: string, displayName: string) {
  const result = await db.query<{ id: string; display_name: string }>(
    `INSERT INTO users (id, provider, provider_subject, display_name) VALUES ($1, $2, $3, $4)
     ON CONFLICT (provider, provider_subject) DO UPDATE SET display_name = EXCLUDED.display_name
     RETURNING id, display_name`,
    [randomUUID(), provider, subject, displayName],
  );
  return { id: result.rows[0].id, displayName: result.rows[0].display_name };
}

export async function issueToken(userId: string): Promise<string> {
  return new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuer('campcar').setIssuedAt().setExpirationTime('7d').sign(secret);
}

export async function exchangeWechatCode(code: string): Promise<string> {
  if (!config.wechatAppId || !config.wechatAppSecret) throw new ApiError(503, '微信开放平台尚未配置');
  const url = new URL('https://api.weixin.qq.com/sns/oauth2/access_token');
  url.search = new URLSearchParams({ appid: config.wechatAppId, secret: config.wechatAppSecret, code, grant_type: 'authorization_code' }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new ApiError(502, '微信登录服务暂不可用');
  const body = await response.json() as { openid?: string; unionid?: string; errcode?: number };
  if (!body.openid) throw new ApiError(401, '微信授权码无效或已过期');
  return body.unionid || body.openid;
}
