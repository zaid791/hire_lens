export const TIER_LIMITS = {
  base: 4,
  premium: 100,
} as const;

export type SubscriptionTier = keyof typeof TIER_LIMITS;

export interface QuotaSnapshot {
  tier: SubscriptionTier;
  limit: number;
  requestsToday: number;
  remaining: number;
}

export function computeQuota(data: {
  subscriptionTier?: string;
  requestsToday?: number;
  lastRequestDate?: string;
}): QuotaSnapshot {
  const todayStr = new Date().toISOString().split('T')[0];
  const tier: SubscriptionTier =
    data.subscriptionTier === 'premium' ? 'premium' : 'base';
  const limit = TIER_LIMITS[tier];
  const requestsToday =
    data.lastRequestDate === todayStr ? (data.requestsToday ?? 0) : 0;

  return {
    tier,
    limit,
    requestsToday,
    remaining: Math.max(0, limit - requestsToday),
  };
}
