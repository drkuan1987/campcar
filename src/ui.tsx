import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const palette = {
  background: '#F5F4EE',
  forest: '#1A4034',
  forestDark: '#14352B',
  ink: '#1F332C',
  muted: '#77847C',
  line: '#E6E9DF',
  white: '#FFFFFF',
  sage: '#E7EFE6',
  orange: '#D98753',
  paleOrange: '#FBF0E7',
};

const lake = require('../assets/camp-lake.png');
const road = require('../assets/mountain-road.png');

export function imageSource(uri?: string) {
  if (uri === 'lake') return lake;
  if (uri === 'road') return road;
  return uri ? { uri } : lake;
}

export function Icon({ name, size = 20, color = palette.ink }: { name: React.ComponentProps<typeof Ionicons>['name']; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function ImageTile({ uri, height = 190, children, radius = 22 }: { uri?: string; height?: number; children?: React.ReactNode; radius?: number }) {
  return (
    <ImageBackground source={imageSource(uri)} style={{ height, overflow: 'hidden', borderRadius: radius }} imageStyle={{ borderRadius: radius }} resizeMode="cover">
      {children}
    </ImageBackground>
  );
}

export function GradientCover({ children }: { children: React.ReactNode }) {
  return <LinearGradient colors={['transparent', 'rgba(9, 29, 23, .82)']} style={StyleSheet.absoluteFill}>{children}</LinearGradient>;
}

export function Button({ label, onPress, icon, variant = 'primary', disabled = false }: { label: string; onPress: () => void; icon?: React.ComponentProps<typeof Ionicons>['name']; variant?: 'primary' | 'light' | 'outline' | 'subtle'; disabled?: boolean }) {
  const surface = variant === 'primary' ? palette.forest : variant === 'light' ? palette.white : variant === 'outline' ? 'transparent' : palette.sage;
  const color = variant === 'primary' ? palette.white : palette.forest;
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, { backgroundColor: surface, borderWidth: variant === 'outline' ? 1 : 0, borderColor: palette.forest, opacity: disabled ? 0.5 : 1 }]}>
      {icon && <Icon name={icon} size={17} color={color} />}
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function RoundButton({ icon, onPress, light = false }: { icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; light?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.roundButton, { backgroundColor: light ? 'rgba(255,255,255,.95)' : palette.sage }]}><Icon name={icon} size={19} color={palette.forest} /></Pressable>;
}

export function Pill({ label, active = false, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      {icon && <Icon name={icon} size={14} color={active ? palette.white : palette.forest} />}
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <Text style={[styles.eyebrow, light && { color: '#E2E9DD' }]}>{children}</Text>;
}

export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action && <Pressable onPress={onPress}><Text style={styles.sectionAction}>{action}  →</Text></Pressable>}
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', suffix }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; keyboardType?: 'default' | 'numeric' | 'decimal-pad'; suffix?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, multiline && { minHeight: 90, alignItems: 'flex-start' }]}>
        <TextInput
          style={[styles.input, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A7B1A8"
          multiline={multiline}
          keyboardType={keyboardType}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

export function PhotoThumb({ uri, size = 78 }: { uri: string; size?: number }) {
  return <Image source={imageSource(uri)} style={{ width: size, height: size, borderRadius: 15, backgroundColor: palette.sage }} />;
}

export const styles = StyleSheet.create({
  button: { minHeight: 48, paddingHorizontal: 19, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { fontSize: 14, fontWeight: '700' },
  roundButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pill: { minHeight: 36, paddingHorizontal: 13, backgroundColor: palette.white, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: palette.line },
  pillActive: { backgroundColor: palette.forest, borderColor: palette.forest },
  pillText: { color: palette.forest, fontSize: 12, fontWeight: '700' },
  pillTextActive: { color: palette.white },
  eyebrow: { color: palette.orange, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionHeading: { color: palette.ink, fontSize: 22, fontWeight: '800', letterSpacing: -.5 },
  sectionAction: { color: palette.forest, fontSize: 12, fontWeight: '700' },
  fieldWrap: { marginBottom: 15 },
  fieldLabel: { color: palette.ink, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  inputWrap: { backgroundColor: palette.white, borderRadius: 14, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 14, minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, paddingVertical: 11, color: palette.ink, fontSize: 14 },
  inputSuffix: { color: palette.muted, fontSize: 13, marginLeft: 8 },
});
