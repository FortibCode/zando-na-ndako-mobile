import { Tabs } from 'expo-router';
import { Home, Grid3X3, ShoppingCart, Receipt, User, Search, Heart, Compass } from 'lucide-react-native';
import { useClient } from '@/contexts/client-context';
import { useTheme } from '@/contexts/theme-context';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii } from '@/design/tokens';

function TabIcon({ icon: Icon, color, size, focused, activeBg }: {
  icon: any;
  color: string | import('react-native').ColorValue;
  size: number;
  focused: boolean;
  activeBg: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIconWrap, animatedStyle]}>
      {focused && <View style={[styles.activeDot, { backgroundColor: color as string }]} />}
      <Icon color={color as any} size={size} strokeWidth={focused ? 2.5 : 1.8} fill={focused ? color : ('transparent' as any)} />
    </Animated.View>
  );
}

export default function ClientTabsLayout() {
  const { cartCount } = useClient();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 68 + (Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          backgroundColor: isDark ? 'rgba(18, 22, 32, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          shadowColor: colors.shadow,
          shadowOpacity: 0.14,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: -8 },
          elevation: 10,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Découvrir',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              icon={Compass}
              color={color}
              size={23}
              focused={focused}
              activeBg={colors.primarySoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Catégories',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              icon={Grid3X3}
              color={color}
              size={23}
              focused={focused}
              activeBg={colors.primarySoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Panier',
          tabBarBadge: cartCount || undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            color: colors.white,
            fontSize: 10,
            fontWeight: '800',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              icon={ShoppingCart}
              color={color}
              size={23}
              focused={focused}
              activeBg={colors.primarySoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Commandes',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              icon={Receipt}
              color={color}
              size={23}
              focused={focused}
              activeBg={colors.primarySoft}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon
              icon={User}
              color={color}
              size={23}
              focused={focused}
              activeBg={colors.primarySoft}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: -5,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
