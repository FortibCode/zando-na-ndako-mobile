import { Tabs } from 'expo-router';
import { VendorBottomNav, type VendorTabKey } from '@/components/vendor-ui';

const ORDER: VendorTabKey[] = ['home', 'orders', 'products', 'revenue', 'profile'];

export default function VendorTabsLayout() {
  return (
    <Tabs
      tabBar={({ state }) => <VendorBottomNav active={ORDER[state.index] || 'home'} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="orders" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="revenue" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
