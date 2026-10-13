import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { choosePhotos } from './actions';
import { Campsite, makeId, Moment, Roadbook, Stop } from './data';
import { Button, Field, Icon, palette, PhotoThumb, RoundButton } from './ui';

function ComposerShell({ title, subtitle, onClose, children, onSave, saveLabel = '保存' }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; onSave: () => void; saveLabel?: string }) {
  return (
    <SafeAreaView style={styles.shell}>
      <View style={styles.header}>
        <RoundButton icon="close" onPress={onClose} />
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 38 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{subtitle}</Text>
          {children}
          <View style={{ height: 18 }} />
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.footer}><Button label={saveLabel} icon="checkmark" onPress={onSave} /></View>
    </SafeAreaView>
  );
}

function PhotoPicker({ photos, onChange, multiple = false }: { photos: string[]; onChange: (photos: string[]) => void; multiple?: boolean }) {
  async function pick() {
    try {
      const selected = await choosePhotos(multiple);
      if (selected.length) onChange([...photos, ...selected.map((photo) => photo.uri)].slice(0, multiple ? 4 : 1));
    } catch {
      Alert.alert('照片选择失败', '请检查相册权限后再试。');
    }
  }
  return (
    <View style={styles.photoSection}>
      <Text style={styles.label}>照片 {multiple ? '· 最多 4 张' : '· 封面'}</Text>
      <View style={styles.photoRow}>
        {photos.map((uri, index) => (
          <View key={`${uri}-${index}`}>
            <PhotoThumb uri={uri} />
            <Pressable onPress={() => onChange(photos.filter((_, itemIndex) => itemIndex !== index))} style={styles.removePhoto}><Icon name="close" size={13} color={palette.white} /></Pressable>
          </View>
        ))}
        {photos.length < (multiple ? 4 : 1) && <Pressable onPress={pick} style={styles.addPhoto}><Icon name="image-outline" size={23} color={palette.forest} /><Text style={styles.addPhotoText}>添加照片</Text></Pressable>}
      </View>
    </View>
  );
}

function ToggleRow({ label, subtitle, value, onPress, icon }: { label: string; subtitle: string; value: boolean; onPress: () => void; icon: 'water-outline' | 'flash-outline' }) {
  return <Pressable onPress={onPress} style={styles.toggleRow}><View style={styles.toggleIcon}><Icon name={icon} size={20} color={palette.forest} /></View><View style={{ flex: 1 }}><Text style={styles.toggleTitle}>{label}</Text><Text style={styles.toggleSubtitle}>{subtitle}</Text></View><View style={[styles.toggle, value && styles.toggleOn]}><View style={[styles.toggleKnob, value && { marginLeft: 19 }]} /></View></Pressable>;
}

export function RoadbookEditor({ initial, onSave, onClose }: { initial?: Roadbook; onSave: (roadbook: Roadbook) => void; onClose: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [region, setRegion] = useState(initial?.region ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [days, setDays] = useState(String(initial?.days ?? 2));
  const [distance, setDistance] = useState(initial?.distanceKm ? String(initial.distanceKm) : '');
  const [cover, setCover] = useState<string[]>(initial?.cover ? [initial.cover] : []);
  const [stops, setStops] = useState<Stop[]>(initial?.stops ?? [
    { id: makeId('stop'), day: 1, name: '', note: '' },
    { id: makeId('stop'), day: 1, name: '', note: '' },
  ]);
  const [coordinates, setCoordinates] = useState<Record<string, { latitude: string; longitude: string }>>(() => Object.fromEntries((initial?.stops ?? []).map((stop) => [stop.id, { latitude: stop.latitude === undefined ? '' : String(stop.latitude), longitude: stop.longitude === undefined ? '' : String(stop.longitude) }])));

  function updateStop(id: string, change: Partial<Stop>) {
    setStops((items) => items.map((stop) => stop.id === id ? { ...stop, ...change } : stop));
  }
  function updateCoordinate(id: string, key: 'latitude' | 'longitude', value: string) {
    setCoordinates((current) => ({ ...current, [id]: { latitude: current[id]?.latitude ?? '', longitude: current[id]?.longitude ?? '', [key]: value } }));
  }
  function save() {
    const tripDays = Number(days);
    const tripDistance = Number(distance);
    if (!title.trim() || !region.trim() || stops.filter((stop) => stop.name.trim()).length < 2) {
      Alert.alert('还差一点', '请填写路线名称、地区和至少两个途经点。');
      return;
    }
    if (!Number.isInteger(tripDays) || tripDays < 1 || tripDays > 60 || !Number.isFinite(tripDistance) || tripDistance < 0) {
      Alert.alert('检查行程', '天数请输入 1–60，里程请输入不小于 0 的数字。');
      return;
    }
    for (const stop of stops.filter((item) => item.name.trim())) {
      const coordinate = coordinates[stop.id];
      if (coordinate && (coordinate.latitude.trim() || coordinate.longitude.trim())) {
        const latitude = Number(coordinate.latitude);
        const longitude = Number(coordinate.longitude);
        if (!coordinate.latitude.trim() || !coordinate.longitude.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
          Alert.alert('检查坐标', `请为「${stop.name}」填写有效的经纬度，或将两项都留空。`);
          return;
        }
      }
    }
    const validStops = stops.filter((stop) => stop.name.trim()).map((stop) => ({ ...stop, name: stop.name.trim(), note: stop.note.trim(), day: Math.min(tripDays, Math.max(1, Number(stop.day) || 1)), latitude: coordinates[stop.id]?.latitude.trim() ? Number(coordinates[stop.id].latitude) : undefined, longitude: coordinates[stop.id]?.longitude.trim() ? Number(coordinates[stop.id].longitude) : undefined }));
    onSave({ id: initial?.id ?? makeId('road'), title: title.trim(), region: region.trim(), summary: summary.trim(), days: tripDays, distanceKm: tripDistance, cover: cover[0], stops: validStops, createdAt: initial?.createdAt ?? new Date().toISOString(), isDemo: false });
  }

  return <ComposerShell title={initial ? '编辑路书' : '新建路书'} subtitle="把想去的地方，连成一段旅程。" onClose={onClose} onSave={save} saveLabel={initial ? '保存修改' : '发布路书'}>
    <PhotoPicker photos={cover} onChange={setCover} />
    <Field label="路线名称 *" value={title} onChangeText={setTitle} placeholder="例如：沿着洱海慢慢开" />
    <Field label="地区 *" value={region} onChangeText={setRegion} placeholder="例如：云南 · 大理" />
    <Field label="旅行简介" value={summary} onChangeText={setSummary} placeholder="这趟旅行有什么特别？" multiline />
    <View style={styles.twoColumns}><View style={{ flex: 1 }}><Field label="天数" value={days} onChangeText={setDays} placeholder="2" keyboardType="numeric" suffix="天" /></View><View style={{ flex: 1 }}><Field label="里程" value={distance} onChangeText={setDistance} placeholder="0" keyboardType="decimal-pad" suffix="km" /></View></View>
    <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>途经点</Text><Text style={styles.sectionHint}>按行程顺序填写，路书会自动生成</Text></View><Pressable onPress={() => setStops((items) => [...items, { id: makeId('stop'), day: Math.min(Number(days) || 1, 60), name: '', note: '' }])}><Text style={styles.addLink}>＋ 添加</Text></Pressable></View>
    {stops.map((stop, index) => <View style={styles.stopCard} key={stop.id}>
      <View style={styles.stopHeader}><View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View><Text style={styles.stopHeading}>第 {index + 1} 站</Text>{stops.length > 2 && <Pressable onPress={() => setStops((items) => items.filter((item) => item.id !== stop.id))}><Icon name="trash-outline" size={18} color={palette.muted} /></Pressable>}</View>
      <Field label="地点 *" value={stop.name} onChangeText={(name) => updateStop(stop.id, { name })} placeholder="城市、景点或营地名称" />
      <Field label="第几天" value={String(stop.day)} onChangeText={(value) => updateStop(stop.id, { day: Number(value) || 1 })} placeholder="1" keyboardType="numeric" />
      <Field label="这一站的安排" value={stop.note} onChangeText={(note) => updateStop(stop.id, { note })} placeholder="看日落、补给、过夜……" multiline />
      <Text style={styles.sectionHint}>选填坐标后，可直接调起驾车导航。</Text>
      <View style={styles.twoColumns}><View style={{ flex: 1 }}><Field label="纬度" value={coordinates[stop.id]?.latitude ?? ''} onChangeText={(value) => updateCoordinate(stop.id, 'latitude', value)} placeholder="25.6969" keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="经度" value={coordinates[stop.id]?.longitude ?? ''} onChangeText={(value) => updateCoordinate(stop.id, 'longitude', value)} placeholder="100.1635" keyboardType="decimal-pad" /></View></View>
    </View>)}
  </ComposerShell>;
}

export function CampEditor({ initial, onSave, onClose }: { initial?: Campsite; onSave: (camp: Campsite) => void; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [region, setRegion] = useState(initial?.region ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.pricePerNight ? String(initial.pricePerNight) : '');
  const [water, setWater] = useState(initial?.water ?? false);
  const [waterFee, setWaterFee] = useState(initial?.waterFee ?? '');
  const [power, setPower] = useState(initial?.power ?? false);
  const [powerFee, setPowerFee] = useState(initial?.powerFee ?? '');
  const [latitude, setLatitude] = useState(initial?.latitude ? String(initial.latitude) : '');
  const [longitude, setLongitude] = useState(initial?.longitude ? String(initial.longitude) : '');
  const [photos, setPhotos] = useState<string[]>(initial?.photo ? [initial.photo] : []);

  function save() {
    const nightlyPrice = Number(price);
    if (!name.trim() || !region.trim() || !address.trim()) {
      Alert.alert('还差一点', '请填写营地名称、地区和地址。');
      return;
    }
    if (!Number.isFinite(nightlyPrice) || nightlyPrice < 0 || !price.trim()) {
      Alert.alert('检查费用', '请输入不小于 0 的营位价格。');
      return;
    }
    if (Boolean(latitude.trim()) !== Boolean(longitude.trim()) || (latitude.trim() && (!Number.isFinite(Number(latitude)) || Math.abs(Number(latitude)) > 90)) || (longitude.trim() && (!Number.isFinite(Number(longitude)) || Math.abs(Number(longitude)) > 180))) {
      Alert.alert('检查坐标', '请同时填写有效的纬度和经度，或将两项都留空。');
      return;
    }
    onSave({
      id: initial?.id ?? makeId('camp'), name: name.trim(), region: region.trim(), address: address.trim(), description: description.trim(), pricePerNight: nightlyPrice,
      water, waterFee: water ? waterFee.trim() || '请向营地咨询' : '无', power, powerFee: power ? powerFee.trim() || '请向营地咨询' : '无',
      latitude: latitude.trim() ? Number(latitude) : undefined, longitude: longitude.trim() ? Number(longitude) : undefined,
      photo: photos[0], createdAt: initial?.createdAt ?? new Date().toISOString(), isDemo: false,
    });
  }

  return <ComposerShell title={initial ? '编辑营地' : '收录营地'} subtitle="好营地，值得被更多旅人发现。" onClose={onClose} onSave={save} saveLabel={initial ? '保存修改' : '收录营地'}>
    <PhotoPicker photos={photos} onChange={setPhotos} />
    <Field label="营地名称 *" value={name} onChangeText={setName} placeholder="例如：湖畔松林营地" />
    <Field label="所在地区 *" value={region} onChangeText={setRegion} placeholder="例如：云南 · 大理" />
    <Field label="详细地址 *" value={address} onChangeText={setAddress} placeholder="方便其他人确认位置" />
    <Field label="营地介绍" value={description} onChangeText={setDescription} placeholder="环境、预约方式、注意事项……" multiline />
    <Field label="营位价格 *" value={price} onChangeText={setPrice} placeholder="例如：128" keyboardType="decimal-pad" suffix="元/晚" />
    <Text style={styles.sectionTitle}>房车设施</Text>
    <ToggleRow label="可接水" subtitle="是否能为房车补水" icon="water-outline" value={water} onPress={() => setWater(!water)} />
    {water && <Field label="补水费用" value={waterFee} onChangeText={setWaterFee} placeholder="例如：免费 / ¥5 每次" />}
    <ToggleRow label="可接电" subtitle="是否提供房车充电或外接电源" icon="flash-outline" value={power} onPress={() => setPower(!power)} />
    {power && <Field label="接电费用" value={powerFee} onChangeText={setPowerFee} placeholder="例如：¥20 每晚" />}
    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>位置坐标（选填）</Text>
    <Text style={styles.sectionHint}>有准确坐标时可填写，地图会直接规划驾车路线。</Text>
    <View style={styles.twoColumns}><View style={{ flex: 1 }}><Field label="纬度" value={latitude} onChangeText={setLatitude} placeholder="25.6969" keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="经度" value={longitude} onChangeText={setLongitude} placeholder="100.1635" keyboardType="decimal-pad" /></View></View>
  </ComposerShell>;
}

export function MomentEditor({ onSave, onClose }: { onSave: (moment: Moment) => void; onClose: () => void }) {
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  function save() {
    if (!caption.trim() && photos.length === 0) {
      Alert.alert('添加一点内容', '写一句话或选择一张照片吧。');
      return;
    }
    onSave({ id: makeId('moment'), caption: caption.trim(), location: location.trim(), photos: photos.map((uri) => ({ uri })), createdAt: new Date().toISOString(), isDemo: false });
  }
  return <ComposerShell title="分享此刻" subtitle="把山野里的片刻，留在这里。" onClose={onClose} onSave={save} saveLabel="发布照片">
    <PhotoPicker photos={photos} onChange={setPhotos} multiple />
    <Field label="说点什么" value={caption} onChangeText={setCaption} placeholder="今天的风景，想分享给谁？" multiline />
    <Field label="地点" value={location} onChangeText={setLocation} placeholder="例如：云南 · 洱海" />
    <View style={styles.tip}><Icon name="information-circle-outline" size={18} color={palette.forest} /><Text style={styles.tipText}>内容先保存在本机；登录云端账号后会尝试公开发布。</Text></View>
  </ComposerShell>;
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: palette.background },
  header: { height: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18 },
  title: { color: palette.ink, fontSize: 27, fontWeight: '800', lineHeight: 37, marginBottom: 24 },
  footer: { backgroundColor: palette.background, padding: 16, borderTopWidth: 1, borderTopColor: palette.line },
  photoSection: { marginBottom: 18 },
  label: { color: palette.ink, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  photoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  removePhoto: { position: 'absolute', right: -5, top: -5, backgroundColor: palette.forest, borderRadius: 12, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  addPhoto: { width: 78, height: 78, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', borderColor: '#A7BBA9', backgroundColor: palette.sage, justifyContent: 'center', alignItems: 'center', gap: 3 },
  addPhotoText: { fontSize: 10, color: palette.forest, fontWeight: '700' },
  twoColumns: { flexDirection: 'row', gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 14 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  sectionHint: { color: palette.muted, fontSize: 12, lineHeight: 19, marginBottom: 10 },
  addLink: { color: palette.forest, fontWeight: '800', fontSize: 13 },
  stopCard: { backgroundColor: '#ECF0E9', borderRadius: 20, padding: 16, marginBottom: 13 },
  stopHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  number: { width: 27, height: 27, borderRadius: 14, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: palette.white, fontSize: 12, fontWeight: '800' },
  stopHeading: { flex: 1, color: palette.ink, fontWeight: '800', fontSize: 14 },
  toggleRow: { minHeight: 72, backgroundColor: palette.white, borderRadius: 15, padding: 13, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
  toggleTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  toggleSubtitle: { color: palette.muted, fontSize: 11, marginTop: 3 },
  toggle: { width: 40, height: 22, borderRadius: 12, backgroundColor: '#D8DFD7', padding: 3 },
  toggleOn: { backgroundColor: palette.forest },
  toggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: palette.white },
  tip: { padding: 14, borderRadius: 14, backgroundColor: palette.sage, flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { flex: 1, color: palette.forest, fontSize: 12, lineHeight: 18 },
});
