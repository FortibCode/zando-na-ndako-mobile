import { Palette, DarkPalette, Spacing, Radii, Shadows, TextSizes, FontWeights } from './tokens';

/**
 * Zando na Ndako — Unified Theme (light + dark)
 * A single semantic theme object consumed across all roles.
 */

export type ThemeColors = {
// Brand
  primary: string;
  primaryBright: string;
  primaryDeep: string;
  primarySoft: string;
  primaryMuted: string;
  accent: string;
  accentBright: string;
  accentSoft: string;
  gold: string;
  goldSoft: string;
  fresh: string;
  freshBright: string;
  freshSoft: string;

  // Backward-compatible aliases (legacy consumers)
  primaryLight: string;
  green: string;
  surfaceBorder: string;
  tabBarBackground: string;
  tabBarBorder: string;

  // Surfaces
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  inputBackground: string;
  inputBorder: string;
  overlay: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Semantic
  success: string;
  error: string;
  warning: string;
  info: string;
  white: string;
  transparent: string;

  // Shadows
  shadow: string;
  shadowSoft: string;
  shadowElevated: string;
};

export const LightTheme: ThemeColors = {
  primary: Palette.orange,
  primaryBright: Palette.orangeBright,
  primaryDeep: Palette.orangeDeep,
  primarySoft: Palette.orangeSoft,
  primaryMuted: Palette.orangeMuted,
  accent: Palette.orange,
  accentBright: Palette.orangeBright,
  accentSoft: Palette.orangeSoft,
  gold: Palette.gold,
  goldSoft: Palette.goldSoft,
  fresh: Palette.fresh,
  freshBright: Palette.freshBright,
  freshSoft: Palette.freshSoft,

  // Backward-compatible aliases
  primaryLight: Palette.orangeSoft,
  green: Palette.fresh,
  surfaceBorder: Palette.border,
  tabBarBackground: Palette.surface,
  tabBarBorder: Palette.border,

  background: Palette.canvas,
  backgroundAlt: Palette.canvasAlt,
  surface: Palette.surface,
  surfaceAlt: Palette.white,
  border: Palette.border,
  borderStrong: Palette.borderStrong,
  inputBackground: Palette.surface,
  inputBorder: Palette.border,
  overlay: Palette.overlay,

  text: Palette.ink,
  textSecondary: Palette.muted,
  textTertiary: Palette.faint,
  textInverse: Palette.white,

  success: Palette.fresh,
  error: Palette.coral,
  warning: Palette.gold,
  info: Palette.navyBright,
  white: Palette.white,
  transparent: Palette.transparent,

  shadow: '#000000',
  shadowSoft: 'rgba(0, 0, 0, 0.06)',
  shadowElevated: 'rgba(192, 0, 0, 0.25)',
};

export const DarkTheme: ThemeColors = {
  primary: DarkPalette.orange,
  primaryBright: DarkPalette.orangeBright,
  primaryDeep: DarkPalette.orangeDeep,
  primarySoft: DarkPalette.orangeSoft,
  primaryMuted: DarkPalette.orangeMuted,
  accent: DarkPalette.orange,
  accentBright: DarkPalette.orangeBright,
  accentSoft: DarkPalette.orangeSoft,
  gold: DarkPalette.gold,
  goldSoft: DarkPalette.goldSoft,
  fresh: DarkPalette.fresh,
  freshBright: DarkPalette.freshBright,
  freshSoft: DarkPalette.freshSoft,

  // Backward-compatible aliases
  primaryLight: DarkPalette.orangeSoft,
  green: DarkPalette.fresh,
  surfaceBorder: DarkPalette.border,
  tabBarBackground: DarkPalette.surface,
  tabBarBorder: DarkPalette.border,

  background: DarkPalette.canvas,
  backgroundAlt: DarkPalette.canvasAlt,
  surface: DarkPalette.surface,
  surfaceAlt: DarkPalette.surface,
  border: DarkPalette.border,
  borderStrong: DarkPalette.borderStrong,
  inputBackground: DarkPalette.surface,
  inputBorder: DarkPalette.border,
  overlay: DarkPalette.overlay,

  text: DarkPalette.ink,
  textSecondary: DarkPalette.muted,
  textTertiary: DarkPalette.faint,
  textInverse: DarkPalette.white,

  success: DarkPalette.fresh,
  error: DarkPalette.coral,
  warning: DarkPalette.gold,
  info: DarkPalette.navyBright,
  white: DarkPalette.white,
  transparent: DarkPalette.transparent,

  shadow: '#000000',
  shadowSoft: 'rgba(0, 0, 0, 0.40)',
  shadowElevated: 'rgba(226, 59, 59, 0.35)',
};

export type Theme = {
  colors: ThemeColors;
  spacing: typeof Spacing;
  radii: typeof Radii;
  shadows: typeof Shadows;
  textSizes: typeof TextSizes;
  fontWeights: typeof FontWeights;
};

export const getTheme = (isDark: boolean): Theme => ({
  colors: isDark ? DarkTheme : LightTheme,
  spacing: Spacing,
  radii: Radii,
  shadows: Shadows,
  textSizes: TextSizes,
  fontWeights: FontWeights,
});
