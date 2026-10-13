import AsyncStorage from '@react-native-async-storage/async-storage';

export type Photo = { uri: string };

export type Stop = {
  id: string;
  day: number;
  name: string;
  note: string;
  latitude?: number;
  longitude?: number;
};

export type Roadbook = {
  id: string;
  ownerId?: string;
  title: string;
  region: string;
  summary: string;
  days: number;
  distanceKm: number;
  cover?: string;
  stops: Stop[];
  createdAt: string;
  isDemo?: boolean;
};

export type Campsite = {
  id: string;
  ownerId?: string;
  name: string;
  region: string;
  address: string;
  description: string;
  pricePerNight: number;
  water: boolean;
  waterFee: string;
  power: boolean;
  powerFee: string;
  latitude?: number;
  longitude?: number;
  photo?: string;
  createdAt: string;
  isDemo?: boolean;
};

export type Moment = {
  id: string;
  ownerId?: string;
  caption: string;
  location: string;
  photos: Photo[];
  createdAt: string;
  isDemo?: boolean;
};

export type AppData = {
  roadbooks: Roadbook[];
  campsites: Campsite[];
  moments: Moment[];
  favorites: string[];
};

const STORAGE_KEY = 'campcar:data:v1';

export const demoData: AppData = {
  roadbooks: [
    {
      id: 'demo-road-1',
      title: '去川西，追一场日落',
      region: '四川 · 川西环线',
      summary: '穿过山谷与草甸，慢慢开到雪山脚下。适合第一次自驾川西的轻松路书。',
      days: 4,
      distanceKm: 620,
      cover: 'road',
      createdAt: '2026-09-22T09:00:00.000Z',
      isDemo: true,
      stops: [
        { id: 'demo-stop-1', day: 1, name: '成都', note: '出发前检查车辆和露营装备。', latitude: 30.5728, longitude: 104.0668 },
        { id: 'demo-stop-2', day: 1, name: '四姑娘山', note: '沿途观景，提前确认海拔与天气。', latitude: 31.0016, longitude: 102.8576 },
        { id: 'demo-stop-3', day: 2, name: '丹巴', note: '留半天给藏寨和山谷。', latitude: 30.8775, longitude: 101.8872 },
        { id: 'demo-stop-4', day: 3, name: '新都桥', note: '傍晚抵达，等待金色日落。', latitude: 30.0415, longitude: 101.4947 },
      ],
    },
    {
      id: 'demo-road-2',
      title: '环洱海，把时间放慢',
      region: '云南 · 大理',
      summary: '从古城到湖边，收集晨光、咖啡和一个不赶路的周末。',
      days: 2,
      distanceKm: 135,
      cover: 'lake',
      createdAt: '2026-09-18T09:00:00.000Z',
      isDemo: true,
      stops: [
        { id: 'demo-stop-5', day: 1, name: '大理古城', note: '早上出发，补充饮水和食物。', latitude: 25.6969, longitude: 100.1635 },
        { id: 'demo-stop-6', day: 1, name: '喜洲古镇', note: '逛集市，尝一块喜洲粑粑。', latitude: 25.8566, longitude: 100.1228 },
        { id: 'demo-stop-7', day: 2, name: '双廊', note: '看湖景，返程前给车辆充电或加油。', latitude: 25.9082, longitude: 100.1977 },
      ],
    },
  ],
  campsites: [
    {
      id: 'demo-camp-1',
      name: '雪山湖畔营地 · 示例',
      region: '四川 · 阿坝',
      address: '示例地点，仅用于体验功能',
      description: '靠近山谷的开阔草地。房车设施与价格均为演示信息，实际出行前请向营地核实。',
      pricePerNight: 128,
      water: true,
      waterFee: '示例：免费',
      power: true,
      powerFee: '示例：¥20/晚',
      photo: 'lake',
      createdAt: '2026-09-20T09:00:00.000Z',
      isDemo: true,
    },
    {
      id: 'demo-camp-2',
      name: '松林星空营地 · 示例',
      region: '云南 · 大理',
      address: '示例地点，仅用于体验功能',
      description: '适合周末轻露营的安静空间。以下设施和费用仅作界面演示。',
      pricePerNight: 88,
      water: true,
      waterFee: '示例：¥5/次',
      power: false,
      powerFee: '暂无',
      photo: 'road',
      createdAt: '2026-09-16T09:00:00.000Z',
      isDemo: true,
    },
  ],
  moments: [
    {
      id: 'demo-moment-1',
      caption: '把车停在风景里，让今晚慢一点。',
      location: '山野日记 · 示例动态',
      photos: [{ uri: 'lake' }],
      createdAt: '2026-09-21T09:00:00.000Z',
      isDemo: true,
    },
  ],
  favorites: [],
};

export async function loadData(): Promise<AppData> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return demoData;
  const parsed = JSON.parse(stored) as Partial<AppData>;
  return {
    roadbooks: Array.isArray(parsed.roadbooks) ? parsed.roadbooks : demoData.roadbooks,
    campsites: Array.isArray(parsed.campsites) ? parsed.campsites : demoData.campsites,
    moments: Array.isArray(parsed.moments) ? parsed.moments : demoData.moments,
    favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
  };
}

export function saveData(data: AppData): Promise<void> {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
