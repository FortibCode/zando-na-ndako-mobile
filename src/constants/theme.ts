/**
 * Zando na Ndako - Design System Theme Tokens
 * Backward-compatible re-exports from the unified design system.
 */

import '@/global.css';

import { Platform } from 'react-native';
import { Palette, DarkPalette, Spacing as DS_Spacing, Radii as DS_Radii, Shadows as DS_Shadows, FontFamily } from '@/design/tokens';

export const Colors = {
  light: {
    text: Palette.ink,
    background: Palette.canvas,
    backgroundElement: Palette.navySoft,
    backgroundSelected: Palette.navySoft,
    textSecondary: Palette.muted,
    border: Palette.border,
    surface: Palette.surface,
    primary: Palette.navy,
    accent: Palette.coral,
  },
  dark: {
    text: DarkPalette.ink,
    background: DarkPalette.canvas,
    backgroundElement: DarkPalette.navySoft,
    backgroundSelected: DarkPalette.navySoft,
    textSecondary: DarkPalette.muted,
    border: DarkPalette.border,
    surface: DarkPalette.surface,
    primary: DarkPalette.navy,
    accent: DarkPalette.coral,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = FontFamily;

// Backward-compatible spacing scale (half/one/two/three/four/five/six)
export const Spacing = {
  half: DS_Spacing.xxs,
  one: DS_Spacing.xs,
  two: DS_Spacing.sm,
  three: DS_Spacing.lg,
  four: DS_Spacing.xxl,
  five: DS_Spacing.xxxl,
  six: DS_Spacing.huge * 1.6,
} as const;

export const Radii = { xs: DS_Radii.sm, sm: DS_Radii.md, md: DS_Radii.lg, lg: DS_Radii.xl, xl: 32, pill: DS_Radii.full } as const;

export const Shadows = {
  soft: { ...DS_Shadows.soft },
  card: { ...DS_Shadows.card },
  floating: { ...DS_Shadows.elevated },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

