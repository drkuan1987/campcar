import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import OSS from 'ali-oss';
import { ApiError } from './auth.js';
import { config } from './config.js';

function detectedImage(buffer: Buffer): { extension: string; contentType: string } {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: 'jpg', contentType: 'image/jpeg' };
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: 'png', contentType: 'image/png' };
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { extension: 'webp', contentType: 'image/webp' };
  throw new ApiError(400, '仅支持 JPEG、PNG 或 WebP 图片');
}

export async function storeImage(userId: string, buffer: Buffer): Promise<string> {
  const image = detectedImage(buffer);
  const key = `${userId}/${randomUUID()}.${image.extension}`;
  if (config.oss.bucket) {
    const client = new OSS({
      region: config.oss.region,
      bucket: config.oss.bucket,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
    });
    await client.put(key, buffer, { headers: { 'Content-Type': image.contentType } });
    return `${config.oss.publicBaseUrl}/${key}`;
  }
  const destination = path.join(config.uploadDirectory, key);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer);
  return `${config.publicBaseUrl}/uploads/${key}`;
}
