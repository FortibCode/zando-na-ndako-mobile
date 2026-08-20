import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type SignupMethod = 'phone' | 'email' | 'google';

export type LocalSignupData = {
  method: SignupMethod;
  lastName: string;
  firstName: string;
  birthDate: string;
  gender: 'female' | 'male' | '';
  city: string;
  address: string;
  addressCity: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  password: string;
  preferredLanguage: string;
  notificationsEnabled: boolean;
  currency: string;
};

const INITIAL_DATA: LocalSignupData = {
  method: 'phone',
  lastName: '',
  firstName: '',
  birthDate: '',
  gender: '',
  city: '',
  address: '',
  addressCity: '',
  postalCode: '',
  country: 'Congo-Brazzaville',
  phone: '',
  email: '',
  password: '',
  preferredLanguage: 'Français',
  notificationsEnabled: true,
  currency: 'Franc CFA (FCFA)',
};

type LocalSignupContextValue = {
  data: LocalSignupData;
  update: (patch: Partial<LocalSignupData>) => void;
  reset: () => void;
};

const LocalSignupContext = createContext<LocalSignupContextValue | null>(null);

export function LocalSignupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LocalSignupData>(INITIAL_DATA);

  const value = useMemo(
    () => ({
      data,
      update: (patch: Partial<LocalSignupData>) => setData((prev) => ({ ...prev, ...patch })),
      reset: () => setData(INITIAL_DATA),
    }),
    [data],
  );

  return <LocalSignupContext.Provider value={value}>{children}</LocalSignupContext.Provider>;
}

export function useLocalSignup() {
  const context = useContext(LocalSignupContext);
  if (!context) throw new Error('useLocalSignup must be used within LocalSignupProvider');
  return context;
}
