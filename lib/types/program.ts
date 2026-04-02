export type ProgramStatus = "active" | "paused" | "closed" | "redesigning";
export type EOIType = "points_ranked" | "first_come" | "intake_period" | "hybrid" | "none";
export type ProgramCategory = "main" | "regional" | "graduate" | "farm" | "strategic" | "federal";

export interface ProgramDefinition {
  id: string;
  provinceCode: string;
  provinceName: string;
  streamName: string;
  streamSlug: string;
  category: ProgramCategory;
  status: ProgramStatus;
  statusNote: string | null;
  statusChangedAt: string;
  eoiType: EOIType;
  hasPointsGrid: boolean;
  officialUrl: string;
  drawPageUrl: string | null;
  requirements: ProgramRequirements;
  pointsGrid: PointsGrid | null;
  lastVerifiedAt: string;
  sourceVersion: number;
  notes: string[];
}

export interface ProgramRequirements {
  minNetWorth: number | null;
  minInvestment: number | null;
  minInvestmentRegional: number | null;
  minCLB: number | null;
  minAge: number | null;
  maxAge: number | null;
  minBusinessExperienceYears: number | null;
  businessExperienceType: ("owner" | "senior_manager" | "either")[];
  minOwnershipPercent: number | null;
  minEducation: string | null;
  minJobCreation: number | null;
  requiresExploratoryVisit: boolean;
  requiresCommunityReferral: boolean;
  requiresLocalDegree: boolean;
  requiresPGWP: boolean;
  requiresBusinessPlan: boolean;
  requiresInterview: boolean;
  requiresNetWorthVerification: boolean;
  restrictedIndustries: string[];
  additionalConstraints: Record<string, string>;
}

export interface PointsGrid {
  maxScore: number;
  minScoreRequired: number | null;
  categories: PointsCategory[];
}

export interface PointsCategory {
  name: string;
  maxPoints: number;
  minRequired: number | null;
  factors: PointsFactor[];
}

export interface PointsFactor {
  name: string;
  maxPoints: number;
  scoringRules: ScoringRule[];
}

export interface ScoringRule {
  condition: Record<string, unknown>;
  points: number;
  label: string;
}
