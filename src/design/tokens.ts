import { Platform } from 'react-native';

/**
 * Zando na Ndako — Premium Design System Tokens
 * Single source of truth for colors, spacing, radii, shadows, and typography.
 */

// ─── Brand Palette ────────────────────────────────────────────────────────────
export const Palette = {
  // Primary — Rouge Zando na Ndako (charte graphique #C00000), CTA & accent actif
  orange: '#C00000',
  orangeBright: '#E01313',
  orangeDeep: '#8F0000',
  orangeSoft: '#FBEAEA',
  orangeMuted: '#A30000',

  // Secondary Navy (structure, trust) — charte graphique #1A2E5A
  navy: '#1A2E5A',
  navyBright: '#26407A',
  navyDeep: '#101C38',
  navySoft: '#EAF0FF',
  navyMuted: '#4B5F8B',

  // Accent & Status
  coral: '#D90816',
  coralBright: '#ED1C24',
  coralSoft: '#FFE8E9',

  // Accent / Vitesse — charte graphique Jaune Safran #F1A105
  gold: '#F1A105',
  goldSoft: '#FFF1CD',

  // Produits — charte graphique Vert Maraîcher #2E7D32
  fresh: '#2E7D32',
  freshBright: '#389E40',
  freshSoft: '#E4F7E5',

  // Neutrals (Light Mode)
  white: '#FFFFFF',
  ink: '#0B0E14',
  inkSoft: '#1A2130',
  slate: '#3C4A65',
  muted: '#64728A',
  faint: '#94A3B8',
  border: 'rgba(0, 0, 0, 0.08)',
  borderStrong: 'rgba(0, 0, 0, 0.14)',
  surface: '#FFFFFF',
  canvas: '#F8F9FA',
  canvasAlt: '#F1F3F6',
  overlay: 'rgba(10, 12, 20, 0.60)',
  transparent: 'transparent',
} as const;

// ─── Dark Palette ─────────────────────────────────────────────────────────────
export const DarkPalette = {
  // Primary — Rouge Zando na Ndako, éclairci pour le mode sombre
  orange: '#E23B3B',
  orangeBright: '#FF6060',
  orangeDeep: '#8F0000',
  orangeSoft: '#3B0A0A',
  orangeMuted: '#FF8080',

  // Secondary Navy
  navy: '#9BBEFF',
  navyBright: '#C2D6FF',
  navyDeep: '#061638',
  navySoft: '#102750',
  navyMuted: '#A8BCE0',

  // Accent & Status
  coral: '#FF7A80',
  coralBright: '#FFA1A6',
  coralSoft: '#3B1116',

  gold: '#FFC35C',
  goldSoft: '#392A0A',

  fresh: '#63D66D',
  freshBright: '#91EA98',
  freshSoft: '#0C2C13',

  // Neutrals (Dark Mode AMOLED)
  white: '#FFFFFF',
  ink: '#F7F9FF',
  inkSoft: '#DCE5F6',
  slate: '#BBC8DE',
  muted: '#98A6BD',
  faint: '#697894',
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.20)',
  surface: '#121620',
  canvas: '#0A0C10',
  canvasAlt: '#161B26',
  overlay: 'rgba(0, 0, 0, 0.82)',
  transparent: 'transparent',
} as const;

// ─── Spacing Scale ────────────────────────────────────────────────────────────
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

// ─── Radii ────────────────────────────────────────────────────────────────────
export const Radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
  full: 999,
} as const;

// ─── Shadows (Glassmorphism & Neumorphism) ────────────────────────────────────
export const Shadows = {
  none: { shadowColor: 'transparent', shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.10,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  elevated: {
    shadowColor: '#C00000',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  neumorphic: {
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 3, height: 5 },
    elevation: 5,
  },
  glassGlow: {
    shadowColor: '#C00000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const FontFamily = Platform.select({
  ios: {
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    rounded: 'system-ui, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, monospace',
  },
}) ?? { sans: 'normal', rounded: 'normal', mono: 'monospace' };

export const TextSizes = {
  display: 32,
  h1: 26,
  h2: 22,
  h3: 18,
  body: 15,
  caption: 13,
  micro: 11,
} as const;

export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────
export const Layout = {
  screenPadding: Spacing.xl,
  maxContentWidth: 800,
  contentGap: Spacing.lg,
  sectionGap: Spacing.xxl,
} as const;

// ─── Gradients (Premium) ──────────────────────────────────────────────────────
export const Gradients = {
  primary: ['#E01313', '#C00000', '#8F0000'] as const,        // Rouge Zando
  primaryDeep: ['#8F0000', '#C00000', '#E01313'] as const,     // Rouge profond
  navy: ['#1A2E5A', '#26407A', '#3A5CA0'] as const,           // Bleu marine
  success: ['#2E7D32', '#389E40', '#4CB556'] as const,
  gold: ['#F1A105', '#FFC35C', '#FFD98A'] as const,
  coral: ['#D90816', '#ED1C24', '#FF5A5A'] as const,
  glass: ['rgba(255,255,255,0.92)', 'rgba(255,255,255,0.72)'] as const,
  glassDark: ['rgba(18,22,32,0.92)', 'rgba(18,22,32,0.72)'] as const,
} as const;

// ─── Glow (Lueurs douces) ─────────────────────────────────────────────────────
export const Glow = {
  primary: { shadowColor: '#C00000', shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  primarySoft: { shadowColor: '#C00000', shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  navy: { shadowColor: '#26407A', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 9 },
  success: { shadowColor: '#389E40', shadowOpacity: 0.30, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
  danger: { shadowColor: '#ED1C24', shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 8 },
} as const;

// ─── Glassmorphism Tokens ─────────────────────────────────────────────────────
export const Glass = {
  // Surface glass en mode clair
  lightSurface: 'rgba(255, 255, 255, 0.88)',
  lightTint: 'rgba(255, 255, 255, 0.72)',
  lightBorder: 'rgba(255, 255, 255, 0.60)',
  lightBlur: 24,
  // Surface glass en mode sombre
  darkSurface: 'rgba(18, 22, 32, 0.86)',
  darkTint: 'rgba(18, 22, 32, 0.70)',
  darkBorder: 'rgba(255, 255, 255, 0.14)',
  darkBlur: 24,
} as const;

// ─── Focus States ─────────────────────────────────────────────────────────────
export const Focus = {
  ring: { borderColor: '#C00000', borderWidth: 2.2 },
  ringSoft: { borderColor: '#E01313', borderWidth: 1.8 },
  softGlow: { shadowColor: '#C00000', shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
} as const;

// ─── Motion / Transitions ─────────────────────────────────────────────────────
export const Motion = {
  fast: 180,
  base: 280,
  slow: 420,
  spring: { damping: 18, stiffness: 220 },
  springSoft: { damping: 22, stiffness: 160 },
  ease: [0.25, 0.1, 0.25, 1] as const,
} as const;
