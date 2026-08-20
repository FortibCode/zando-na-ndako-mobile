import React, { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/theme-context';
import { Spacing, Radii, Shadows, TextSizes, FontWeights } from './tokens';

/**
 * Zando na Ndako — Reference UI Kit & Glassmorphism Design System
 * Replicating the FastFood UI Kit aesthetic (Orange CTAs, pill buttons, 5-tab bottom bar).
 */

// ─── Screen Container ─────────────────────────────────────────────────────────
export function Screen({ children, scroll = true, dark = false, contentStyle, style }: {
  children: ReactNode;
  scroll?: boolean;
  dark?: boolean;
  contentStyle?: ViewStyle;
  style?: ViewStyle;
}) {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }, style]}>
      <StatusBar style={dark || isDark ? 'light' : 'dark'} />
      {/* Ambient gradient background glow orbs */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.ambientOrb,
            styles.ambientOrbTop,
            { backgroundColor: isDark ? 'rgba(255, 69, 0, 0.16)' : 'rgba(255, 69, 0, 0.08)' },
          ]}
        />
        <View
          style={[
            styles.ambientOrb,
            styles.ambientOrbBottom,
            { backgroundColor: isDark ? 'rgba(255, 85, 0, 0.12)' : 'rgba(255, 85, 0, 0.06)' },
          ]}
        />
      </View>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, contentStyle]}>
          {children}
        </ScrollView>
      ) : children}
    </SafeAreaView>
  );
}

// ─── GlassSurface ─────────────────────────────────────────────────────────────
export function GlassSurface({ children, style, interactive = false, neumorphic = false }: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  interactive?: boolean;
  neumorphic?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const nativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable();

  return (
    <View
      style={[
        styles.glassSurface,
        {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: colors.shadow,
        },
        neumorphic && (isDark ? styles.neumorphicDark : styles.neumorphicLight),
        style,
      ]}
    >
      {nativeGlass ? (
        <GlassView
          colorScheme={isDark ? 'dark' : 'light'}
          glassEffectStyle="clear"
          isInteractive={interactive}
          tintColor={isDark ? 'rgba(18, 22, 32, 0.82)' : 'rgba(255, 255, 255, 0.85)'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(18, 22, 32, 0.90)' : 'rgba(255, 255, 255, 0.92)',
            },
          ]}
        />
      )}
      <View style={styles.glassContent}>{children}</View>
    </View>
  );
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
export function ThemeToggle() {
  const { colors, isDark, setMode } = useTheme();
  const nextMode = isDark ? 'light' : 'dark';

  return (
    <Pressable
      accessibilityLabel={isDark ? 'Passer au mode clair' : 'Passer au mode sombre'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => { void setMode(nextMode); }}
      style={({ pressed }) => [
        styles.themeToggle,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        pressed && styles.themeTogglePressed,
      ]}
    >
      <Ionicons color={colors.primary} name={isDark ? 'sunny' : 'moon'} size={20} />
    </Pressable>
  );
}

// ─── App Header ───────────────────────────────────────────────────────────────
export function AppHeader({ title, subtitle, back = true, right, onBack }: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      {back ? (
        <Pressable
          onPress={onBack}
          style={[styles.iconBtn, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}
          accessibilityLabel="Retour"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right || <ThemeToggle />}
    </View>
  );
}

// ─── Button (Pill CTA FastFood Style) ──────────────────────────────────────────
type ButtonTone = 'primary' | 'accent' | 'success' | 'danger' | 'ghost' | 'outline' | 'social';

export function Button({
  children,
  onPress,
  tone = 'primary',
  icon,
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
  pill = true,
}: {
  children: ReactNode;
  onPress?: () => void;
  tone?: ButtonTone;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  pill?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isPrimary = tone === 'primary' || tone === 'accent';
  const isSocial = tone === 'social';

  const bg =
    isPrimary ? colors.primary
    : tone === 'success' ? colors.fresh
    : tone === 'danger' ? colors.error
    : isSocial ? colors.surface
    : tone === 'ghost' ? colors.surfaceAlt
    : 'transparent';

  const borderColor =
    tone === 'outline' || isSocial ? colors.border
    : tone === 'ghost' ? colors.border
    : isPrimary ? 'rgba(255, 255, 255, 0.20)'
    : 'transparent';

  const textColor =
    isSocial ? colors.text
    : tone === 'ghost' || tone === 'outline' ? colors.primary
    : colors.white;

  const content = typeof children === 'string'
    ? <Text style={[styles.buttonText, { color: textColor }]}>{children}</Text>
    : React.Children.map(children, (child) =>
        typeof child === 'string' ? <Text style={[styles.buttonText, { color: textColor }]}>{child}</Text> : child
      );

  return (
    <Animated.View style={[fullWidth && styles.buttonFull, animStyle]}>
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => { if (!disabled) scale.value = withSpring(0.96); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={({ pressed }) => [
          styles.button,
          pill && styles.buttonPill,
          { backgroundColor: bg, borderColor, borderWidth: tone === 'outline' || tone === 'ghost' || isSocial ? 1.2 : 0 },
          isPrimary && (isDark ? styles.btnShadowDark : styles.btnShadowLight),
          pressed && !disabled && { opacity: 0.90 },
          disabled && { opacity: 0.5 },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {icon}
            {content}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style, index = 0, pressable = false, onPress, neumorphic = false }: {
  children: ReactNode;
  style?: ViewStyle;
  index?: number;
  pressable?: boolean;
  onPress?: () => void;
  neumorphic?: boolean;
}) {
  const card = (
    <GlassSurface style={[styles.card, style]} neumorphic={neumorphic}>
      <Animated.View entering={FadeInUp.duration(350).delay(index * 50).springify()}>
        {children}
      </Animated.View>
    </GlassSurface>
  );
  if (!pressable) return card;
  return (
    <Animated.View entering={FadeInUp.duration(350).delay(index * 50).springify()}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.94, transform: [{ scale: 0.99 }] }]}>
        {card}
      </Pressable>
    </Animated.View>
  );
}

// ─── PromoBannerCard (Bannière Orange type Kit de Référence) ─────────────────
export function PromoBannerCard({
  title = 'Obtenez 30% de réduction !',
  subtitle = 'Commandez dès maintenant vos plats préférés',
  buttonLabel = 'Commander',
  onPress,
}: {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.promoCard, { backgroundColor: colors.primary }]}>
      <View style={{ flex: 1, paddingRight: Spacing.md }}>
        <Text style={styles.promoTitle}>{title}</Text>
        <Text style={styles.promoSubtitle}>{subtitle}</Text>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.promoButton, pressed && { opacity: 0.9 }]}
        >
          <Text style={[styles.promoButtonText, { color: colors.primary }]}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Input (Champs Arrondis 14px Style Kit de Référence) ──────────────────────
export function Input({ label, required, error, icon, style, ...props }: TextInputProps & {
  label?: string;
  required?: boolean;
  error?: string;
  icon?: ReactNode;
}) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={styles.field}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>
          {label} {required && <Text style={{ color: colors.error }}>*</Text>}
        </Text>
      ) : null}
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(248, 249, 250, 0.95)',
            borderColor: error ? colors.error : focused ? colors.primary : colors.inputBorder,
          },
          focused && styles.inputWrapFocused,
          error && styles.inputWrapError,
        ]}
      >
        {icon}
        <TextInput
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.text }]}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
}

// ─── SwitchToggle ─────────────────────────────────────────────────────────────
export function SwitchToggle({ value, onValueChange }: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primarySoft }}
      thumbColor={value ? colors.primary : colors.textSecondary}
    />
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, tone = 'primary', icon }: {
  label: string;
  tone?: 'primary' | 'accent' | 'success' | 'gold' | 'neutral';
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  const bg =
    tone === 'primary' ? colors.primarySoft
    : tone === 'accent' ? colors.accentSoft
    : tone === 'success' ? colors.freshSoft
    : tone === 'gold' ? colors.goldSoft
    : colors.backgroundAlt;
  const fg =
    tone === 'primary' ? colors.primary
    : tone === 'accent' ? colors.accent
    : tone === 'success' ? colors.success
    : tone === 'gold' ? colors.gold
    : colors.textSecondary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon}
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ─── Chip (Pastille Catégorie Style Kit de Référence) ────────────────────────
export function Chip({ label, selected, onPress, icon }: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
}) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.primary
            : isDark
            ? 'rgba(255, 255, 255, 0.06)'
            : '#FFF5F0',
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          { color: selected ? colors.white : isDark ? colors.text : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, onSeeAll, action }: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {action}
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>Voir tout ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, icon, style }: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  return (
    <GlassSurface style={[styles.statCard, style]}>
      {icon ? <View style={styles.statIcon}>{icon}</View> : null}
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub ? <Text style={[styles.statSub, { color: colors.textTertiary }]}>{sub}</Text> : null}
    </GlassSurface>
  );
}

// ─── Menu Row ─────────────────────────────────────────────────────────────────
export function MenuRow({ icon, label, onPress, index = 0, color, right }: {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  index?: number;
  color?: string;
  right?: ReactNode;
}) {
  const { colors } = useTheme();
  const ic = color || colors.primary;
  return (
    <Animated.View entering={FadeInLeft.duration(300).delay(index * 30).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.menuRow,
          { borderBottomColor: colors.border },
          pressed && { backgroundColor: colors.backgroundAlt },
        ]}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.primarySoft }]}>{icon}</View>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
        {right || <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />}
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty Message ────────────────────────────────────────────────────────────
export function EmptyMessage({ title, message, icon }: {
  title: string;
  message?: string;
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      {icon ? <View style={styles.emptyIcon}>{icon}</View> : null}
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  ambientOrb: { position: 'absolute', width: 280, height: 280, borderRadius: 140, opacity: 0.55 },
  ambientOrbTop: { top: -140, right: -80 },
  ambientOrbBottom: { bottom: -160, left: -100 },
  glassSurface: {
    overflow: 'hidden',
    borderRadius: Radii.lg,
    borderWidth: 1,
    shadowOpacity: 0.10,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  glassContent: { zIndex: 1 },

  neumorphicLight: {
    shadowColor: '#A8B4C7',
    shadowOpacity: 0.30,
    shadowRadius: 12,
    shadowOffset: { width: 4, height: 6 },
    elevation: 5,
  },
  neumorphicDark: {
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 4, height: 6 },
    elevation: 6,
  },

  themeToggle: {
    width: 42,
    height: 42,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  themeTogglePressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: TextSizes.h2, fontWeight: FontWeights.black },
  headerSubtitle: { fontSize: TextSizes.caption, marginTop: 2 },

  button: {
    minHeight: 52,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  buttonPill: {
    borderRadius: Radii.pill,
  },
  buttonFull: { width: '100%' },
  buttonText: { fontSize: TextSizes.body, fontWeight: FontWeights.extrabold, letterSpacing: 0.2 },
  btnShadowLight: {
    shadowColor: '#C00000',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnShadowDark: {
    shadowColor: '#E01313',
    shadowOpacity: 0.42,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  card: {
    padding: Spacing.xl,
  },

  promoCard: {
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.lg,
    overflow: 'hidden',
  },
  promoTitle: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  promoSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 4, lineHeight: 18 },
  promoButton: {
    backgroundColor: '#FFF',
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  promoButtonText: { fontSize: 13, fontWeight: '900' },

  field: { marginTop: Spacing.md, width: '100%' },
  label: { fontSize: TextSizes.caption, fontWeight: FontWeights.bold, marginBottom: Spacing.sm },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1.2,
    borderRadius: 14,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputWrapFocused: { shadowColor: '#C00000', shadowOpacity: 0.20, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  inputWrapError: { borderColor: '#E0072B' },
  input: { flex: 1, fontSize: TextSizes.body, fontWeight: FontWeights.medium, paddingVertical: Spacing.md },
  errorText: { fontSize: TextSizes.caption, color: '#E0072B', marginTop: Spacing.xs, fontWeight: FontWeights.semibold },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: TextSizes.micro, fontWeight: FontWeights.extrabold, letterSpacing: 0.3 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: TextSizes.h2, fontWeight: FontWeights.black },
  sectionSubtitle: { fontSize: TextSizes.caption, marginTop: Spacing.xs },
  seeAll: { fontSize: TextSizes.caption, fontWeight: FontWeights.bold },

  statCard: {
    padding: Spacing.lg,
    borderRadius: Radii.lg,
  },
  statIcon: { marginBottom: Spacing.sm },
  statValue: { fontSize: TextSizes.h2, fontWeight: FontWeights.black, marginTop: Spacing.xs },
  statLabel: { fontSize: TextSizes.caption, marginTop: Spacing.xs, fontWeight: FontWeights.semibold },
  statSub: { fontSize: TextSizes.micro, marginTop: Spacing.xs },

  menuRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: { width: 38, height: 38, borderRadius: Radii.md, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: TextSizes.body, fontWeight: FontWeights.semibold, flex: 1 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: TextSizes.caption, fontWeight: FontWeights.bold },

  empty: { alignItems: 'center', justifyContent: 'center', padding: Spacing.xxl, gap: Spacing.sm },
  emptyIcon: { marginBottom: Spacing.sm },
  emptyTitle: { fontSize: TextSizes.h3, fontWeight: FontWeights.extrabold, textAlign: 'center' },
  emptyMessage: { fontSize: TextSizes.caption, textAlign: 'center', lineHeight: 20 },
});
