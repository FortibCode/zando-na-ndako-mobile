import { OnboardingScreen } from '@/components/onboarding-screen';

const artwork = require('@/assets/images/onboarding-scooter.png');

export default function ThirdOnboardingScreen() {
  return (
    <OnboardingScreen
      accentTitle="et sécurisée"
      activeStep={3}
      artwork={artwork}
      description="Vos commandes sont préparées avec soin et livrées rapidement à vos proches à travers le Congo."
      nextRoute="/auth"
      title="Livraison rapide"
      variant="branded"
    />
  );
}
