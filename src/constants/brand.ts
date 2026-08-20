/** Couleurs et styles de la marque Zando na Ndako - Design System Premium */
import { Palette, DarkPalette } from '@/design/tokens';

export const BrandColors = {
  // Couleurs du Logo Zando na Ndako
  orange: Palette.orange,       // Zando Orange (Couleur primaire, boutons CTA, éléments actifs)
  orangeBright: Palette.orangeBright,
  orangeDeep: Palette.orangeDeep,
  orangeSoft: Palette.orangeSoft,
  orangeMuted: Palette.orangeMuted,

  blue: Palette.navy,          // Zando Navy (Texte principal, header, cartes sombres)
  blueBright: Palette.navyBright,
  blueDeep: Palette.navyDeep,
  blueSoft: Palette.navySoft,
  blueMuted: Palette.navyMuted,
  blueLight: Palette.navySoft,

  red: Palette.coral,          // Ndako Red (Alertes, erreurs, badges)
  redBright: Palette.coralBright,
  redSoft: Palette.coralSoft,

  yellow: Palette.gold,        // Zando Gold (Étoiles, avis, tags spéciaux)
  yellowSoft: Palette.goldSoft,

  green: Palette.fresh,        // Vert Produit Frais (En stock, livré, disponible)
  greenSoft: Palette.freshSoft,

  white: Palette.white,
  textDark: Palette.ink,
  textSubtle: Palette.slate,
  textMuted: Palette.muted,
  dotInactive: Palette.faint,
  border: Palette.border,
  borderFocus: Palette.orangeBright,
  borderMuted: Palette.border,
  cardBg: Palette.surface,
  inputBg: Palette.canvasAlt,
  tabBg: Palette.surface,
  tabInactive: Palette.muted,
  iconBg: Palette.orangeSoft,
  glow: Palette.orangeSoft,
  shadowColor: Palette.ink,
} as const;

export const BrandDarkColors = {
  orange: DarkPalette.orange,
  orangeBright: DarkPalette.orangeBright,
  orangeDeep: DarkPalette.orangeDeep,
  orangeSoft: DarkPalette.orangeSoft,
  orangeMuted: DarkPalette.orangeMuted,

  blue: DarkPalette.navy,
  blueBright: DarkPalette.navyBright,
  blueDeep: DarkPalette.navyDeep,
  blueSoft: DarkPalette.navySoft,
  blueMuted: DarkPalette.navyMuted,
  red: DarkPalette.coral,
  redBright: DarkPalette.coralBright,
  redSoft: DarkPalette.coralSoft,
  yellow: DarkPalette.gold,
  yellowSoft: DarkPalette.goldSoft,
  green: DarkPalette.fresh,
  greenSoft: DarkPalette.freshSoft,
  white: DarkPalette.white,
  textDark: DarkPalette.ink,
  textSubtle: DarkPalette.slate,
  textMuted: DarkPalette.muted,
  border: DarkPalette.border,
  cardBg: DarkPalette.surface,
  inputBg: DarkPalette.surface,
  shadowColor: '#000000',
} as const;
