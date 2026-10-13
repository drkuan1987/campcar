import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Linking, Platform, Share } from 'react-native';
import { Campsite, Photo, Roadbook, Stop } from './data';

export async function choosePhotos(multiple = false): Promise<Photo[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: multiple,
    selectionLimit: multiple ? 4 : 1,
    quality: 0.8,
  });
  if (result.canceled) return [];

  return Promise.all(
    result.assets.map(async (asset, index) => {
      if (Platform.OS === 'web') {
        const source = asset.file ?? await (await fetch(asset.uri)).blob();
        const bitmap = await createImageBitmap(source);
        const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return { uri: canvas.toDataURL('image/jpeg', 0.72) };
      }
      if (!FileSystem.documentDirectory) {
        return { uri: asset.uri };
      }
      const extension = asset.uri.match(/\.(jpe?g|png|webp|heic)(?:\?|$)/i)?.[1] ?? 'jpg';
      const destination = `${FileSystem.documentDirectory}campcar-${Date.now()}-${index}.${extension}`;
      await FileSystem.copyAsync({ from: asset.uri, to: destination });
      return { uri: destination };
    }),
  );
}

function mapSearchUrl(query: string): string {
  return `https://uri.amap.com/search?keyword=${encodeURIComponent(query)}&src=campcar`;
}

export function mapUrl(place: Pick<Stop, 'name' | 'latitude' | 'longitude'>): string {
  if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
    const destination = `${place.longitude},${place.latitude},${place.name}`;
    return `https://uri.amap.com/navigation?to=${encodeURIComponent(destination)}&mode=car&src=campcar&coordinate=wgs84`;
  }
  return mapSearchUrl(place.name);
}

export async function navigateTo(place: Pick<Stop, 'name' | 'latitude' | 'longitude'>): Promise<void> {
  await Linking.openURL(mapUrl(place));
}

export async function navigateToCamp(camp: Campsite): Promise<void> {
  await Linking.openURL(mapUrl({ name: `${camp.name} ${camp.region} ${camp.address}`, latitude: camp.latitude, longitude: camp.longitude }));
}

export async function shareRoadbook(roadbook: Roadbook): Promise<void> {
  const itinerary = roadbook.stops.map((stop, index) => `${index + 1}. 第${stop.day}天 · ${stop.name}${stop.note ? ` — ${stop.note}` : ''}`).join('\n');
  await Share.share({
    title: roadbook.title,
    message: `${roadbook.title}\n${roadbook.region} · ${roadbook.days}天 · 约${roadbook.distanceKm}公里\n\n${roadbook.summary}\n\n路书\n${itinerary}\n\n来自山野泊车`,
  });
}

export async function shareCamp(camp: Campsite): Promise<void> {
  await Share.share({
    title: camp.name,
    message: `${camp.name}\n${camp.region} · ${camp.address}\n营位 ¥${camp.pricePerNight}/晚\n补水：${camp.water ? camp.waterFee : '无'}\n接电：${camp.power ? camp.powerFee : '无'}\n\n${camp.description}\n\n来自山野泊车`,
  });
}
