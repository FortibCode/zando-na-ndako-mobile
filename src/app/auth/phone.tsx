import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBrand, BackButton, GoogleButton, PrimaryButton, authStyles } from '@/components/auth-ui';
import { BrandColors } from '@/constants/brand';

/** Saisie du numéro : première étape de la connexion par téléphone. */
export default function PhoneLoginScreen() {
  const [phone, setPhone] = useState('');
  const isValid = phone.replace(/\D/g, '').length >= 7;

  return (
    <SafeAreaView style={authStyles.screenMuted}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={authStyles.contentCentered}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />
          <AuthBrand />
          <View style={authStyles.card}>
            <Text style={authStyles.screenTitle}>Connexion par téléphone</Text>
            <Text style={authStyles.screenDescription}>
              Entrez votre numéro mobile pour recevoir un code de vérification sécurisé (OTP).
            </Text>

            <Text style={authStyles.fieldLabel}>Numéro de téléphone mobile</Text>
            <View style={styles.phoneInput}>
              <Text style={styles.flag}>🇨🇬</Text>
              <Ionicons color={BrandColors.blue} name="chevron-down" size={14} />
              <View style={styles.separator} />
              <Text style={styles.prefix}>+242</Text>
              <TextInput
                autoFocus
                editable
                keyboardType="phone-pad"
                onChangeText={(value) => setPhone(value.replace(/[^0-9 ]/g, ''))}
                placeholder="ex: 06 123 45 67"
                placeholderTextColor="#94A3B8"
                style={styles.phoneField}
                textContentType="telephoneNumber"
                value={phone}
              />
            </View>

            <PrimaryButton
              disabled={!isValid}
              icon="arrow-forward"
              onPress={() => router.push(`/auth/phone-otp?phone=${encodeURIComponent(`+242${phone.replace(/\D/g, '')}`)}`)}

              title="Recevoir le code OTP"
            />

            <View style={authStyles.dividerRow}>
              <View style={authStyles.divider} />
              <Text style={authStyles.dividerText}>OU</Text>
              <View style={authStyles.divider} />
            </View>

            <GoogleButton onPress={() => router.push('/auth/google-picker')} />
          </View>

          <Text style={authStyles.accountText}>
            Vous n'avez pas de compte ?{' '}
            <Text style={authStyles.accountLink} onPress={() => router.push('/auth/signup')}>
              Inscrivez-vous
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  phoneInput: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: BrandColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    backgroundColor: BrandColors.inputBg,
  },
  flag: { fontSize: 18, marginRight: 4 },
  separator: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  prefix: { color: BrandColors.blue, fontSize: 15, fontWeight: '800' },
  phoneField: {
    flex: 1,
    marginLeft: 10,
    color: BrandColors.textDark,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 12,
  },
});
