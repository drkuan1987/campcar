import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { navigateTo, navigateToCamp, shareCamp, shareRoadbook } from './actions';
import { Campsite, Roadbook } from './data';
import { Button, Eyebrow, Icon, ImageTile, palette, Pill, RoundButton } from './ui';

function run(action: () => Promise<unknown>) { action().catch(() => Alert.alert('操作失败', '请检查网络或设备设置后重试。')); }

function Shell({ children, onClose, footer }: { children: React.ReactNode; onClose: () => void; footer: React.ReactNode }) {
  return <SafeAreaView style={s.shell}><View style={s.header}><RoundButton icon="arrow-back" onPress={onClose} /><Text style={s.headerTitle}>详情</Text><View style={{ width: 38 }} /></View><ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>{children}</ScrollView><View style={s.footer}>{footer}</View></SafeAreaView>;
}

function Actions({ shareLabel, onShare, navigateLabel, onNavigate }: { shareLabel: string; onShare: () => void; navigateLabel: string; onNavigate: () => void }) {
  return <View style={s.actions}><View style={{ flex: 1 }}><Button label={shareLabel} variant="outline" icon="share-outline" onPress={onShare} /></View><View style={{ flex: 1 }}><Button label={navigateLabel} icon="navigate-outline" onPress={onNavigate} /></View></View>;
}

export function RoadDetail({ item, favorite, onFavorite, onEdit, onClose }: { item: Roadbook; favorite: boolean; onFavorite: () => void; onEdit: () => void; onClose: () => void }) {
  const last = item.stops[item.stops.length - 1];
  return <Shell onClose={onClose} footer={<Actions shareLabel="分享路书" onShare={() => run(() => shareRoadbook(item))} navigateLabel="导航终点" onNavigate={() => run(() => navigateTo(last))} />}><View style={s.cover}><ImageTile uri={item.cover} height={240} /></View><View style={s.content}><View style={s.titleRow}><View style={{ flex: 1 }}><Eyebrow>{item.region}</Eyebrow><Text style={s.title}>{item.title}</Text></View><RoundButton icon={favorite ? 'heart' : 'heart-outline'} onPress={onFavorite} /></View><View style={s.pills}><Pill label={`${item.days} 天`} icon="calendar-outline" /><Pill label={`${item.distanceKm} km`} icon="speedometer-outline" /><Pill label={`${item.stops.length} 站`} icon="location-outline" /></View>{item.isDemo && <Text style={s.demo}>这是一条演示路书，行程信息仅用于体验。</Text>}{item.summary ? <Text style={s.description}>{item.summary}</Text> : null}<View style={s.sectionHeader}><Text style={s.sectionTitle}>行程路书</Text>{!item.isDemo && <Pressable onPress={onEdit}><Text style={s.edit}>编辑路书</Text></Pressable>}</View>{item.stops.map((stop, index) => <View key={stop.id} style={s.stopRow}><View style={s.axis}><View style={s.dot}><Text style={s.dotText}>{index + 1}</Text></View>{index < item.stops.length - 1 && <View style={s.line} />}</View><View style={s.stopBody}><Text style={s.day}>DAY {String(stop.day).padStart(2, '0')}</Text><Text style={s.stopName}>{stop.name}</Text>{stop.note ? <Text style={s.stopNote}>{stop.note}</Text> : null}<Pressable onPress={() => run(() => navigateTo(stop))} style={s.navLink}><Icon name="navigate-outline" size={14} color={palette.forest} /><Text style={s.navText}>在地图中查找</Text></Pressable></View></View>)}</View></Shell>;
}

export function CampDetail({ item, favorite, onFavorite, onEdit, onClose }: { item: Campsite; favorite: boolean; onFavorite: () => void; onEdit: () => void; onClose: () => void }) {
  return <Shell onClose={onClose} footer={<Actions shareLabel="分享营地" onShare={() => run(() => shareCamp(item))} navigateLabel="地图导航" onNavigate={() => run(() => navigateToCamp(item))} />}><View style={s.cover}><ImageTile uri={item.photo} height={240} /></View><View style={s.content}><View style={s.titleRow}><View style={{ flex: 1 }}><Eyebrow>{item.region}</Eyebrow><Text style={s.title}>{item.name}</Text></View><RoundButton icon={favorite ? 'heart' : 'heart-outline'} onPress={onFavorite} /></View><Text style={s.price}>¥{item.pricePerNight}<Text style={s.priceSuffix}> / 晚 · 营位费用</Text></Text>{item.isDemo && <Text style={s.demo}>演示营地，设施、价格和地点未经核实，请勿作为出行依据。</Text>}<View style={s.sectionHeader}><Text style={s.sectionTitle}>营地信息</Text>{!item.isDemo && <Pressable onPress={onEdit}><Text style={s.edit}>编辑营地</Text></Pressable>}</View><View style={s.address}><Icon name="location-outline" size={20} color={palette.forest} /><Text style={s.addressText}>{item.address}</Text></View>{item.description ? <Text style={s.description}>{item.description}</Text> : null}<Text style={[s.sectionTitle, { marginTop: 25, marginBottom: 13 }]}>房车设施与费用</Text><Facility icon="water-outline" title="补水" description={item.water ? '可为房车接水' : '暂不提供补水'} fee={item.water ? item.waterFee : '无'} /><Facility icon="flash-outline" title="接电" description={item.power ? '提供外接电源' : '暂不提供接电'} fee={item.power ? item.powerFee : '无'} /><Text style={s.hint}>导航会在地图中搜索地点，请确认具体入口和营地信息。</Text></View></Shell>;
}

function Facility({ icon, title, description, fee }: { icon: 'water-outline' | 'flash-outline'; title: string; description: string; fee: string }) { return <View style={s.facility}><View style={s.facilityIcon}><Icon name={icon} size={22} color={palette.forest} /></View><View style={{ flex: 1 }}><Text style={s.facilityTitle}>{title}</Text><Text style={s.facilitySub}>{description}</Text></View><Text style={s.facilityFee}>{fee}</Text></View>; }

const s = StyleSheet.create({
  shell: { flex: 1, backgroundColor: palette.background },
  header: { height: 55, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  cover: { marginHorizontal: 20 },
  content: { paddingHorizontal: 23, paddingTop: 21 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: palette.ink, fontSize: 25, fontWeight: '900', lineHeight: 34, marginTop: 6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  demo: { backgroundColor: palette.paleOrange, color: '#93684D', borderRadius: 11, padding: 10, fontSize: 11, lineHeight: 18, marginTop: 16 },
  description: { color: '#58685D', fontSize: 13, lineHeight: 22, marginTop: 17 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 15 },
  sectionTitle: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  edit: { color: palette.forest, fontSize: 12, fontWeight: '800' },
  stopRow: { flexDirection: 'row', gap: 13, minHeight: 106 },
  axis: { width: 30, alignItems: 'center' },
  dot: { width: 29, height: 29, borderRadius: 15, backgroundColor: palette.forest, alignItems: 'center', justifyContent: 'center' },
  dotText: { color: palette.white, fontSize: 12, fontWeight: '800' },
  line: { width: 1, flex: 1, backgroundColor: '#B9CBB8', marginVertical: 5 },
  stopBody: { flex: 1, paddingBottom: 18 },
  day: { color: palette.orange, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  stopName: { color: palette.ink, fontSize: 16, fontWeight: '800', marginTop: 4 },
  stopNote: { color: palette.muted, fontSize: 12, lineHeight: 19, marginTop: 5 },
  navLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  navText: { color: palette.forest, fontSize: 11, fontWeight: '800' },
  footer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: palette.line },
  actions: { flexDirection: 'row', gap: 9 },
  price: { color: palette.orange, fontSize: 25, fontWeight: '900', marginTop: 15 },
  priceSuffix: { color: palette.muted, fontSize: 11, fontWeight: '400' },
  address: { flexDirection: 'row', gap: 8 },
  addressText: { color: palette.ink, fontSize: 13, lineHeight: 20, flex: 1 },
  facility: { backgroundColor: palette.white, borderRadius: 16, padding: 13, marginBottom: 11, flexDirection: 'row', alignItems: 'center', gap: 11 },
  facilityIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
  facilityTitle: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  facilitySub: { color: palette.muted, fontSize: 11, marginTop: 3 },
  facilityFee: { color: palette.forest, fontSize: 11, fontWeight: '800', maxWidth: 96, textAlign: 'right' },
  hint: { color: palette.muted, fontSize: 11, lineHeight: 18, marginTop: 10 },
});
