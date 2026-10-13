import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AppData, Campsite, Moment, Roadbook } from './data';

const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') || '';
const tokenKey = 'campcar:cloud-token:v1';
export const cloudEnabled = Boolean(baseUrl);
export const devLoginEnabled = process.env.EXPO_PUBLIC_ENABLE_DEV_LOGIN === 'true';
export type CloudUser = { id: string; displayName: string };
export type CloudSession = { user: CloudUser; token: string };

async function readToken() {
  return Platform.OS === 'web' ? AsyncStorage.getItem(tokenKey) : SecureStore.getItemAsync(tokenKey);
}
async function writeToken(value: string | null) {
  if (Platform.OS === 'web') {
    if (value) await AsyncStorage.setItem(tokenKey, value);
    else await AsyncStorage.removeItem(tokenKey);
  } else if (value) await SecureStore.setItemAsync(tokenKey, value);
  else await SecureStore.deleteItemAsync(tokenKey);
}

class CloudError extends Error { constructor(message: string, public status: number) { super(message); } }

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!baseUrl) throw new Error('未配置云端 API 地址');
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string };
    throw new CloudError(body.error || `服务请求失败 (${response.status})`, response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export async function restoreSession(): Promise<CloudSession | null> {
  const token = await readToken();
  if (!token || !baseUrl) return null;
  try {
    const result = await request<{ user: CloudUser }>('/auth/me', {}, token);
    return { user: result.user, token };
  } catch (error) {
    if (error instanceof CloudError && error.status === 401) await writeToken(null);
    return null;
  }
}

export async function devLogin(name: string): Promise<CloudSession> {
  if (!devLoginEnabled) throw new Error('未启用本地测试登录');
  const session = await request<CloudSession>('/auth/dev', { method: 'POST', body: JSON.stringify({ name }) });
  await writeToken(session.token);
  return session;
}

export async function loginWithWechatCode(code: string): Promise<CloudSession> {
  const session = await request<CloudSession>('/auth/wechat', { method: 'POST', body: JSON.stringify({ code }) });
  await writeToken(session.token);
  return session;
}

export async function logout() { await writeToken(null); }

export async function fetchPublicData(): Promise<Pick<AppData, 'roadbooks' | 'campsites' | 'moments'>> {
  const [roads, camps, moments] = await Promise.all([
    request<{ items: Roadbook[] }>('/api/roadbooks'),
    request<{ items: Campsite[] }>('/api/campsites'),
    request<{ items: Moment[] }>('/api/moments'),
  ]);
  return { roadbooks: roads.items, campsites: camps.items, moments: moments.items };
}

async function uploadImage(uri: string, token: string): Promise<string> {
  if (/^https?:\/\//.test(uri)) return uri;
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('photo', blob, 'campcar.jpg');
  } else {
    const extension = uri.match(/\.(png|webp|jpe?g)(?:\?|$)/i)?.[1]?.toLowerCase() || 'jpg';
    const type = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
    form.append('photo', { uri, name: `campcar.${extension}`, type } as unknown as Blob);
  }
  const result = await request<{ url: string }>('/api/media', { method: 'POST', body: form }, token);
  return result.url;
}

async function publish<T extends Roadbook | Campsite | Moment>(kind: string, item: T, token: string): Promise<T> {
  const { isDemo: _isDemo, ownerId: _ownerId, ...payload } = item;
  const result = await request<{ item: T }>(`/api/${kind}/${encodeURIComponent(item.id)}`, { method: 'PUT', body: JSON.stringify(payload) }, token);
  return result.item;
}

export async function publishRoadbook(item: Roadbook, token: string): Promise<Roadbook> {
  const cover = item.cover && !['lake', 'road'].includes(item.cover) ? await uploadImage(item.cover, token) : undefined;
  return publish('roadbooks', { ...item, cover }, token);
}
export async function publishCampsite(item: Campsite, token: string): Promise<Campsite> {
  const photo = item.photo && !['lake', 'road'].includes(item.photo) ? await uploadImage(item.photo, token) : undefined;
  return publish('campsites', { ...item, photo }, token);
}
export async function publishMoment(item: Moment, token: string): Promise<Moment> {
  const photos = await Promise.all(item.photos.map(async (photo) => ({ uri: await uploadImage(photo.uri, token) })));
  return publish('moments', { ...item, photos }, token);
}
