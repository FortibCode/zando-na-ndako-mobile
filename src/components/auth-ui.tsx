import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { BrandColors } from '@/constants/brand';
import { PremiumPressable } from '@/components/premium-ui';
import { Palette } from '@/design/tokens';

const logo = require('@/assets/images/zando-logo.jpeg');

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#34A853', '#FBBC05'] as const;

export const authStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Palette.canvas },
  screenMuted: { flex: 1, backgroundColor: Palette.canvas },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 36 },
  contentCentered: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    backgroundColor: BrandColors.white,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderWidth: 1,
    borderColor: Palette.border,
    shadowColor: BrandColors.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
screenTitle: {
    color: BrandColors.orange,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  screenDescription: {
    color: BrandColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
  },
  fieldLabel: {
    color: BrandColors.textDark,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 6,
  },
  inputWrap: {
    minHeight: 52,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.inputBg,
  },
  inputWrapFocused: {
    borderColor: BrandColors.borderFocus,
    backgroundColor: BrandColors.white,
    shadowColor: BrandColors.borderFocus,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputWrapError: {
    borderColor: BrandColors.red,
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: BrandColors.textDark,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    padding: 14,
    backgroundColor: BrandColors.orange,
    shadowColor: BrandColors.orange,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: BrandColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  accountText: {
    color: BrandColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 22,
  },
  accountLink: {
    color: BrandColors.blueBright,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});

export function AuthBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      contentFit="contain"
      source={logo}
      style={compact ? styles.brandCompact : styles.brand}
    />
  );
}

export function BackButton() {
  return (
    <Pressable
      accessibilityLabel="Retour"
      accessibilityRole="button"
      hitSlop={12}
      onPress={() => router.back()}
      style={styles.backButton}
    >
      <View style={styles.backIconBadge}>
        <Ionicons color={BrandColors.blue} name="arrow-back" size={18} />
      </View>
      <Text style={styles.backText}>Retour</Text>
    </Pressable>
  );
}

export function GoogleButton({ onPress }: { onPress: () => void }) {
  return (
    <PremiumPressable accessibilityLabel="Se connecter avec Google" onPress={onPress} style={styles.googleButton}>
      <GoogleLogo size={26} />
      <Text style={styles.googleText}>Se connecter avec Google</Text>
    </PremiumPressable>
  );
}

type GoogleAccount = {
  email: string;
  name: string;
  avatar: string;
};

const GOOGLE_G_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.13-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`
)}`;

export function GoogleLogo({ size = 28 }: { size?: number }) {
  return (
    <Image
      contentFit="contain"
      source={{ uri: GOOGLE_G_SVG }}
      style={{ width: size, height: size }}
    />
  );
}

export function GoogleAccountPicker({
  visible,
  onSelect,
  onClose,
  accounts = [],
}: {
  visible: boolean;
  onSelect: (email: string) => void;
  onClose: () => void;
  accounts?: GoogleAccount[];
}) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={googlePickerStyles.overlay} onPress={onClose}>
        <Pressable style={googlePickerStyles.sheet} onPress={() => {}}>
          <View style={googlePickerStyles.handle} />
          <Text style={googlePickerStyles.title}>Sélectionner un compte</Text>
          {accounts.map((acc) => (
            <Pressable
              key={acc.email}
              style={googlePickerStyles.accountRow}
              onPress={() => {
                onSelect(acc.email);
                onClose();
              }}
            >
              <View style={googlePickerStyles.avatar}>
                {GOOGLE_COLORS.map((color, i) => (
                  <View
                    key={color}
                    style={{
                      position: 'absolute',
                      top: i < 2 ? 0 : '50%',
                      left: i % 2 === 0 ? 0 : '50%',
                      width: '50%',
                      height: '50%',
                      backgroundColor: color,
                    }}
                  />
                ))}
                <Text style={googlePickerStyles.avatarText}>{acc.avatar}</Text>
              </View>
              <View style={googlePickerStyles.accountInfo}>
                <Text style={googlePickerStyles.accountName}>{acc.name}</Text>
                <Text style={googlePickerStyles.accountEmail}>{acc.email}</Text>
              </View>
              <Ionicons color="#9CA3AF" name="chevron-forward" size={18} />
            </Pressable>
          ))}
          <Pressable style={googlePickerStyles.addButton} onPress={onClose}>
            <Ionicons color="#4285F4" name="person-add-outline" size={20} />
            <Text style={googlePickerStyles.addText}>Ajouter un autre compte</Text>
          </Pressable>
          <Pressable style={googlePickerStyles.cancelButton} onPress={onClose}>
            <Text style={googlePickerStyles.cancelText}>Annuler</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function SecurityNote() {
  return (
    <View style={styles.securityNote}>
      <Ionicons color="#64748B" name="shield-checkmark-sharp" size={14} />
      <Text style={styles.securityText}>Connexion et données 100% sécurisées</Text>
    </View>
  );
}

/** Composant Champ de Saisie Professionnel avec Label, Icône et État Focus */
export interface InputFieldProps extends TextInputProps {
  label?: string;
  required?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
}

export function InputField({
  label,
  required,
  icon,
  error,
  helperText,
  isPassword,
  secureTextEntry,
  style,
  onFocus,
  onBlur,
  ...props
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.fieldContainer}>
      {Boolean(label) && (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
      )}
      <View
        style={[
          authStyles.inputWrap,
          isFocused && authStyles.inputWrapFocused,
          Boolean(error) && authStyles.inputWrapError,
        ]}
      >
        {Boolean(icon) && (
          <Ionicons
            color={error ? BrandColors.red : isFocused ? BrandColors.blueBright : BrandColors.textMuted}
            name={icon}
            size={20}
          />
        )}
        <TextInput
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          style={[authStyles.input, style]}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
        />
        {isPassword && (
          <Pressable hitSlop={10} onPress={() => setShowPassword((prev) => !prev)}>
            <Ionicons
              color={BrandColors.textMuted}
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
            />
          </Pressable>
        )}
      </View>
      {Boolean(error) ? (
        <View style={styles.errorRow}>
          <Ionicons color={BrandColors.red} name="alert-circle-outline" size={13} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : Boolean(helperText) ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

/** Bouton Principal Premium avec état de chargement */
export function PrimaryButton({
  title,
  loading = false,
  disabled = false,
  onPress,
  icon,
}: {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <PremiumPressable
      disabled={disabled || loading}
      onPress={onPress}
      style={[authStyles.primaryButton, (disabled || loading) && authStyles.primaryButtonDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={BrandColors.white} size="small" />
      ) : (
        <>
          <Text style={authStyles.primaryButtonText}>{title}</Text>
          {Boolean(icon) && <Ionicons color={BrandColors.white} name={icon} size={18} />}
        </>
      )}
    </PremiumPressable>
  );
}

/** Barre de Progression des Étapes avec pastilles numérotées */
export function StepProgress({
  currentStep,
  totalSteps,
  stepTitles,
}: {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
}) {
  return (
    <View style={styles.stepProgressContainer}>
      <View style={styles.stepBadgesRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <View key={stepNum} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  isDone && styles.stepBadgeDone,
                  isCurrent && styles.stepBadgeCurrent,
                ]}
              >
                {isDone ? (
                  <Ionicons color={BrandColors.white} name="checkmark" size={14} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumberText,
                      isCurrent && styles.stepNumberCurrentText,
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              {stepTitles && stepTitles[i] && (
                <Text
                  style={[
                    styles.stepTitleText,
                    isCurrent && styles.stepTitleCurrentText,
                  ]}
                >
                  {stepTitles[i]}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      {/* Connector line background */}
      <View style={styles.stepLineBg}>
        <View
          style={[
            styles.stepLineFill,
            { width: `${((currentStep - 1) / Math.max(totalSteps - 1, 1)) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

export function OtpFields({
  onComplete,
  onChangeCode,
  initialCode,
}: {
  onComplete?: (code: string) => void;
  onChangeCode?: (code: string) => void;
  initialCode?: string;
}) {
  const [code, setCode] = useState(() => {
    if (!initialCode) return ['', '', '', '', '', ''];
    const digits = initialCode.replace(/\D/g, '').slice(0, 6).split('');
    return Array.from({ length: 6 }, (_, i) => digits[i] ?? '');
  });
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
  }, [code]);

  const setDigits = useCallback(
    (value: string, index: number) => {
      const digits = value.replace(/\D/g, '');
      const next = [...code];
      digits
        .slice(0, code.length - index)
        .split('')
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });
      if (!digits) next[index] = '';
      setCode(next);
      const nextIndex = Math.min(index + Math.max(digits.length, 1), code.length - 1);
      if (digits && nextIndex < code.length) {
        inputs.current[nextIndex]?.focus();
      }
    },
    [code],
  );

  useEffect(() => {
    const fullCode = code.join('');
    onChangeCode?.(fullCode);
    if (fullCode.length === 6 && onComplete && !completedRef.current) {
      completedRef.current = true;
      onComplete(fullCode);
    }
  }, [code, onComplete, onChangeCode]);

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !code[index] && index > 0) {
        const next = [...code];
        next[index - 1] = '';
        setCode(next);
        inputs.current[index - 1]?.focus();
      }
    },
    [code],
  );

  return (
    <View style={styles.otpRow}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(input) => {
            inputs.current[index] = input;
          }}
          autoFocus={index === 0}
          editable
          inputMode="numeric"
          keyboardType="number-pad"
          maxLength={1}
          onBlur={() => setFocusedIndex(-1)}
          onChangeText={(value) => setDigits(value, index)}
          onFocus={() => setFocusedIndex(index)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
          selectTextOnFocus
          style={[
            styles.otpInput,
            focusedIndex === index && styles.otpInputActive,
            digit !== '' && styles.otpInputFilled,
          ]}
          textContentType="oneTimeCode"
          value={digit}
        />
      ))}
    </View>
  );
}

export function OtpTimerBanner({ seconds }: { seconds: number }) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');

  return (
    <View style={styles.timerBanner}>
      <Ionicons color={BrandColors.blueBright} name="time-outline" size={18} />
      <Text style={styles.timerText}>
        Code valide pendant encore{' '}
        <Text style={styles.timerAccent}>
          {m}:{s}
        </Text>
      </Text>
    </View>
  );
}

type OtpVerificationLayoutProps = {
  illustration: ImageSourcePropType;
  accentLabel: string;
  description: ReactNode;
  recipient?: string;
  resendTimer: number;
  canResend: boolean;
  verifying: boolean;
  onResend: () => void;
  onVerify?: () => void;
  onComplete: (code: string) => void;
  initialCode?: string;
};

export function OtpVerificationLayout({
  illustration,
  accentLabel,
  description,
  initialCode,
  recipient,
  resendTimer,
  canResend,
  verifying,
  onResend,
  onVerify,
  onComplete,
}: OtpVerificationLayoutProps) {
  const [currentCode, setCurrentCode] = useState(initialCode ?? '');

  const handleVerifyPress = () => {
    onComplete(currentCode);
    if (onVerify) {
      onVerify();
    }
  };

  return (
    <>
      <BackButton />
      <AuthBrand compact />
      <Image contentFit="contain" source={illustration} style={styles.otpIllustration} />
      <Text style={styles.otpTitle}>
        Confirmez votre{'\n'}
        <Text style={styles.otpTitleAccent}>{accentLabel}</Text>
      </Text>
      <Text style={styles.otpDescription}>{description}</Text>
      <OtpFields initialCode={initialCode} onChangeCode={setCurrentCode} onComplete={onComplete} />
      <OtpTimerBanner seconds={resendTimer} />
      <Text style={styles.resendPrompt}>Vous n&apos;avez pas reçu le code ?</Text>
      {canResend ? (
        <Pressable accessibilityRole="button" onPress={onResend}>
          <Text style={styles.resendLink}>Renvoyer le code</Text>
        </Pressable>
      ) : (
        <Text style={styles.resendWaiting}>Renvoyer le code</Text>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={handleVerifyPress}
        style={[styles.verifyButton, verifying && styles.verifyButtonActive]}
      >
        <Text style={styles.verifyButtonText}>{verifying ? 'Vérification…' : 'Vérifier le code'}</Text>
      </Pressable>
      <SecurityNote />
    </>
  );
}

const googlePickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 14,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: BrandColors.blue,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 20,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '800', zIndex: 1 },
  accountInfo: { flex: 1, marginLeft: 14 },
  accountName: { color: '#0F172A', fontSize: 15, fontWeight: '600' },
  accountEmail: { color: '#64748B', fontSize: 13, marginTop: 2 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4285F4',
    borderStyle: 'dashed',
  },
  addText: { color: '#4285F4', fontSize: 14, fontWeight: '600' },
  cancelButton: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
});

const styles = StyleSheet.create({
  brand: { width: 190, height: 158, alignSelf: 'center', marginBottom: 8 },
  brandCompact: { width: 150, height: 88, alignSelf: 'center', marginTop: 6, marginBottom: 4 },
  backButton: { height: 40, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  backIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: BrandColors.blue, fontSize: 15, fontWeight: '600' },
  googleButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 14,
    backgroundColor: BrandColors.white,
  },
  googleText: { color: BrandColors.textDark, fontSize: 15, fontWeight: '700' },
  fieldContainer: {
    marginTop: 16,
    width: '100%',
  },
  label: {
    color: BrandColors.textDark,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  requiredStar: {
    color: BrandColors.red,
    fontWeight: '800',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    color: BrandColors.red,
    fontSize: 12,
    fontWeight: '600',
  },
  helperText: {
    color: BrandColors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  stepProgressContainer: {
    marginVertical: 18,
    width: '100%',
  },
  stepBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeCurrent: {
    backgroundColor: BrandColors.blueBright,
    borderWidth: 3,
    borderColor: '#DBEAFE',
  },
  stepBadgeDone: {
    backgroundColor: BrandColors.blue,
  },
  stepNumberText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  stepNumberCurrentText: {
    color: BrandColors.white,
  },
  stepTitleText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  stepTitleCurrentText: {
    color: BrandColors.blue,
    fontWeight: '700',
  },
  stepLineBg: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  stepLineFill: {
    height: '100%',
    backgroundColor: BrandColors.blue,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  securityText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 8,
    marginTop: 18,
  },
otpInput: {
    width: 48,
    height: 56,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    textAlign: 'center',
    color: BrandColors.orange,
    fontSize: 22,
    fontWeight: '800',
    backgroundColor: BrandColors.white,
    paddingHorizontal: 0,
  },
  otpInputActive: { borderColor: BrandColors.orange, borderWidth: 2.2, backgroundColor: BrandColors.orangeSoft },
  otpInputFilled: { borderColor: BrandColors.orange, borderWidth: 1.8 },
  timerBanner: {
    width: '100%',
    minHeight: 46,
    borderRadius: 12,
    marginTop: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
  },
  timerText: { color: '#334155', fontSize: 13, fontWeight: '600' },
  timerAccent: { color: BrandColors.red, fontWeight: '800' },
  otpIllustration: { width: 250, height: 145, alignSelf: 'center', marginTop: 8 },
  otpTitle: {
    marginTop: 16,
    color: BrandColors.blue,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
  },
  otpTitleAccent: { color: BrandColors.red },
  otpDescription: {
    marginTop: 14,
    color: '#475569',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  resendPrompt: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
  resendLink: {
    color: BrandColors.blueBright,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  resendWaiting: {
    color: BrandColors.blueBright,
    fontWeight: '800',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.45,
    marginTop: 4,
  },
  verifyButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: BrandColors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: BrandColors.orange,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  verifyButtonActive: { opacity: 0.7 },
  verifyButtonText: { color: BrandColors.white, fontSize: 16, fontWeight: '800' },
});
