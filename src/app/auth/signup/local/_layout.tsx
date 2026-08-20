import { Stack } from 'expo-router';

import { LocalSignupProvider } from '@/contexts/local-signup-context';

export default function LocalSignupLayout() {
  return (
    <LocalSignupProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </LocalSignupProvider>
  );
}
