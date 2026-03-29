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

export interface AIAnalysis {
  executiveSummary: string
  programAnalyses: ProgramAnalysis[]
  strategicRoadmap: RoadmapPhase[]
  improvementPriorities: ImprovementPriority[]
  riskFactors: string[]
  generatedAt: string
  modelUsed: string
}
