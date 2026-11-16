export const plans = {
  solo: { price: 99, projects: 2, members: 1, receipts: 10 },
  studio: { price: 249, projects: 8, members: 5, receipts: 50 },
  agency: {
    price: 499,
    projects: 25,
    members: 15,
    receipts: Number.POSITIVE_INFINITY,
  },
  partner: {
    price: 999,
    projects: 75,
    members: 40,
    receipts: Number.POSITIVE_INFINITY,
  },
} as const;

export type PlanName = keyof typeof plans;
export function withinLimit(
  plan: PlanName,
  metric: "projects" | "members" | "receipts",
  current: number,
): boolean {
  return current < plans[plan][metric];
}

export const mrrExample = {
  accounts: 21,
  plan: "Agency",
  monthlyPrice: 499,
  total: 21 * 499,
} as const;
