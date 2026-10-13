import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const base = process.env.API_BASE_URL || 'http://127.0.0.1:4000';
const suffix = randomUUID().slice(0, 8);
const roadId = `road-smoke-${suffix}`;
const momentId = `moment-smoke-${suffix}`;

async function call(path: string, init: RequestInit = {}, token?: string) {
  const response = await fetch(`${base}${path}`, { ...init, headers: { ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  return { status: response.status, body: await response.json().catch(() => null) };
}

let tokenA = '';
try {
  const health = await call('/health');
  assert.equal(health.status, 200);
  const a = await call('/auth/dev', { method: 'POST', body: JSON.stringify({ name: `旅人甲${suffix}` }) });
  const b = await call('/auth/dev', { method: 'POST', body: JSON.stringify({ name: `旅人乙${suffix}` }) });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  tokenA = a.body.token;
  assert.notEqual(a.body.user.id, b.body.user.id);

  const road = { id: roadId, title: '测试环湖路线', region: '浙江 · 淳安', summary: '本地双账号验证', days: 2, distanceKm: 110, stops: [{ id: 'stop-1', day: 1, name: '杭州', note: '' }, { id: 'stop-2', day: 2, name: '千岛湖', note: '' }] };
  assert.equal((await call(`/api/roadbooks/${roadId}`, { method: 'PUT', body: JSON.stringify(road) }, tokenA)).status, 200);
  const feed = await call('/api/roadbooks');
  assert.equal(feed.status, 200);
  assert.equal(feed.body.items.find((item: { id: string }) => item.id === roadId)?.ownerId, a.body.user.id);
  assert.equal((await call(`/api/roadbooks/${roadId}`, { method: 'PUT', body: JSON.stringify(road) }, b.body.token)).status, 403);

  const image = await readFile(fileURLToPath(new URL('../../assets/camp-lake.png', import.meta.url)));
  const form = new FormData();
  form.append('photo', new Blob([image], { type: 'image/png' }), 'lake.png');
  assert.equal((await call('/api/media', { method: 'POST', body: form })).status, 401);
  const uploaded = await call('/api/media', { method: 'POST', body: form }, tokenA);
  assert.equal(uploaded.status, 201);
  assert.equal((await fetch(uploaded.body.url)).status, 200);

  const moment = { id: momentId, caption: '两账号可见', location: '千岛湖', photos: [{ uri: uploaded.body.url }] };
  assert.equal((await call(`/api/moments/${momentId}`, { method: 'PUT', body: JSON.stringify(moment) }, tokenA)).status, 200);
  assert.ok((await call('/api/moments')).body.items.some((item: { id: string }) => item.id === momentId));
  assert.equal((await call('/auth/wechat', { method: 'POST', body: JSON.stringify({ code: 'not-real' }) })).status, 503);
  console.log('PASS: health, two local accounts, public feed, ownership, media upload, WeChat unconfigured response');
} finally {
  if (tokenA) {
    await call(`/api/roadbooks/${roadId}`, { method: 'DELETE' }, tokenA);
    await call(`/api/moments/${momentId}`, { method: 'DELETE' }, tokenA);
  }
}
