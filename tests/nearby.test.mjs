import assert from 'node:assert/strict';
import test from 'node:test';
import { distanceKm, formatDistance, nearbyCamps } from '../src/nearby.ts';

const campsite = (id, latitude, longitude, isDemo = false) => ({ id, latitude, longitude, isDemo });

test('calculates straight-line distance in kilometers', () => {
  assert.equal(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 }), 0);
  assert.ok(Math.abs(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }) - 111.2) < 0.1);
  assert.equal(formatDistance(0.5), '500 米');
  assert.equal(formatDistance(1.24), '1.2 公里');
});

test('nearby camps are real, geocoded, within radius, and nearest first', () => {
  const camps = [
    campsite('far', 39.9, 117.5),
    campsite('missing', undefined, undefined),
    campsite('near', 39.9, 116.41),
    campsite('demo', 39.9, 116.405, true),
    campsite('invalid', 1000, 116.4),
  ];
  const position = { latitude: 39.9, longitude: 116.4 };
  assert.deepEqual(nearbyCamps(camps, position, 50).map(({ item }) => item.id), ['near']);
  assert.deepEqual(nearbyCamps(camps, position, 200).map(({ item }) => item.id), ['near', 'far']);
});
