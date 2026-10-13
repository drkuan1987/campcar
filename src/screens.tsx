import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppData, Campsite, Moment, Roadbook } from './data';
import { Eyebrow, GradientCover, Icon, ImageTile, palette, Pill, RoundButton, SectionTitle } from './ui';

export type Tab = 'home' | 'routes' | 'create' | 'camps' | 'mine';

function Header({ label, title, action, onAction }: { label: string; title: string; action?: React.ComponentProps<typeof Icon>['name']; onAction?: () => void }) {
  return <View style={s.header}><View><Eyebrow>{label}</Eyebrow><Text style={s.headerTitle}>{title}</Text></View>{action && onAction && <RoundButton icon={action} onPress={onAction} />}</View>;
}

export function RoadCard({ item, onPress }: { item: Roadbook; onPress: () => void }) {
  return <Pressable onPress={onPress} style={{ marginBottom: 14 }}><ImageTile uri={item.cover} height={187}><GradientCover><View style={s.imageContent}><View style={s.glassTag}><Icon name="navigate-outline" size={13} color={palette.white} /><Text style={s.glassText}>{item.region}</Text></View><View><Text style={s.imageTitle}>{item.title}</Text><Text style={s.imageMeta}>{item.days} 天行程   ·   {item.distanceKm} km   ·   {item.stops.length} 站</Text></View></View></GradientCover></ImageTile></Pressable>;
}

export function CampCard({ item, onPress }: { item: Campsite; onPress: () => void }) {
  return <Pressable onPress={onPress} style={s.campCard}><View style={{ width: 112 }}><ImageTile uri={item.photo} height={113} radius={14} /></View><View style={s.campBody}><Text numberOfLines={1} style={s.campName}>{item.name}</Text><Text style={s.muted}>{item.region}</Text><View style={s.campFacilities}><Text style={[s.facilityText, !item.water && s.unavailable]}>◉ {item.water ? '可接水' : '无补水'}</Text><Text style={[s.facilityText, !item.power && s.unavailable]}>ϟ {item.power ? '可接电' : '无接电'}</Text></View><Text style={s.price}>¥{item.pricePerNight}<Text style={s.priceSuffix}> /晚</Text></Text></View></Pressable>;
}

export function MomentCard({ item }: { item: Moment }) {
  function share() { Share.share({ message: `${item.caption}\n${item.location}\n来自山野泊车` }).catch(() => Alert.alert('分享失败', '请稍后再试。')); }
  const date = new Date(item.createdAt);
  return <View style={s.momentCard}><View style={s.momentHeader}><View style={s.avatar}><Icon name="leaf" size={18} color={palette.forest} /></View><View style={{ flex: 1 }}><Text style={s.author}>{item.isDemo ? '山野泊车' : '我'}</Text><Text style={s.muted}>{item.location || '路上'} · {date.getMonth() + 1}月{date.getDate()}日</Text></View><RoundButton icon="share-outline" onPress={share} /></View>{item.caption ? <Text style={s.caption}>{item.caption}</Text> : null}{item.photos.length > 0 && <View style={s.photoRow}>{item.photos.map((photo, index) => <View key={`${photo.uri}-${index}`} style={{ width: item.photos.length === 1 ? '100%' : '48.5%' }}><ImageTile uri={photo.uri} height={item.photos.length === 1 ? 202 : 126} radius={14} /></View>)}</View>}{item.isDemo && <Text style={[s.muted, { marginTop: 8 }]}>演示动态</Text>}</View>;
}

function Search({ value, setValue, hint }: { value: string; setValue: (text: string) => void; hint: string }) {
  return <View style={s.search}><Icon name="search-outline" size={20} color={palette.muted} /><TextInput value={value} onChangeText={setValue} placeholder={hint} placeholderTextColor="#A0AAA0" style={s.searchInput} /></View>;
}

function Empty({ children }: { children: string }) { return <View style={s.empty}><Icon name="leaf-outline" size={27} color={palette.forest} /><Text style={s.muted}>{children}</Text></View>; }

export function HomeScreen({ data, setTab, openRoad, openCamp, createRoad }: { data: AppData; setTab: (tab: Tab) => void; openRoad: (item: Roadbook) => void; openCamp: (item: Campsite) => void; createRoad: () => void }) {
  return <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}><Header label="CAMP · DRIVE · DISCOVER" title="去山野，刚刚好。" /><Pressable onPress={() => data.roadbooks[0] && openRoad(data.roadbooks[0])} style={{ marginBottom: 20 }}><ImageTile uri="lake" height={263} radius={24}><GradientCover><View style={s.heroContent}><View style={s.heroBadge}><Icon name="sparkles" size={14} color={palette.white} /><Text style={s.heroBadgeText}>本周灵感</Text></View><View><Text style={s.heroTitle}>把日子，开进风景里</Text><Text style={s.heroSubtitle}>找一条路 · 寻一处营地 · 留下好时光</Text><View style={s.heroLink}><Text style={s.heroLinkText}>开启一段旅程  →</Text></View></View></View></GradientCover></ImageTile></Pressable><View style={s.quickRow}><Pressable style={s.quick} onPress={() => setTab('routes')}><View style={s.quickIcon}><Icon name="map-outline" size={24} color={palette.forest} /></View><Text style={s.quickTitle}>找路线</Text><Text style={s.quickHint}>下一站去哪</Text></Pressable><Pressable style={s.quick} onPress={() => setTab('camps')}><View style={[s.quickIcon, { backgroundColor: '#F5E8D6' }]}><Icon name="bonfire-outline" size={24} color="#AC754A" /></View><Text style={s.quickTitle}>找营地</Text><Text style={s.quickHint}>今晚住哪里</Text></Pressable><Pressable style={s.quick} onPress={createRoad}><View style={[s.quickIcon, { backgroundColor: '#E7EAF4' }]}><Icon name="book-outline" size={24} color="#6D7D9F" /></View><Text style={s.quickTitle}>写路书</Text><Text style={s.quickHint}>收藏好风景</Text></Pressable></View><View style={s.section}><SectionTitle title="精选自驾路线" action="查看全部" onPress={() => setTab('routes')} />{data.roadbooks.slice(0, 2).map((item) => <RoadCard key={item.id} item={item} onPress={() => openRoad(item)} />)}</View><View style={s.section}><SectionTitle title="房车友好营地" action="查看全部" onPress={() => setTab('camps')} />{data.campsites.slice(0, 2).map((item) => <CampCard key={item.id} item={item} onPress={() => openCamp(item)} />)}</View><View style={s.section}><SectionTitle title="山野新鲜事" action="去分享" onPress={() => setTab('create')} />{data.moments.slice(0, 2).map((item) => <MomentCard key={item.id} item={item} />)}</View></ScrollView>;
}

export function RoutesScreen({ data, openRoad, create }: { data: AppData; openRoad: (item: Roadbook) => void; create: () => void }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'short' | 'long'>('all');
  const results = useMemo(() => data.roadbooks.filter((item) => `${item.title} ${item.region} ${item.summary}`.toLowerCase().includes(query.trim().toLowerCase()) && (filter === 'all' || (filter === 'short' ? item.days <= 2 : item.days > 2))), [data.roadbooks, query, filter]);
  return <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}><Header label="THE OPEN ROAD" title="路书与路线" action="add" onAction={create} /><Text style={s.subtitle}>把每段路，写成值得回看的故事。</Text><Search value={query} setValue={setQuery} hint="搜索路线或目的地" /><View style={s.filterRow}><Pill label="全部路线" active={filter === 'all'} onPress={() => setFilter('all')} /><Pill label="周末短途" active={filter === 'short'} onPress={() => setFilter('short')} /><Pill label="多日远行" active={filter === 'long'} onPress={() => setFilter('long')} /></View><Text style={s.listTitle}>{results.length} 条路线</Text>{results.map((item) => <RoadCard key={item.id} item={item} onPress={() => openRoad(item)} />)}{!results.length && <Empty>还没有找到路线，试试换个关键词。</Empty>}</ScrollView>;
}

export function CampsScreen({ data, openCamp, create }: { data: AppData; openCamp: (item: Campsite) => void; create: () => void }) {
  const [query, setQuery] = useState('');
  const [water, setWater] = useState(false);
  const [power, setPower] = useState(false);
  const results = useMemo(() => data.campsites.filter((item) => `${item.name} ${item.region} ${item.address}`.toLowerCase().includes(query.trim().toLowerCase()) && (!water || item.water) && (!power || item.power)), [data.campsites, query, water, power]);
  return <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}><Header label="SLEEP UNDER THE STARS" title="发现好营地" action="add" onAction={create} /><Text style={s.subtitle}>普通露营或房车过夜，设施和费用一眼看清。</Text><Search value={query} setValue={setQuery} hint="搜索营地、城市或地址" /><View style={s.filterRow}><Pill label="可接水" icon="water-outline" active={water} onPress={() => setWater(!water)} /><Pill label="可接电" icon="flash-outline" active={power} onPress={() => setPower(!power)} /></View><View style={s.notice}><Icon name="information-circle-outline" size={17} color={palette.forest} /><Text style={s.noticeText}>示例营地与价格仅用于体验，出行前请向营地核实。</Text></View><Text style={s.listTitle}>{results.length} 处营地</Text>{results.map((item) => <CampCard key={item.id} item={item} onPress={() => openCamp(item)} />)}{!results.length && <Empty>没有符合条件的营地，你也可以收录一个。</Empty>}</ScrollView>;
}

export function CreateScreen({ onSelect }: { onSelect: (kind: 'roadbook' | 'camp' | 'moment') => void }) {
  const cards = [
    { kind: 'roadbook' as const, icon: 'map-outline' as const, title: '制作路书', subtitle: '记录路线、途经点和每天的安排', tint: '#E3EEE2' },
    { kind: 'moment' as const, icon: 'images-outline' as const, title: '分享照片', subtitle: '把路上的好风景留在这里', tint: '#F8E9DA' },
    { kind: 'camp' as const, icon: 'bonfire-outline' as const, title: '收录营地', subtitle: '补水、接电和价格信息都记下来', tint: '#E9ECF5' },
  ];
  return <ScrollView contentContainerStyle={s.page}><Header label="TELL YOUR STORY" title="分享山野时光" /><Text style={s.subtitle}>每一次出发，都值得被记录。</Text><ImageTile uri="road" height={185}><GradientCover><View style={[s.imageContent, { justifyContent: 'flex-end' }]}><Eyebrow light>YOUR NEXT CHAPTER</Eyebrow><Text style={s.imageTitle}>故事，从这里开始</Text></View></GradientCover></ImageTile><View style={{ marginTop: 23 }}>{cards.map((card) => <Pressable key={card.kind} onPress={() => onSelect(card.kind)} style={s.createCard}><View style={[s.createIcon, { backgroundColor: card.tint }]}><Icon name={card.icon} size={25} color={palette.forest} /></View><View style={{ flex: 1 }}><Text style={s.createTitle}>{card.title}</Text><Text style={s.createSubtitle}>{card.subtitle}</Text></View><Icon name="arrow-forward" size={19} color={palette.forest} /></Pressable>)}</View><Text style={s.createFootnote}>未登录时内容保存在本机；登录后会尝试发布到云端。</Text></ScrollView>;
}

export function MineScreen({ data, openRoad, openCamp, create, userId, cloudPanel, displayName }: { data: AppData; openRoad: (item: Roadbook) => void; openCamp: (item: Campsite) => void; create: () => void; userId?: string; cloudPanel?: React.ReactNode; displayName?: string }) {
  const mine = (item: { isDemo?: boolean; ownerId?: string }) => !item.isDemo && (!item.ownerId || item.ownerId === userId);
  const roads = data.roadbooks.filter(mine);
  const camps = data.campsites.filter(mine);
  const moments = data.moments.filter(mine);
  return <ScrollView contentContainerStyle={s.page}><Header label="MY CAMPING JOURNAL" title="我的山野手账" /><View style={s.profile}><View style={s.profileAvatar}><Icon name="leaf" size={28} color={palette.white} /></View><View><Text style={s.profileName}>{displayName || '山野旅人'}</Text><Text style={s.profileSubtitle}>每一次出发，都算数。</Text></View></View><View style={s.stats}>{[[roads.length, '我的路书'], [camps.length, '收录营地'], [moments.length, '照片动态']].map(([count, label]) => <View key={label} style={s.stat}><Text style={s.statNumber}>{count}</Text><Text style={s.muted}>{label}</Text></View>)}</View>{cloudPanel}<View style={s.section}><SectionTitle title="我的路书" action="新建" onPress={create} />{roads.length ? roads.map((item) => <RoadCard key={item.id} item={item} onPress={() => openRoad(item)} />) : <Empty>还没有自己的路书，写下第一段旅程吧。</Empty>}</View><View style={s.section}><SectionTitle title="我收录的营地" />{camps.length ? camps.map((item) => <CampCard key={item.id} item={item} onPress={() => openCamp(item)} />) : <Empty>遇见好营地时，把信息收录在这里。</Empty>}</View><View style={s.section}><SectionTitle title="我的动态" />{moments.length ? moments.map((item) => <MomentCard key={item.id} item={item} />) : <Empty>分享一张路上的风景吧。</Empty>}</View></ScrollView>;
}

const s = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 19 },
  headerTitle: { color: palette.ink, fontSize: 27, fontWeight: '800', marginTop: 5 },
  subtitle: { color: palette.muted, fontSize: 13, marginTop: -4, marginBottom: 20 },
  heroContent: { flex: 1, padding: 22, justifyContent: 'space-between' },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.24)', borderRadius: 13, paddingVertical: 6, paddingHorizontal: 10 },
  heroBadgeText: { color: palette.white, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: palette.white, fontSize: 26, fontWeight: '800' },
  heroSubtitle: { color: '#EBEEE7', fontSize: 12, marginTop: 6, marginBottom: 14 },
  heroLink: { alignSelf: 'flex-start', backgroundColor: palette.white, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  heroLinkText: { color: palette.forest, fontSize: 12, fontWeight: '800' },
  quickRow: { flexDirection: 'row', gap: 9, marginBottom: 27 },
  quick: { flex: 1, alignItems: 'center', backgroundColor: palette.white, borderRadius: 18, paddingVertical: 15 },
  quickIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#E4EEE3', alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  quickTitle: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  quickHint: { color: palette.muted, fontSize: 10, marginTop: 3 },
  section: { marginBottom: 17 },
  imageContent: { flex: 1, padding: 17, justifyContent: 'space-between' },
  glassTag: { alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.22)', borderRadius: 13, paddingHorizontal: 9, paddingVertical: 6 },
  glassText: { color: palette.white, fontSize: 11, fontWeight: '700' },
  imageTitle: { color: palette.white, fontSize: 20, fontWeight: '800', marginBottom: 7 },
  imageMeta: { color: '#E8EDE7', fontSize: 11, fontWeight: '600' },
  campCard: { backgroundColor: palette.white, borderRadius: 19, padding: 10, flexDirection: 'row', gap: 12, marginBottom: 12 },
  campBody: { flex: 1, justifyContent: 'center', minWidth: 0 },
  campName: { color: palette.ink, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  muted: { color: palette.muted, fontSize: 11 },
  campFacilities: { flexDirection: 'row', gap: 9, marginTop: 9 },
  facilityText: { color: palette.forest, fontSize: 10, fontWeight: '700' },
  unavailable: { color: '#A5AFA5' },
  price: { color: palette.orange, fontSize: 18, fontWeight: '900', marginTop: 8 },
  priceSuffix: { color: palette.muted, fontSize: 11, fontWeight: '400' },
  momentCard: { backgroundColor: palette.white, borderRadius: 19, padding: 14, marginBottom: 12 },
  momentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
  author: { color: palette.ink, fontSize: 13, fontWeight: '800', marginBottom: 3 },
  caption: { color: palette.ink, fontSize: 14, lineHeight: 22, marginTop: 13, marginBottom: 12 },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: '3%', marginTop: 8 },
  search: { height: 49, backgroundColor: palette.white, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  searchInput: { flex: 1, fontSize: 13, color: palette.ink, paddingVertical: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 19 },
  listTitle: { color: palette.ink, fontSize: 16, fontWeight: '800', marginBottom: 14 },
  empty: { backgroundColor: palette.white, borderRadius: 18, padding: 30, minHeight: 130, alignItems: 'center', justifyContent: 'center', gap: 10 },
  notice: { backgroundColor: palette.sage, padding: 11, borderRadius: 12, flexDirection: 'row', gap: 7, marginBottom: 18 },
  noticeText: { color: palette.forest, fontSize: 11, lineHeight: 17, flex: 1 },
  createCard: { backgroundColor: palette.white, borderRadius: 19, padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 13 },
  createIcon: { width: 53, height: 53, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  createTitle: { color: palette.ink, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  createSubtitle: { color: palette.muted, fontSize: 11 },
  createFootnote: { color: palette.muted, fontSize: 11, textAlign: 'center', marginTop: 16 },
  profile: { backgroundColor: palette.forest, borderRadius: 21, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#507E6B', alignItems: 'center', justifyContent: 'center' },
  profileName: { color: palette.white, fontSize: 19, fontWeight: '800' },
  profileSubtitle: { color: '#D8E5DC', fontSize: 11, marginTop: 5 },
  stats: { backgroundColor: palette.white, borderRadius: 19, flexDirection: 'row', paddingVertical: 18, marginTop: 14, marginBottom: 25 },
  stat: { flex: 1, alignItems: 'center' },
  statNumber: { color: palette.forest, fontSize: 22, fontWeight: '900', marginBottom: 4 },
});
