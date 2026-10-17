export const PAYOUT_FREQUENCIES = ["weekly", "biweekly", "monthly"] as const;
export type PayoutFrequency = (typeof PAYOUT_FREQUENCIES)[number];

export const payoutFrequencyLabels: Record<PayoutFrequency, string> = {
  weekly: "Еднаш неделно",
  biweekly: "На две недели",
  monthly: "Еднаш месечно",
};
