import { OnboardingScreen } from '@/components/onboarding-screen';

const artwork = require('@/assets/images/onboarding-delivery.png');

export default function FirstOnboardingScreen() {
  return (
    <OnboardingScreen
      accentTitle="vient chez vous."
      activeStep={1}
      artwork={artwork}
      description="Passez vos commandes en toute simplicité et faites-vous livrer les meilleurs produits directement à domicile."
      nextRoute="/onboarding/second"
      title="Le marché"
    />
  );
}
