import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@/constants/brand';
import { CountryInfo, DEFAULT_COUNTRY, getCountryByLabel } from '@/constants/countries';

interface PhoneInputProps {
  label?: string;
  country?: CountryInfo | string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  onCountryPress?: () => void;
  showCountrySelectIcon?: boolean;
}

export function PhoneInput({
  label = 'Numéro de téléphone',
  country,
  value,
  onChangeText,
  error,
  placeholder,
  disabled = false,
  required = false,
  onCountryPress,
  showCountrySelectIcon = false,
}: PhoneInputProps) {
  // Resolve country info
  const countryObj: CountryInfo = React.useMemo(() => {
    if (!country) return DEFAULT_COUNTRY;
    if (typeof country === 'string') return getCountryByLabel(country);
    return country;
  }, [country]);

  // Clean value (only digits)
  const cleanDigits = value.replace(/\D/g, '');
  const { max: maxDigits } = countryObj.digitLength;

  const handleChangeText = (text: string) => {
    // Only keep numeric digits and limit to max allowed for country
    const digitsOnly = text.replace(/\D/g, '').slice(0, maxDigits);
    onChangeText(digitsOnly);
  };

  const defaultPlaceholder = placeholder || countryObj.example || '06 123 45 67';

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label}>
          {label} {required && <Text style={styles.requiredStar}>*</Text>}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          error ? styles.inputRowError : null,
          disabled ? styles.inputRowDisabled : null,
        ]}
      >
        {/* Country Badge (Locked Code + Flag) */}
        <TouchableOpacity
          style={styles.countryBadge}
          onPress={onCountryPress}
          disabled={!onCountryPress || disabled}
          activeOpacity={onCountryPress ? 0.7 : 1}
        >
          <Text style={styles.flagEmoji}>{countryObj.flag}</Text>
          <Text style={styles.dialCode}>{countryObj.dialCode}</Text>
          {showCountrySelectIcon && (
            <Ionicons name="chevron-down" size={14} color={BrandColors.textSubtle} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Numeric Input Field */}
        <TextInput
          style={styles.textInput}
          value={cleanDigits}
          onChangeText={handleChangeText}
          keyboardType="phone-pad"
          placeholder={defaultPlaceholder}
          placeholderTextColor={BrandColors.textMuted}
          editable={!disabled}
          maxLength={maxDigits}
        />

        {/* Digits Counter Indicator */}
        {cleanDigits.length > 0 && (
          <View style={styles.counterBadge}>
            <Text
              style={[
                styles.counterText,
                cleanDigits.length === maxDigits ? styles.counterTextSuccess : null,
              ]}
            >
              {cleanDigits.length}/{maxDigits}
            </Text>
          </View>
        )}
      </View>

      {/* Country description hint if diaspora */}
      <Text style={styles.hintText}>
        Indicatif {countryObj.label} ({countryObj.dialCode}) verrouillé automatiquement.
      </Text>

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={14} color={BrandColors.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.textDark,
    marginBottom: 6,
  },
  requiredStar: {
    color: BrandColors.red,
    fontWeight: '800',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.inputBg,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    paddingHorizontal: 12,
    height: 52,
  },
  inputRowError: {
    borderColor: BrandColors.red,
    backgroundColor: '#FFF5F5',
  },
  inputRowDisabled: {
    backgroundColor: '#F0F2F1',
    borderColor: '#E0E0E0',
    opacity: 0.7,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    paddingLeft: 4,
    height: '100%',
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandColors.blue,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: BrandColors.textDark,
    fontWeight: '500',
    paddingVertical: 0,
    letterSpacing: 0.5,
  },
  counterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#EAEAEA',
    marginLeft: 4,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '600',
    color: BrandColors.textMuted,
  },
  counterTextSuccess: {
    color: BrandColors.blue,
    fontWeight: '700',
  },
  hintText: {
    fontSize: 11,
    color: BrandColors.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: BrandColors.red,
    fontWeight: '600',
  },
});
