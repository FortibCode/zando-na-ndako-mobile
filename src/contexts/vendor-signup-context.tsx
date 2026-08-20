import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type VendorSignupMethod = 'phone' | 'email' | 'google';

export type VendorSignupData = {
  method: VendorSignupMethod;
  lastName: string;
  firstName: string;
  birthDate: string;
  gender: 'male' | 'female' | '';
  city: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  storeName: string;
  storeCategory: string;
  storeZone: string;
  zoneId: string;
  identityDocument: string;
  storePhoto: string;
  tradeRegister: string;
};

const INITIAL_DATA: VendorSignupData = {
  method: 'phone',
  lastName: '',
  firstName: '',
  birthDate: '',
  gender: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  password: '',
  storeName: '',
  storeCategory: '',
  storeZone: '',
  zoneId: '',
  identityDocument: '',
  storePhoto: '',
  tradeRegister: '',
};

type VendorSignupContextValue = {
  data: VendorSignupData;
  update: (patch: Partial<VendorSignupData>) => void;
  reset: () => void;
};

const VendorSignupContext = createContext<VendorSignupContextValue | null>(null);

export function VendorSignupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<VendorSignupData>(INITIAL_DATA);

  const value = useMemo(
    () => ({
      data,
      update: (patch: Partial<VendorSignupData>) =>
        setData((prev) => ({ ...prev, ...patch })),
      reset: () => setData(INITIAL_DATA),
    }),
    [data],
  );

  return (
    <VendorSignupContext.Provider value={value}>{children}</VendorSignupContext.Provider>
  );
}

export function useVendorSignup() {
  const context = useContext(VendorSignupContext);
  if (!context) throw new Error('useVendorSignup must be used within VendorSignupProvider');
  return context;
}

