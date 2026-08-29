import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const CODE_LENGTH = 6;

export function SignupOtpFields({ onComplete, initialCode }: { onComplete?: (code: string) => void; initialCode?: string }) {
  const [code, setCode] = useState(() => {
    if (!initialCode) return Array(CODE_LENGTH).fill('');
    const digits = initialCode.replace(/\D/g, '').slice(0, CODE_LENGTH).split('');
    return Array.from({ length: CODE_LENGTH }, (_, i) => digits[i] ?? '');
  });
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputs = useRef<Array<TextInput | null>>([]);
  const completedRef = useRef(false);

  // Pas d'effet dédié "auto-soumettre" ici : quand initialCode est un code complet (otp_dev), le
  // state code[] en est déjà rempli dès le premier rendu (voir useState ci-dessus), donc l'effet de
  // complétion normal juste en dessous se déclenche déjà tout seul au montage. Un second effet
  // séparé faisait doublon et déclenchait deux appels onComplete() quasi simultanés avec le même
  // code — la 2e vérification arrivait après que le serveur ait déjà marqué le code "utilise" et
  // renvoyait donc "Code invalide" même quand la 1re avait réussi.

  useEffect(() => {
    completedRef.current = false;
  }, [code]);

  const setDigits = useCallback((value: string, index: number) => {
    const digits = value.replace(/\D/g, '');
    const next = [...code];
    digits.slice(0, CODE_LENGTH - index).split('').forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    if (!digits) next[index] = '';
    setCode(next);
    const nextIndex = Math.min(index + Math.max(digits.length, 1), CODE_LENGTH - 1);
    if (digits && nextIndex < CODE_LENGTH) {
      inputs.current[nextIndex]?.focus();
    }
  }, [code]);

  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === CODE_LENGTH && onComplete && !completedRef.current) {
      completedRef.current = true;
      onComplete(fullCode);
    }
  }, [code, onComplete]);


  const handleKeyPress = useCallback((key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      const next = [...code];
      next[index - 1] = '';
      setCode(next);
      inputs.current[index - 1]?.focus();
    }
  }, [code]);

  return (
    <View style={styles.row}>
      {code.map((digit, index) => (
        <TextInput
          key={index}
          ref={(input) => { inputs.current[index] = input; }}
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
            styles.input,
            focusedIndex === index && styles.inputActive,
            digit !== '' && styles.inputFilled,
          ]}
          textContentType="oneTimeCode"
          value={digit}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 20 },
  input: {
    width: 46,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#E1E6EF',
    borderRadius: 10,
    textAlign: 'center',
    color: '#0D347C',
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
  },
  inputActive: { borderColor: '#4C93ED', borderWidth: 2 },
  inputFilled: { borderColor: '#0D347C' },
});
