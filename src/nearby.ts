import type { Campsite } from './data';

export type Coordinates = { latitude: number; longitude: number };
export type NearbyCamp = { item: Campsite; distanceKm: number };

function validCoordinates(value: { latitude?: number; longitude?: number }): value is Coordinates {
  return Number.isFinite(value.latitude) && Number.isFinite(value.longitude)
    && Math.abs(value.latitude!) <= 90 && Math.abs(value.longitude!) <= 180;
}

export function distanceKm(a: Coordinates, b: Coordinates): number {
  const radians = Math.PI / 180;
  const deltaLatitude = (b.latitude - a.latitude) * radians;
  const deltaLongitude = (b.longitude - a.longitude) * radians;
  const arc = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(a.latitude * radians) * Math.cos(b.latitude * radians) * Math.sin(deltaLongitude / 2) ** 2;
  const safeArc = Math.min(1, Math.max(0, arc));
  return 6371.0088 * 2 * Math.atan2(Math.sqrt(safeArc), Math.sqrt(1 - safeArc));
}

export function nearbyCamps(campsites: Campsite[], position: Coordinates, radiusKm: number): NearbyCamp[] {
  return campsites
    .filter((item) => !item.isDemo && validCoordinates(item))
    .map((item) => ({ item, distanceKm: distanceKm(position, { latitude: item.latitude!, longitude: item.longitude! }) }))
    .filter(({ distanceKm: distance }) => distance <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.item.id.localeCompare(b.item.id));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.max(1, Math.round(km * 1000))} 米` : `${km < 10 ? km.toFixed(1) : Math.round(km)} 公里`;
}
