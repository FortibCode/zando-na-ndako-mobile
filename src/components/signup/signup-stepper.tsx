import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '@/constants/brand';

type SignupStepperProps = {
  currentStep: 1 | 2 | 3;
  titles?: [string, string, string];
};

export function SignupStepper({ currentStep, titles }: SignupStepperProps) {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {[1, 2, 3].map((step, index) => {
          const isDone = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <View key={step} style={styles.stepGroup}>
              {index > 0 && (
                <View style={[styles.line, step <= currentStep && styles.lineActive]} />
              )}
              <View
                style={[
                  styles.circle,
                  isDone && styles.circleDone,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isDone ? (
                  <Ionicons color={BrandColors.white} name="checkmark" size={16} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isCurrent && styles.circleTextCurrent,
                    ]}
                  >
                    {step}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
      {titles && (
        <View style={styles.titlesRow}>
          {titles.map((title, i) => (
            <Text
              key={title}
              style={[
                styles.stepTitle,
                i + 1 === currentStep && styles.stepTitleCurrent,
              ]}
            >
              {title}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 20, marginTop: 4 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepGroup: { flexDirection: 'row', alignItems: 'center' },
  line: { width: 56, height: 3, backgroundColor: '#E2E8F0', marginHorizontal: 4, borderRadius: 2 },
  lineActive: { backgroundColor: BrandColors.blueBright },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCurrent: {
    backgroundColor: BrandColors.blueBright,
    borderColor: '#DBEAFE',
    borderWidth: 3,
    shadowColor: BrandColors.blueBright,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  circleDone: {
    backgroundColor: BrandColors.blue,
    borderColor: BrandColors.blue,
  },
  circleText: { fontSize: 14, fontWeight: '800', color: '#64748B' },
  circleTextCurrent: { color: BrandColors.white },
  titlesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 4 },
  stepTitle: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  stepTitleCurrent: { color: BrandColors.blue, fontWeight: '800' },
});
