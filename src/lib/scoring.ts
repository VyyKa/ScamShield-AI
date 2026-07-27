/**
 * Fusion confidence score cho ScamRecord (0–100).
 * Gọi lại mỗi khi có report / vote / moderation.
 */

export type EntityScoreInput = {
  reportCount: number;
  confirmCount: number;
  disputeCount: number;
  status: string;
  /** true nếu khớp URLhaus / Safe Browsing / partner feed */
  hasExternalThreatHit?: boolean;
};

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export function computeConfidenceScore(input: EntityScoreInput): number {
  let score = 0;

  // Reports: diminishing returns
  score += Math.min(40, input.reportCount * 12);

  // Community confirms
  score += Math.min(25, input.confirmCount * 8);

  // Disputes giảm điểm
  score -= Math.min(30, input.disputeCount * 10);

  if (input.hasExternalThreatHit) score += 25;

  if (input.status === 'VERIFIED') score = Math.max(score, 70);
  if (input.status === 'DISPUTED') score = Math.min(score, 45);
  if (input.status === 'ARCHIVED') score = Math.min(score, 20);
  if (input.status === 'UNDER_REVIEW') score = Math.min(score, 55);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function riskLevelFromConfidence(confidence: number, status: string): RiskLevel {
  if (status === 'VERIFIED' && confidence >= 75) return 'CRITICAL';
  if (confidence >= 80) return 'CRITICAL';
  if (confidence >= 55) return 'HIGH';
  if (confidence >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Auto-promote status khi đủ tín hiệu (trước khi có mod).
 * - ≥3 report độc lập → vẫn UNDER_REVIEW (cần mod) nhưng confidence cao
 * - ≥5 report + confirm ≥2 → gợi ý VERIFIED (rule optional)
 */
export function suggestStatus(input: EntityScoreInput): string {
  if (input.status === 'ARCHIVED' || input.status === 'DISPUTED') {
    return input.status;
  }
  if (input.status === 'VERIFIED') return 'VERIFIED';

  if (input.hasExternalThreatHit && input.reportCount >= 1) {
    return 'VERIFIED';
  }
  if (input.reportCount >= 5 && input.confirmCount >= 2 && input.disputeCount === 0) {
    return 'VERIFIED';
  }
  if (input.disputeCount >= 3 && input.disputeCount > input.confirmCount) {
    return 'DISPUTED';
  }
  return 'UNDER_REVIEW';
}
