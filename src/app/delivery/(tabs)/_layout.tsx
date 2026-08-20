import { Tabs } from 'expo-router';
import { BottomNav } from '@/components/delivery-ui';
export default function DeliveryTabsLayout() { 
    return <Tabs tabBar={
        ({ state }) => <BottomNav 
         active={(['home', 'missions', 'revenue', 'profile'] as const)[state.index] || 'home'} 
         />} 
        screenOptions={{ headerShown: false, tabBarStyle: { height: 82, overflow: 'visible' } }}>
        <Tabs.Screen name="index" />
            <Tabs.Screen name="missions" />
            <Tabs.Screen name="revenue" />
            <Tabs.Screen name="profile" />
        </Tabs>; 
}
