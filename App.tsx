import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CloudPanel } from './src/cloud-panel';
import { CloudSession, cloudEnabled, devLogin, fetchPublicData, logout, publishCampsite, publishMoment, publishRoadbook, restoreSession } from './src/cloud';
import { AppData, Campsite, demoData, loadData, Moment, Roadbook, saveData } from './src/data';
import { CampDetail, RoadDetail } from './src/details';
import { CampEditor, MomentEditor, RoadbookEditor } from './src/editors';
import { CampsScreen, CreateScreen, HomeScreen, MineScreen, RoutesScreen, Tab } from './src/screens';
import { Icon, palette } from './src/ui';

type Composer = { kind: 'roadbook'; item?: Roadbook } | { kind: 'camp'; item?: Campsite } | { kind: 'moment' } | null;

const tabs: { key: Tab; label: string; icon: React.ComponentProps<typeof Icon>['name']; selected: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'home', label: '首页', icon: 'home-outline', selected: 'home' },
  { key: 'routes', label: '路线', icon: 'map-outline', selected: 'map' },
  { key: 'create', label: '发布', icon: 'add', selected: 'add' },
  { key: 'camps', label: '营地', icon: 'bonfire-outline', selected: 'bonfire' },
  { key: 'mine', label: '我的', icon: 'person-outline', selected: 'person' },
];

type PublicData = Pick<AppData, 'roadbooks' | 'campsites' | 'moments'>;
const emptyPublicData: PublicData = { roadbooks: [], campsites: [], moments: [] };
function mergeItems<T extends { id: string }>(local: T[], online: T[]): T[] {
  const onlineIds = new Set(online.map((item) => item.id));
  return [...local.filter((item) => !onlineIds.has(item.id)), ...online];
}

function AppContent() {
  const [data, setData] = useState<AppData>(demoData);
  const [publicData, setPublicData] = useState<PublicData>(emptyPublicData);
  const [session, setSession] = useState<CloudSession | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [composer, setComposer] = useState<Composer>(null);
  const [roadDetail, setRoadDetail] = useState<Roadbook | null>(null);
  const [campDetail, setCampDetail] = useState<Campsite | null>(null);

  useEffect(() => { loadData().then(setData).catch(() => Alert.alert('数据读取失败', '将使用示例数据继续。')).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) saveData(data).catch(() => Alert.alert('保存失败', '本次更改可能未保存在设备上。')); }, [data, ready]);
  useEffect(() => {
    if (!cloudEnabled) return;
    restoreSession().then(setSession).catch(() => undefined);
    fetchPublicData().then(setPublicData).catch(() => undefined);
  }, []);

  const visibleData: AppData = {
    roadbooks: mergeItems(data.roadbooks, publicData.roadbooks),
    campsites: mergeItems(data.campsites, publicData.campsites),
    moments: mergeItems(data.moments, publicData.moments),
    favorites: data.favorites,
  };

  async function refresh() { setPublicData(await fetchPublicData()); }
  async function runCloud(action: () => Promise<void>) {
    setCloudBusy(true);
    try { await action(); }
    catch (error) { Alert.alert('云端操作失败', error instanceof Error ? error.message : '请检查网络后重试。'); }
    finally { setCloudBusy(false); }
  }
  function login(name: string) {
    void runCloud(async () => { const next = await devLogin(name); setSession(next); await refresh(); });
  }
  function signOut() { void runCloud(async () => { await logout(); setSession(null); }); }
  function syncLocal() {
    if (!session) return;
    void runCloud(async () => {
      const roads = data.roadbooks.filter((item) => !item.isDemo && !item.ownerId);
      const camps = data.campsites.filter((item) => !item.isDemo && !item.ownerId);
      const moments = data.moments.filter((item) => !item.isDemo && !item.ownerId);
      const publishedRoads: Roadbook[] = [];
      const publishedCamps: Campsite[] = [];
      const publishedMoments: Moment[] = [];
      try {
        for (const item of roads) publishedRoads.push(await publishRoadbook(item, session.token));
        for (const item of camps) publishedCamps.push(await publishCampsite(item, session.token));
        for (const item of moments) publishedMoments.push(await publishMoment(item, session.token));
      } finally {
        setData((current) => ({
          ...current,
          roadbooks: mergeItems(current.roadbooks, publishedRoads),
          campsites: mergeItems(current.campsites, publishedCamps),
          moments: mergeItems(current.moments, publishedMoments),
        }));
        await refresh();
      }
      Alert.alert('同步完成', `已同步 ${publishedRoads.length + publishedCamps.length + publishedMoments.length} 条本机内容。`);
    });
  }

  async function publishNew<T extends { id: string; ownerId?: string }>(item: T, publish: (item: T, token: string) => Promise<T>, key: 'roadbooks' | 'campsites' | 'moments') {
    if (!session || (item.ownerId && item.ownerId !== session.user.id)) return;
    try {
      const saved = await publish(item, session.token);
      setData((current) => ({ ...current, [key]: current[key].map((entry) => entry.id === saved.id ? saved : entry) }));
      await refresh().catch(() => undefined);
    } catch (error) {
      Alert.alert('仅保存在本机', error instanceof Error ? error.message : '云端发布失败，请稍后在“我的”中同步。');
    }
  }

  function saveRoadbook(item: Roadbook) {
    const saved = { ...item, ownerId: composer?.kind === 'roadbook' ? composer.item?.ownerId : undefined };
    setData((current) => ({ ...current, roadbooks: [saved, ...current.roadbooks.filter((roadbook) => roadbook.id !== item.id)] }));
    setComposer(null); setRoadDetail(item); setTab('routes');
    void publishNew(saved, publishRoadbook, 'roadbooks');
  }
  function saveCamp(item: Campsite) {
    const saved = { ...item, ownerId: composer?.kind === 'camp' ? composer.item?.ownerId : undefined };
    setData((current) => ({ ...current, campsites: [saved, ...current.campsites.filter((camp) => camp.id !== item.id)] }));
    setComposer(null); setCampDetail(item); setTab('camps');
    void publishNew(saved, publishCampsite, 'campsites');
  }
  function saveMoment(item: Moment) {
    setData((current) => ({ ...current, moments: [item, ...current.moments] }));
    setComposer(null); setTab('home');
    void publishNew(item, publishMoment, 'moments');
  }
  function toggleFavorite(id: string) {
    setData((current) => ({ ...current, favorites: current.favorites.includes(id) ? current.favorites.filter((value) => value !== id) : [...current.favorites, id] }));
  }

  return <SafeAreaView style={s.app} edges={['top', 'bottom']}><StatusBar style="dark" />
    <View style={{ flex: 1 }}>
      {tab === 'home' && <HomeScreen data={visibleData} setTab={setTab} openRoad={setRoadDetail} openCamp={setCampDetail} createRoad={() => setComposer({ kind: 'roadbook' })} />}
      {tab === 'routes' && <RoutesScreen data={visibleData} openRoad={setRoadDetail} create={() => setComposer({ kind: 'roadbook' })} />}
      {tab === 'create' && <CreateScreen onSelect={(kind) => setComposer({ kind })} />}
      {tab === 'camps' && <CampsScreen data={visibleData} openCamp={setCampDetail} create={() => setComposer({ kind: 'camp' })} />}
      {tab === 'mine' && <MineScreen data={visibleData} openRoad={setRoadDetail} openCamp={setCampDetail} create={() => setComposer({ kind: 'roadbook' })} userId={session?.user.id} displayName={session?.user.displayName} cloudPanel={<CloudPanel session={session} busy={cloudBusy} onLogin={login} onLogout={signOut} onSync={syncLocal} onRefresh={() => { void runCloud(refresh); }} />} />}
    </View>
    <View style={s.tabBar}>{tabs.map((item) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} key={item.key} onPress={() => setTab(item.key)} style={s.tabItem}><View style={[s.tabIcon, item.key === 'create' && s.createIcon]}><Icon name={tab === item.key ? item.selected : item.icon} size={item.key === 'create' ? 25 : 22} color={item.key === 'create' ? palette.white : tab === item.key ? palette.forest : '#98A49A'} /></View><Text style={[s.tabLabel, tab === item.key && { color: palette.forest }]}>{item.label}</Text></Pressable>)}</View>
    <Modal visible={!!roadDetail && !composer} animationType="slide" onRequestClose={() => setRoadDetail(null)}>{roadDetail && <RoadDetail item={roadDetail} favorite={data.favorites.includes(roadDetail.id)} onFavorite={() => toggleFavorite(roadDetail.id)} currentUserId={session?.user.id} onEdit={() => { if (!roadDetail.ownerId || roadDetail.ownerId === session?.user.id) setComposer({ kind: 'roadbook', item: roadDetail }); }} onClose={() => setRoadDetail(null)} />}</Modal>
    <Modal visible={!!campDetail && !composer} animationType="slide" onRequestClose={() => setCampDetail(null)}>{campDetail && <CampDetail item={campDetail} favorite={data.favorites.includes(campDetail.id)} onFavorite={() => toggleFavorite(campDetail.id)} currentUserId={session?.user.id} onEdit={() => { if (!campDetail.ownerId || campDetail.ownerId === session?.user.id) setComposer({ kind: 'camp', item: campDetail }); }} onClose={() => setCampDetail(null)} />}</Modal>
    <Modal visible={!!composer} animationType="slide" onRequestClose={() => setComposer(null)}>{composer?.kind === 'roadbook' && <RoadbookEditor key={composer.item?.id ?? 'new-road'} initial={composer.item} onSave={saveRoadbook} onClose={() => setComposer(null)} />}{composer?.kind === 'camp' && <CampEditor key={composer.item?.id ?? 'new-camp'} initial={composer.item} onSave={saveCamp} onClose={() => setComposer(null)} />}{composer?.kind === 'moment' && <MomentEditor onSave={saveMoment} onClose={() => setComposer(null)} />}</Modal>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><AppContent /></SafeAreaProvider>; }

const s = StyleSheet.create({
  app: { flex: 1, backgroundColor: palette.background },
  tabBar: { minHeight: 63, backgroundColor: palette.white, borderTopColor: palette.line, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabIcon: { width: 38, height: 31, alignItems: 'center', justifyContent: 'center' },
  createIcon: { width: 39, height: 39, borderRadius: 14, backgroundColor: palette.forest, marginTop: -8 },
  tabLabel: { color: '#98A49A', fontSize: 10, fontWeight: '700' },
});
