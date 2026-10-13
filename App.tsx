import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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

function AppContent() {
  const [data, setData] = useState<AppData>(demoData);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [composer, setComposer] = useState<Composer>(null);
  const [roadDetail, setRoadDetail] = useState<Roadbook | null>(null);
  const [campDetail, setCampDetail] = useState<Campsite | null>(null);

  useEffect(() => { loadData().then(setData).catch(() => Alert.alert('数据读取失败', '将使用示例数据继续。')).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) saveData(data).catch(() => Alert.alert('保存失败', '本次更改可能未保存在设备上。')); }, [data, ready]);

  function saveRoadbook(item: Roadbook) {
    setData((current) => ({ ...current, roadbooks: [item, ...current.roadbooks.filter((roadbook) => roadbook.id !== item.id)] }));
    setComposer(null); setRoadDetail(item); setTab('routes');
  }
  function saveCamp(item: Campsite) {
    setData((current) => ({ ...current, campsites: [item, ...current.campsites.filter((camp) => camp.id !== item.id)] }));
    setComposer(null); setCampDetail(item); setTab('camps');
  }
  function saveMoment(item: Moment) {
    setData((current) => ({ ...current, moments: [item, ...current.moments] }));
    setComposer(null); setTab('home');
  }
  function toggleFavorite(id: string) {
    setData((current) => ({ ...current, favorites: current.favorites.includes(id) ? current.favorites.filter((value) => value !== id) : [...current.favorites, id] }));
  }

  return <SafeAreaView style={s.app} edges={['top', 'bottom']}><StatusBar style="dark" />
    <View style={{ flex: 1 }}>
      {tab === 'home' && <HomeScreen data={data} setTab={setTab} openRoad={setRoadDetail} openCamp={setCampDetail} createRoad={() => setComposer({ kind: 'roadbook' })} />}
      {tab === 'routes' && <RoutesScreen data={data} openRoad={setRoadDetail} create={() => setComposer({ kind: 'roadbook' })} />}
      {tab === 'create' && <CreateScreen onSelect={(kind) => setComposer({ kind })} />}
      {tab === 'camps' && <CampsScreen data={data} openCamp={setCampDetail} create={() => setComposer({ kind: 'camp' })} />}
      {tab === 'mine' && <MineScreen data={data} openRoad={setRoadDetail} openCamp={setCampDetail} create={() => setComposer({ kind: 'roadbook' })} />}
    </View>
    <View style={s.tabBar}>{tabs.map((item) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === item.key }} key={item.key} onPress={() => setTab(item.key)} style={s.tabItem}><View style={[s.tabIcon, item.key === 'create' && s.createIcon]}><Icon name={tab === item.key ? item.selected : item.icon} size={item.key === 'create' ? 25 : 22} color={item.key === 'create' ? palette.white : tab === item.key ? palette.forest : '#98A49A'} /></View><Text style={[s.tabLabel, tab === item.key && { color: palette.forest }]}>{item.label}</Text></Pressable>)}</View>
    <Modal visible={!!roadDetail && !composer} animationType="slide" onRequestClose={() => setRoadDetail(null)}>{roadDetail && <RoadDetail item={roadDetail} favorite={data.favorites.includes(roadDetail.id)} onFavorite={() => toggleFavorite(roadDetail.id)} onEdit={() => setComposer({ kind: 'roadbook', item: roadDetail })} onClose={() => setRoadDetail(null)} />}</Modal>
    <Modal visible={!!campDetail && !composer} animationType="slide" onRequestClose={() => setCampDetail(null)}>{campDetail && <CampDetail item={campDetail} favorite={data.favorites.includes(campDetail.id)} onFavorite={() => toggleFavorite(campDetail.id)} onEdit={() => setComposer({ kind: 'camp', item: campDetail })} onClose={() => setCampDetail(null)} />}</Modal>
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
