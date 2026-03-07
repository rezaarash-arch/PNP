export interface ScoreBreakdown {
  category: string;
  factor: string;
  points: number;
  maxPoints: number;
  explanation: string;
}

export interface Disqualifier {
  requirement: string;
  userValue: string;
  requiredValue: string;
  explanation: string;
  fixable: boolean;
  fixSuggestion: string | null;
}

export interface NearMiss {
  requirement: string;
  gap: string;
  effort: "low" | "medium" | "high";
  suggestion: string;
}

export type EligibilityResult = {
  eligible: true;
  score: number | null;
  maxScore: number | null;
  breakdown: ScoreBreakdown[];
  meetsMinScore: boolean;
} | {
  eligible: false;
  disqualifiers: Disqualifier[];
  nearMisses: NearMiss[];
};

export interface ProbabilityEstimate {
  percent: number;
  confidence: "low" | "moderate" | "high";
  range: [number, number];
  tier: "strong" | "competitive" | "moderate" | "low" | "unlikely" | "ineligible";
  explanation: string;
  caveats: string[];
  dataPoints: number;
  lastDrawDate: string | null;
}

export interface SensitivityAnalysis {
  factor: string;
  currentValue: string;
  improvedValue: string;
  scoreChange: number;
  probabilityChange: number;
  effort: "low" | "medium" | "high";
  description: string;
}

export interface ProgramResult {
  programId: string;
  eligibility: EligibilityResult;
  probability: ProbabilityEstimate;
  sensitivity: SensitivityAnalysis[];
}
