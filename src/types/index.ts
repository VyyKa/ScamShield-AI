export type ScanSubMode = 'fake_bill' | 'shipper_cross' | 'physical_poster' | 'zalo_chat';

export interface ScanResult {
  isScam: boolean;
  riskScore: number; // 0 to 100
  redFlags: string[];
  analysisDetails: string;
  recommendedAction: string;
}

export type TrollPersonaId = 'Grandma_70' | 'Naive_Student' | (string & {});

export interface PersonaDetails {
  id: TrollPersonaId;
  name: string;
  age: string;
  role: string;
  avatar: string;
  description: string;
  trollStrategy: string;
}

export interface TrollMessage {
  id: string;
  sender: 'scammer' | 'bot';
  text: string;
  timestamp: string;
}

export interface TrollStats {
  timeWastedMins: number;
  explanationsForced: number;
  patienceLevel: number; // 0-100%
  frustrationLevel: number; // 1-10
}

export interface TrollResponse {
  botReply: string;
  scammerFrustrationLevel: number; // 1-10
  timeWastedIncrement: number; // in minutes
}

export type HoneyTokenType = 'bank_bill' | 'id_card' | 'qr_canary' | string;

export interface HoneyTokenData {
  id: string;
  type: HoneyTokenType;
  targetName: string;
  bankOrOrg: string;
  accountOrId: string;
  amountOrPayload: string;
  canaryToken: string;
  watermarkText: string;
  createdAt: string;
  ipTrapUrl: string;
}

export interface DeepfakeChallengeResult {
  challenges: string[];
  forensicTips: string[];
  riskAssessment: string;
}

export interface ThreatSample {
  id: string;
  title: string;
  subMode: ScanSubMode;
  description: string;
  sampleText: string;
  sampleImageUrl?: string;
  mockResult: ScanResult;
}

export type ScamCategory = 'bank_account' | 'phone_number' | 'zalo_account' | 'phishing_website';

export type ScamEntityStatus = 'UNDER_REVIEW' | 'VERIFIED' | 'DISPUTED' | 'ARCHIVED';
export type ScamRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type VoteType = 'CONFIRM' | 'DISPUTE' | 'UPVOTE';
export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN';

export interface ScamRecord {
  id: string;
  category: ScamCategory;
  targetValue: string;
  targetNormalized?: string;
  ownerName?: string;
  bankName?: string;
  scamType: string;
  riskLevel: ScamRiskLevel | 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reportCount: number;
  confirmCount?: number;
  disputeCount?: number;
  confidenceScore?: number;
  lastReported: string;
  lastReportedAt?: string | Date;
  description: string;
  /** New: UNDER_REVIEW | VERIFIED | … — legacy UI may still use VERIFIED_SCAM */
  status: ScamEntityStatus | 'VERIFIED_SCAM' | 'UNDER_INVESTIGATION' | string;
  statusLegacy?: string;
}

export interface EmergencyHotline {
  name: string;
  number: string;
  description: string;
  icon: string;
  badge: string;
}
