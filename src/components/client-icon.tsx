import {
  ArrowLeft, ArrowRight, Bell, Bike, Box, BriefcaseBusiness, CalendarDays, Camera, CardSim, Check, ChevronDown,
  ChevronRight, CircleHelp, CircleUserRound, CreditCard, Filter, Gift, Globe2, Grid2X2, Heart, Home, Info, Landmark,
  LocateFixed, LocateIcon, LogOut, Mail, MapPin, Menu, MessageCircle, MoreHorizontal, Package, PersonStanding,
  Receipt, Search, Settings, Share2, ShieldAlert, ShoppingCart, SlidersHorizontal, Star, Store, Truck, Upload, UserRound, X,
  type LucideProps,
} from 'lucide-react-native';
import type { ComponentType } from 'react';

const ICONS = { arrowBack: ArrowLeft, arrowForward: ArrowRight, bell: Bell, bike: Bike, box: Box, briefcase: BriefcaseBusiness, calendar: CalendarDays, camera: Camera, card: CardSim, check: Check, chevronDown: ChevronDown, chevronForward: ChevronRight, help: CircleHelp, userCircle: CircleUserRound, creditCard: CreditCard, filter: Filter, gift: Gift, globe: Globe2, grid: Grid2X2, heart: Heart, home: Home, info: Info, landmark: Landmark, locate: LocateFixed, location: MapPin, logout: LogOut, mail: Mail, menu: Menu, message: MessageCircle, more: MoreHorizontal, package: Package, person: PersonStanding, receipt: Receipt, search: Search, settings: Settings, share: Share2, shield: ShieldAlert, cart: ShoppingCart, sliders: SlidersHorizontal, star: Star, store: Store, truck: Truck, upload: Upload, user: UserRound, close: X,
} satisfies Record<string, ComponentType<LucideProps>>;

export type ClientIconName = keyof typeof ICONS;
export function ClientIcon({ name, size = 24, color = '#0D347C', strokeWidth = 2, ...props }: LucideProps & { name: ClientIconName }) {
  const Icon = ICONS[name];
  return <Icon color={color} size={size} strokeWidth={strokeWidth} {...props} />;
}
