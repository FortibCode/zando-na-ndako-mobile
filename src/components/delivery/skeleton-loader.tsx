import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/theme-context';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

function SkeletonBlock({ width, height = 18, radius = 10, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.35);
  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: colors.primarySoft },
        animatedStyle,
        style,
      ]}
    />
  );
}

// ─── Dashboard Skeleton ───
export function DashboardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={{ height: 226, borderRadius: 28, backgroundColor: colors.primarySoft, marginTop: 10 }} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <SkeletonBlock height={120} style={{ flex: 1, borderRadius: 22 }} />
        <SkeletonBlock height={120} style={{ flex: 1, borderRadius: 22 }} />
      </View>
      <SkeletonBlock height={240} style={{ marginTop: 16, borderRadius: 22 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <SkeletonBlock height={120} style={{ flex: 1, borderRadius: 22 }} />
        <SkeletonBlock height={120} style={{ flex: 1, borderRadius: 22 }} />
        <SkeletonBlock height={120} style={{ flex: 1, borderRadius: 22 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBlock key={i} height={76} style={{ flex: 1, borderRadius: 16 }} />
        ))}
      </View>
    </View>
  );
}

// ─── Missions Skeleton ───
export function MissionsSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock height={45} style={{ borderRadius: 12, marginBottom: 20 }} />
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} height={90} style={{ borderRadius: 22, marginBottom: 12 }} />
      ))}
    </View>
  );
}

// ─── Revenue Skeleton ───
export function RevenueSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock height={180} style={{ borderRadius: 22 }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <SkeletonBlock height={100} style={{ flex: 1, borderRadius: 22 }} />
        <SkeletonBlock height={100} style={{ flex: 1, borderRadius: 22 }} />
        <SkeletonBlock height={100} style={{ flex: 1, borderRadius: 22 }} />
      </View>
      <SkeletonBlock height={22} style={{ borderRadius: 10, marginTop: 32, width: 180 }} />
      {[1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} height={60} style={{ borderRadius: 22, marginTop: 10 }} />
      ))}
    </View>
  );
}

// ─── Mission Detail Skeleton ───
export function MissionDetailSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBlock height={28} style={{ borderRadius: 10, width: 180 }} />
      <SkeletonBlock height={300} style={{ borderRadius: 22, marginTop: 20 }} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <SkeletonBlock height={56} style={{ flex: 1, borderRadius: 16 }} />
        <SkeletonBlock height={56} style={{ flex: 1, borderRadius: 16 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
});

export default SkeletonBlock;
