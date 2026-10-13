import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CloudSession, cloudEnabled, devLoginEnabled } from './cloud';
import { Button, Icon, palette } from './ui';

export function CloudPanel({ session, busy, onLogin, onLogout, onSync, onRefresh }: { session: CloudSession | null; busy: boolean; onLogin: (name: string) => void; onLogout: () => void; onSync: () => void; onRefresh: () => void }) {
  const [name, setName] = useState('');
  return <View style={s.card}><View style={s.titleRow}><View style={s.icon}><Icon name="cloud-outline" size={22} color={palette.forest} /></View><View style={{ flex: 1 }}><Text style={s.title}>{session ? '云端已连接' : '云端账号'}</Text><Text style={s.subtitle}>{session ? `当前账号：${session.user.displayName}` : cloudEnabled ? '登录后可把路书和照片分享给其他用户' : '当前为本机使用模式'}</Text></View></View>
    {session ? <><View style={s.actions}><View style={{ flex: 1 }}><Button label={busy ? '同步中…' : '同步本机内容'} onPress={onSync} disabled={busy} /></View><View style={{ flex: 1 }}><Button label="刷新公开内容" variant="outline" onPress={onRefresh} disabled={busy} /></View></View><Pressable onPress={onLogout} disabled={busy}><Text style={s.logout}>退出当前账号</Text></Pressable></>
      : cloudEnabled ? <><Text style={s.hint}>微信登录将在开放平台移动应用资质完成后启用。</Text>{devLoginEnabled && <View style={s.devBox}><Text style={s.devTitle}>本地开发测试</Text><TextInput style={s.input} value={name} onChangeText={setName} placeholder="测试账号名称，如 旅人甲" placeholderTextColor="#9CA99E" autoCapitalize="none" /><Button label="使用测试账号登录" onPress={() => onLogin(name.trim())} disabled={busy || !name.trim()} /></View>}</> : <Text style={s.hint}>请先为应用配置云端 API。已有路线和照片仍保存在本机。</Text>}
  </View>;
}

const s = StyleSheet.create({
  card: { backgroundColor: palette.white, borderRadius: 19, padding: 16, marginBottom: 25 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.sage, alignItems: 'center', justifyContent: 'center' },
  title: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  subtitle: { color: palette.muted, fontSize: 11, marginTop: 4, lineHeight: 17 },
  hint: { color: palette.muted, fontSize: 11, lineHeight: 18, marginTop: 14 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  logout: { color: palette.muted, fontSize: 12, textAlign: 'center', marginTop: 16 },
  devBox: { backgroundColor: palette.background, borderRadius: 14, padding: 12, marginTop: 15 },
  devTitle: { color: palette.forest, fontSize: 12, fontWeight: '800', marginBottom: 8 },
  input: { backgroundColor: palette.white, borderRadius: 11, borderWidth: 1, borderColor: palette.line, padding: 11, color: palette.ink, marginBottom: 10, fontSize: 13 },
});
