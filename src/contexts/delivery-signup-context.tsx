import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type DeliverySignupMethod = 'phone' | 'email' | 'google';
export type DeliverySignupData = {
  method: DeliverySignupMethod; phone: string; email: string; password: string;
  lastName: string; firstName: string; birthDate: string; country: string;
  address: string; driverPhone: string; licenseNumber: string; vehicleType: string;
  profilePhoto: string; identityDocument: string; vehiclePhoto: string;
  registrationOtp: string; registrationPhone: string;
};

const INITIAL_DATA: DeliverySignupData = {
  method: 'phone', phone: '', email: '', password: '', lastName: '', firstName: '', birthDate: '',
  country: 'Congo-Brazzaville', address: '', driverPhone: '', licenseNumber: '', vehicleType: '',
  profilePhoto: '', identityDocument: '', vehiclePhoto: '', registrationOtp: '', registrationPhone: '',
};

const DeliverySignupContext = createContext<{
  data: DeliverySignupData;
  update: (patch: Partial<DeliverySignupData>) => void;
} | null>(null);

export function DeliverySignupProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(INITIAL_DATA);
  const value = useMemo(() => ({ data, update: (patch: Partial<DeliverySignupData>) => setData((prev) => ({ ...prev, ...patch })) }), [data]);
  return <DeliverySignupContext.Provider value={value}>{children}</DeliverySignupContext.Provider>;
}

export function useDeliverySignup() {
  const context = useContext(DeliverySignupContext);
  if (!context) throw new Error('useDeliverySignup must be used within DeliverySignupProvider');
  return context;
}
