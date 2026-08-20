import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

/** Dictionnaire d'icônes sémantiques et attrayantes pour Zando na Ndako */
export const AUTH_ICONS = {
  // Champs de saisie
  lastName: 'text-outline' as IconName,
  firstName: 'person-outline' as IconName,
  fullName: 'person-circle-outline' as IconName,
  birthDate: 'calendar-number-outline' as IconName,
  gender: 'male-female-outline' as IconName,
  phone: 'call-outline' as IconName,
  phoneMobile: 'phone-portrait-outline' as IconName,
  email: 'mail-outline' as IconName,
  emailWork: 'briefcase-outline' as IconName,
  password: 'lock-closed-outline' as IconName,
  passwordConfirm: 'shield-checkmark-outline' as IconName,
  address: 'home-outline' as IconName,
  location: 'location-outline' as IconName,
  postalCode: 'locate-outline' as IconName,
  country: 'globe-outline' as IconName,
  storeName: 'storefront-outline' as IconName,
  vehicle: 'bicycle-outline' as IconName,
  vehicleCard: 'card-outline' as IconName,
  currency: 'cash-outline' as IconName,
  language: 'language-outline' as IconName,

  // Boutons et navigation
  next: 'arrow-forward-circle-outline' as IconName,
  back: 'arrow-back' as IconName,
  login: 'log-in-outline' as IconName,
  register: 'person-add-outline' as IconName,
  finish: 'checkmark-done-circle-outline' as IconName,
  save: 'save-outline' as IconName,
  key: 'key-outline' as IconName,
  chevronRight: 'chevron-forward-outline' as IconName,

  // Upload et documents
  camera: 'camera-outline' as IconName,
  idCard: 'id-card-outline' as IconName,
  document: 'document-text-outline' as IconName,
  cloudUpload: 'cloud-upload-outline' as IconName,
} as const;
