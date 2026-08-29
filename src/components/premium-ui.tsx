import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as React from 'react';
import type { ReactNode } from 'react';
import Animated, { FadeInUp, FadeInDown, useAnimatedStyle, useSharedValue, withSpring, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { useTheme } from '@/contexts/theme-context';
import { Palette, Radii } from '@/design/tokens';
import { GlassSurface as DesignGlassSurface } from '@/design/components';

export function PremiumPressable({ children, onPress, style, accessibilityLabel, disabled }: { children: ReactNode; onPress?: () => void; style?: any; accessibilityLabel?: string; disabled?: boolean }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={animatedStyle}><Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} disabled={disabled} onPress={onPress} onPressIn={() => { if (!disabled) scale.value = withSpring(.965, { damping: 18, stiffness: 260 }); }} onPressOut={() => { if (!disabled) scale.value = withSpring(1, { damping: 15, stiffness: 220 }); }} style={({ pressed }) => [style, pressed && !disabled && { opacity: .94 }]}>{children}</Pressable></Animated.View>;
}

export function PremiumButton({ children, onPress, tone = 'primary', icon }: { children: ReactNode; onPress?: () => void; tone?: 'primary' | 'success' | 'danger' | 'ghost'; icon?: ReactNode }) {
  const { colors } = useTheme();
  const bg = tone === 'primary' ? colors.primary : tone === 'success' ? colors.success : tone === 'danger' ? colors.error : colors.surfaceAlt;
  const border = tone === 'ghost' ? colors.border : 'transparent';
  const textColor = tone === 'ghost' ? colors.primary : colors.white;
  const textStyle = [styles.buttonText, { color: textColor }];
  const content = typeof children === 'string' ? <Text style={textStyle}>{children}</Text> : React.Children.map(children, (child) => typeof child === 'string' ? <Text style={textStyle}>{child}</Text> : child);
  return <PremiumPressable onPress={onPress} style={[styles.button, { backgroundColor: bg, borderColor: border, borderWidth: tone === 'ghost' ? 1.5 : 0, shadowColor: bg }]}><View style={styles.buttonContent}>{icon}{content}</View></PremiumPressable>;
}

export function PremiumCard({ children, style, index = 0, pressable = false, onPress }: { children: ReactNode; style?: ViewStyle; index?: number; pressable?: boolean; onPress?: () => void }) {
  const content = <DesignGlassSurface style={[styles.card, style]}><Animated.View entering={FadeInUp.duration(420).delay(index * 70).springify()}>{children}</Animated.View></DesignGlassSurface>;
  return pressable ? <PremiumPressable onPress={onPress}>{content}</PremiumPressable> : content;
}

export function GlassSurface({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <DesignGlassSurface style={[styles.glass, style]}>{children}</DesignGlassSurface>; }

export function AnimatedScreen({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <Animated.View entering={FadeInDown.duration(380).springify()} style={[{ flex: 1 }, style]}>{children}</Animated.View>; }

export function Skeleton({ width = '100%', height = 18, radius = 10, style }: { width?: number | string; height?: number; radius?: number; style?: ViewStyle }) {
  const { colors } = useTheme();
  const opacity = useSharedValue(.45);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  React.useEffect(() => { opacity.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true); }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.primarySoft } as ViewStyle, animatedStyle, style]} />;
}

export function FloatingActionButton({ children, onPress }: { children: ReactNode; onPress?: () => void }) {
  const { colors } = useTheme();
  return <PremiumPressable onPress={onPress} style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}>{children}</PremiumPressable>;
}

export const premiumColors = { blue: Palette.navy, blueDeep: Palette.navyDeep, ink: Palette.ink, muted: Palette.muted, border: Palette.border, surface: Palette.surface, canvas: Palette.canvas, green: Palette.fresh };
export const premiumAnimations = { enter: FadeInUp.duration(420).springify(), enterFast: FadeInDown.duration(300).springify() };
export const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  card: {
    padding: 14,
    borderRadius: 18,
  },
  glass: {
    padding: 14,
    borderRadius: 18,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
});
