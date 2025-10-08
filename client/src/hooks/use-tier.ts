import { useQuery } from '@tanstack/react-query';
import { hasFeature, getFeatureLimit, TIER_NAMES, TIER_PRICES, type PlanTier, type TierFeatures } from '@shared/tier-features';

interface UserData {
  user: any;
  profile: any;
  subscription: {
    planType: PlanTier;
    status: string;
  } | null;
}

export function useTier() {
  const { data, isLoading } = useQuery<UserData>({
    queryKey: ['/api/me'],
  });

  const currentTier = data?.subscription?.planType;
  const tierName = currentTier ? TIER_NAMES[currentTier] : 'Free';
  const tierPrice = currentTier ? TIER_PRICES[currentTier] : 0;

  return {
    tier: currentTier,
    tierName,
    tierPrice,
    isLoading,
    hasFeature: (feature: keyof TierFeatures) => hasFeature(currentTier, feature),
    getLimit: (limit: keyof TierFeatures) => getFeatureLimit(currentTier, limit),
  };
}
