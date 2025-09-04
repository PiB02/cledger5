/**
 * France Travail GPT-4o-mini Extraction Schema
 * Optimized for French job market specifics with robust validation
 */

import { z } from 'zod'

// French seniority mapping with confidence indicators
export const FrenchSeniorityMapping = {
  intern: ['stage', 'apprenti', 'stagiaire', 'alternant', 'débutant acceptable'],
  junior: ['débutant', 'junior', '0-2 ans', '1 an', '2 ans', 'peu d\'expérience'],
  mid: ['3-5 ans', 'expérimenté', 'confirmé', '3 ans', '4 ans', '5 ans'],
  senior: ['senior', 'expert', '5+ ans', '6 ans', '7+ ans', 'très expérimenté'],
  lead: ['chef équipe', 'responsable', 'lead', 'coordinateur', 'superviseur'],
  manager: ['manager', 'directeur', 'chef de service', 'responsable hiérarchique']
} as const

// French education to EQF mapping
export const FrenchEducationEQF = {
  3: ['CAP', 'BEP', 'BEPA', 'certificat'],
  4: ['BAC', 'Baccalauréat', 'BP', 'BT'],
  5: ['BTS', 'DUT', 'DEUG', 'technicien supérieur'],
  6: ['Licence', 'Bachelor', 'BUT'],
  7: ['Master', 'Ingénieur', 'MBA', 'DESS', 'DEA'],
  8: ['Doctorat', 'PhD', 'Thèse']
} as const

// Skill categories for French job market
export const SkillCategoryEnum = z.enum(['technical', 'business', 'soft', 'language', 'certification', 'industry'])

// Enhanced skill with French market context
export const FrenchExtractedSkillSchema = z.object({
  name: z.string().min(1),
  normalized_name: z.string().min(1), // lowercase, no accents, standardized
  category: SkillCategoryEnum,
  confidence: z.number().min(0).max(1),
  required: z.boolean().default(true),
  source: z.enum(['explicit', 'inferred', 'rome_derived']),
  years_mentioned: z.number().optional(),
  context: z.string().optional() // Where it was found in the text
})

// Language with CEFR confidence
export const FrenchLanguageExtractionSchema = z.object({
  code: z.string().length(2), // ISO 639-1
  name: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional(),
  confidence: z.number().min(0).max(1),
  required: z.boolean(),
  source: z.enum(['explicit', 'inferred', 'default'])
})

// Education requirement with EQF mapping
export const FrenchEducationExtractionSchema = z.object({
  level_eqf: z.number().min(1).max(8),
  degree_type: z.string(), // Original French term
  confidence: z.number().min(0).max(1),
  source: z.enum(['explicit', 'job_level_inferred', 'industry_standard'])
})

// ROME code validation
export const RomeValidationSchema = z.object({
  code: z.string().regex(/^[A-Z]\d{4}$/),
  skills_match: z.number().min(0).max(1), // How well extracted skills match ROME
  coherence_check: z.boolean(),
  suggested_skills: z.array(z.string()).optional() // Additional skills from ROME
})

// Confidence scoring breakdown
export const ConfidenceBreakdownSchema = z.object({
  skills: z.number().min(0).max(1),
  seniority: z.number().min(0).max(1),
  languages: z.number().min(0).max(1),
  degrees: z.number().min(0).max(1),
  global: z.number().min(0).max(1),
  // Confidence calculation details
  calculation_method: z.object({
    skills_weight: z.number().default(0.4),
    seniority_weight: z.number().default(0.3),
    other_weight: z.number().default(0.3),
    rome_boost: z.number().optional() // Bonus for ROME coherence
  })
})

// Extraction metadata for debugging and quality control
export const ExtractionMetadataSchema = z.object({
  primary_indicators: z.array(z.string()), // What gave us confidence
  uncertainty_flags: z.array(z.string()), // What we weren't sure about
  rome_coherence: z.boolean(),
  text_quality_score: z.number().min(0).max(1), // How clear was the input
  processing_notes: z.array(z.string()).optional()
})

// Main extraction result schema
export const FranceTravailExtractionSchema = z.object({
  // Skills extraction
  skills_required: z.array(FrenchExtractedSkillSchema).default([]),
  skills_preferred: z.array(FrenchExtractedSkillSchema).default([]),
  
  // Seniority analysis
  seniority_level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager', 'unknown']),
  seniority_confidence: z.number().min(0).max(1),
  seniority_indicators: z.array(z.string()).optional(), // Text fragments that indicated seniority
  
  // Languages
  languages_detected: z.array(FrenchLanguageExtractionSchema).default([]),
  
  // Education
  degree_requirements: z.array(FrenchEducationExtractionSchema).default([]),
  
  // ROME validation
  rome_validation: RomeValidationSchema.optional(),
  
  // Contract insights (for completeness)
  contract_insights: z.object({
    type_detected: z.enum(['CDI', 'CDD', 'INTERIM', 'APP', 'PRO', 'STAGE', 'UNKNOWN']).optional(),
    duration_mentioned: z.string().optional(),
    start_date_flexibility: z.enum(['immediate', 'flexible', 'specific']).optional()
  }).optional(),
  
  // Confidence scoring
  confidence_scores: ConfidenceBreakdownSchema,
  
  // Metadata for quality control
  extraction_metadata: ExtractionMetadataSchema
})

export type FranceTravailExtraction = z.infer<typeof FranceTravailExtractionSchema>

// Validation helper functions
export const validateFrenchExtraction = (data: unknown): FranceTravailExtraction => {
  return FranceTravailExtractionSchema.parse(data)
}

export const isHighQualityExtraction = (extraction: FranceTravailExtraction): boolean => {
  const { global } = extraction.confidence_scores
  return global >= 0.80 && 
         extraction.skills_required.length > 0 && 
         extraction.seniority_level !== 'unknown'
}

// Token counting helper for cost optimization
export const estimatePromptTokens = (
  title: string, 
  description: string, 
  additionalFields: Record<string, any> = {}
): number => {
  const systemPromptTokens = 320 // Our optimized system prompt
  const baseInputTokens = Math.ceil((title + description).length / 4) // Rough estimation
  const additionalTokens = Math.ceil(JSON.stringify(additionalFields).length / 4)
  
  return systemPromptTokens + baseInputTokens + additionalTokens
}

// Cost calculation
export const estimateProcessingCost = (totalTokens: number): number => {
  const GPT_4O_MINI_INPUT_COST = 0.150 / 1000000 // per input token
  const GPT_4O_MINI_OUTPUT_COST = 0.600 / 1000000 // per output token
  const estimatedOutputTokens = 400 // Average for our schema
  
  return (totalTokens * GPT_4O_MINI_INPUT_COST) + (estimatedOutputTokens * GPT_4O_MINI_OUTPUT_COST)
}