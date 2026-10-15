import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { ApiError, authenticate, ensureUser, exchangeWechatCode, issueToken } from './auth.js';
import { config } from './config.js';
import { db } from './db.js';
import { distanceKm } from './geo.js';
import { storeImage } from './storage.js';

const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const remoteImage = z.string().url().refine((value) => value.startsWith('https://') || (!config.production && value.startsWith('http://')));
const coordinate = z.number().finite();
const stop = z.object({ id, day: z.number().int().min(1).max(60), name: z.string().trim().min(1).max(120), note: z.string().max(2000), latitude: coordinate.min(-90).max(90).optional(), longitude: coordinate.min(-180).max(180).optional() });
const base = z.object({ id, createdAt: z.iso.datetime().optional() });
const schemas = {
  roadbooks: base.extend({ title: z.string().trim().min(1).max(160), region: z.string().trim().min(1).max(160), summary: z.string().max(5000), days: z.number().int().min(1).max(60), distanceKm: z.number().min(0).max(100000), cover: remoteImage.optional(), stops: z.array(stop).min(2).max(100) }),
  campsites: base.extend({ name: z.string().trim().min(1).max(160), region: z.string().trim().min(1).max(160), address: z.string().trim().min(1).max(500), description: z.string().max(5000), pricePerNight: z.number().min(0).max(100000), water: z.boolean(), waterFee: z.string().max(100), power: z.boolean(), powerFee: z.string().max(100), latitude: coordinate.min(-90).max(90).optional(), longitude: coordinate.min(-180).max(180).optional(), photo: remoteImage.optional() }),
  moments: base.extend({ caption: z.string().max(5000), location: z.string().max(160), photos: z.array(z.object({ uri: remoteImage })).max(4) }),
};
type Kind = keyof typeof schemas;
const validKind = (value: string): value is Kind => value in schemas;

export const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: (origin, callback) => {
  if (!origin || config.corsOrigins.includes(origin) || (!config.production && /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(origin))) callback(null, true);
  else callback(new ApiError(403, '来源不允许'));
} }));
app.use(express.json({ limit: '100kb' }));
if (!config.production) app.use('/uploads', express.static(config.uploadDirectory));

app.get('/health', async (_req, res) => {
  await db.query('SELECT 1');
  res.json({ status: 'ok' });
});

const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false });
app.post('/auth/dev', authLimit, async (req, res) => {
  if (!config.devLoginEnabled || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip || '')) throw new ApiError(404, '未启用本地测试登录');
  const parsed = z.object({ name: z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_\u4e00-\u9fff]+$/) }).safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, '测试账号名称无效');
  const user = await ensureUser('dev', parsed.data.name, parsed.data.name);
  res.json({ user, token: await issueToken(user.id) });
});

app.post('/auth/wechat', authLimit, async (req, res) => {
  const parsed = z.object({ code: z.string().min(1).max(300) }).safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, '缺少微信授权码');
  const subject = await exchangeWechatCode(parsed.data.code);
  const user = await ensureUser('wechat', subject, '微信用户');
  res.json({ user, token: await issueToken(user.id) });
});

app.get('/auth/me', async (req, res) => {
  const userId = await authenticate(req);
  const result = await db.query<{ id: string; display_name: string }>('SELECT id, display_name FROM users WHERE id = $1', [userId]);
  if (!result.rows[0]) throw new ApiError(401, '账号不存在');
  res.json({ user: { id: result.rows[0].id, displayName: result.rows[0].display_name } });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
app.post('/api/media', upload.single('photo'), async (req, res) => {
  const userId = await authenticate(req);
  if (!req.file) throw new ApiError(400, '请选择图片');
  res.status(201).json({ url: await storeImage(userId, req.file.buffer) });
});

app.post('/api/campsites/nearby', async (req, res) => {
  const parsed = z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    radiusKm: z.number().finite().min(1).max(500).default(50),
  }).safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, '位置或距离范围无效');
  const { latitude, longitude, radiusKm } = parsed.data;
  const latitudeDelta = radiusKm / 111.2;
  const longitudeDelta = Math.min(180, radiusKm / (111.2 * Math.max(0.01, Math.cos(latitude * Math.PI / 180))));
  const result = await db.query<{ payload: Record<string, unknown>; owner_id: string }>(
    `SELECT payload, owner_id FROM entries
     WHERE kind = 'campsites' AND payload ? 'latitude' AND payload ? 'longitude'
       AND (payload->>'latitude')::double precision BETWEEN $1 AND $2
       AND ($5::boolean OR (payload->>'longitude')::double precision BETWEEN $3 AND $4)`,
    [Math.max(-90, latitude - latitudeDelta), Math.min(90, latitude + latitudeDelta), longitude - longitudeDelta, longitude + longitudeDelta,
      longitudeDelta >= 180 || longitude - longitudeDelta < -180 || longitude + longitudeDelta > 180],
  );
  const items = result.rows.flatMap((row) => {
    const campsiteLatitude = row.payload.latitude;
    const campsiteLongitude = row.payload.longitude;
    if (typeof campsiteLatitude !== 'number' || typeof campsiteLongitude !== 'number') return [];
    const distance = distanceKm(latitude, longitude, campsiteLatitude, campsiteLongitude);
    return distance <= radiusKm ? [{ item: { ...row.payload, ownerId: row.owner_id }, distanceKm: distance }] : [];
  }).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 200);
  res.setHeader('Cache-Control', 'no-store').json({ items });
});

app.get('/api/:kind', async (req, res) => {
  const kind = String(req.params.kind);
  if (!validKind(kind)) throw new ApiError(404, '内容类型不存在');
  const result = await db.query<{ payload: Record<string, unknown>; owner_id: string }>('SELECT payload, owner_id FROM entries WHERE kind = $1 ORDER BY created_at DESC LIMIT 200', [kind]);
  res.json({ items: result.rows.map((row) => ({ ...row.payload, ownerId: row.owner_id })) });
});

app.put('/api/:kind/:id', async (req, res) => {
  const kind = String(req.params.kind);
  if (!validKind(kind)) throw new ApiError(404, '内容类型不存在');
  const userId = await authenticate(req);
  const parsed = schemas[kind].safeParse(req.body);
  if (!parsed.success || parsed.data?.id !== req.params.id) throw new ApiError(400, '内容格式无效');
  const payload = { ...parsed.data, createdAt: parsed.data.createdAt || new Date().toISOString() };
  const result = await db.query<{ payload: Record<string, unknown> }>(
    `INSERT INTO entries (kind, id, owner_id, payload) VALUES ($1, $2, $3, $4)
     ON CONFLICT (kind, id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
     WHERE entries.owner_id = EXCLUDED.owner_id RETURNING payload`,
    [kind, payload.id, userId, JSON.stringify(payload)],
  );
  if (!result.rows[0]) throw new ApiError(403, '不能修改其他用户的内容');
  res.json({ item: { ...result.rows[0].payload, ownerId: userId } });
});

app.delete('/api/:kind/:id', async (req, res) => {
  const kind = String(req.params.kind);
  if (!validKind(kind)) throw new ApiError(404, '内容类型不存在');
  const userId = await authenticate(req);
  const result = await db.query('DELETE FROM entries WHERE kind = $1 AND id = $2 AND owner_id = $3', [kind, req.params.id, userId]);
  if (!result.rowCount) throw new ApiError(404, '内容不存在或无权删除');
  res.status(204).end();
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof multer.MulterError) return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? '图片不得超过 5 MB' : '上传失败' });
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
  console.error('Unexpected server error:', error);
  return res.status(500).json({ error: '服务器暂时不可用' });
});
