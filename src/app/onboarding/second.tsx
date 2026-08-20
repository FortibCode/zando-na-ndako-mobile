import { OnboardingScreen } from '@/components/onboarding-screen';
import { BrandColors } from '@/constants/brand';

const artwork = require('@/assets/images/onboarding-diaspora.png');

export default function SecondOnboardingScreen() {
  return (
    <OnboardingScreen
      accentColor={BrandColors.blue}
      accentTitle="depuis l'étranger"
      activeStep={2}
      artwork={artwork}
      description="Envoyez des courses à votre famille au Congo en quelques clics. Paiement sécurisé en € ou $."
      nextRoute="/onboarding/third"
      title="Aidez vos proches"
    />
  );
}
