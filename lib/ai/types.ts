export interface ProgramAnalysis {
  programId: string
  narrative: string
  strategicFit: 'strong' | 'moderate' | 'weak'
  risks: string[]
  timeline: string
}

export interface RoadmapPhase {
  phase: string
  actions: string[]
}

export interface ImprovementPriority {
  field: string
  recommendation: string
  effort: 'low' | 'medium' | 'high'
  impact: string
}

export interface IneligibilityInsight {
  programId: string
  barriers: string[]
  feasibility: 'achievable' | 'difficult' | 'impractical'
  suggestion: string
}

export interface AIAnalysis {
  executiveSummary: string
  programAnalyses: ProgramAnalysis[]
  ineligibilityInsights: IneligibilityInsight[]
  strategicRoadmap: RoadmapPhase[]
  improvementPriorities: ImprovementPriority[]
  riskFactors: string[]
  generatedAt: string
  modelUsed: string
}
