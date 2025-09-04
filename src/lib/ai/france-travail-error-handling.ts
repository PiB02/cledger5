/**
 * France Travail Error Handling & Edge Cases
 * Robust error handling for GPT-4o-mini extractions with French job market specifics
 */

import type { FTOffer } from '@/lib/france-travail'
import type { FranceTravailExtraction } from './france-travail-extraction-schema'

// Error types specific to France Travail extraction
export enum FTExtractionErrorType {
  // Input validation errors
  INVALID_INPUT = 'invalid_input',
  MISSING_CRITICAL_DATA = 'missing_critical_data',
  EMPTY_DESCRIPTION = 'empty_description',
  
  // GPT response errors
  MALFORMED_JSON = 'malformed_json',
  MARKDOWN_WRAPPED = 'markdown_wrapped',
  INCOMPLETE_RESPONSE = 'incomplete_response',
  INVALID_SCHEMA = 'invalid_schema',
  
  // French market specific errors
  UNKNOWN_FRENCH_TERMS = 'unknown_french_terms',
  INVALID_ROME_CODE = 'invalid_rome_code',
  AMBIGUOUS_SENIORITY = 'ambiguous_seniority',
  CONFLICTING_EDUCATION = 'conflicting_education',
  
  // Quality control errors
  LOW_CONFIDENCE = 'low_confidence',
  INSUFFICIENT_SKILLS = 'insufficient_skills',
  MISSING_EXPERIENCE = 'missing_experience',
  
  // Rate limiting & API errors
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  GPT_API_ERROR = 'gpt_api_error',
  TIMEOUT_ERROR = 'timeout_error'
}

export interface FTExtractionError {
  type: FTExtractionErrorType
  message: string
  details?: any
  retryable: boolean
  fallback?: Partial<FranceTravailExtraction>
  suggestion?: string
}

/**
 * Validates France Travail offer input before GPT processing
 */
export function validateFTOfferInput(offer: FTOffer): FTExtractionError[] {
  const errors: FTExtractionError[] = []
  
  // Critical fields check
  if (!offer.intitule || offer.intitule.trim().length < 5) {
    errors.push({
      type: FTExtractionErrorType.MISSING_CRITICAL_DATA,
      message: 'Job title is missing or too short',
      details: { title: offer.intitule },
      retryable: false,
      suggestion: 'Skip this offer or use fallback title from ROME code'
    })
  }
  
  // Description quality check
  if (!offer.description || offer.description.trim().length < 50) {
    errors.push({
      type: FTExtractionErrorType.EMPTY_DESCRIPTION,
      message: 'Job description is missing or too short for meaningful extraction',
      details: { descLength: offer.description?.length || 0 },
      retryable: false,
      fallback: {
        extraction_metadata: {
          primary_indicators: [],
          uncertainty_flags: ['insufficient_description'],
          rome_coherence: false,
          text_quality_score: 0.3,
          processing_notes: ['Used title and competences only']
        }
      },
      suggestion: 'Use competences and formations fields as primary source'
    })
  }
  
  // ROME code validation
  if (offer.romeCode && !/^[A-Z]\d{4}$/.test(offer.romeCode)) {
    errors.push({
      type: FTExtractionErrorType.INVALID_ROME_CODE,
      message: 'Invalid ROME code format',
      details: { romeCode: offer.romeCode },
      retryable: false,
      suggestion: 'Ignore ROME code or attempt correction'
    })
  }
  
  return errors
}

/**
 * Attempts to parse GPT response with multiple fallback strategies
 */
export function parseGPTResponse(rawResponse: string): {
  success: boolean
  data?: FranceTravailExtraction
  error?: FTExtractionError
} {
  if (!rawResponse || rawResponse.trim().length === 0) {
    return {
      success: false,
      error: {
        type: FTExtractionErrorType.INCOMPLETE_RESPONSE,
        message: 'Empty response from GPT',
        retryable: true
      }
    }
  }
  
  // Strategy 1: Direct JSON parse (ideal case)
  try {
    const data = JSON.parse(rawResponse.trim())
    return { success: true, data }
  } catch (directError) {
    // Continue to fallback strategies
  }
  
  // Strategy 2: Remove markdown wrapping
  const markdownPatterns = [
    /^```json\s*([\s\S]*?)\s*```$/,
    /^```\s*([\s\S]*?)\s*```$/,
    /^`\s*([\s\S]*?)\s*`$/
  ]
  
  for (const pattern of markdownPatterns) {
    const match = rawResponse.match(pattern)
    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1].trim())
        return { success: true, data }
      } catch (markdownError) {
        continue
      }
    }
  }
  
  // Strategy 3: Extract JSON from mixed content
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[0])
      return { success: true, data }
    } catch (extractError) {
      // Continue to error return
    }
  }
  
  // Strategy 4: Attempt repair of common JSON issues
  let repairedJson = rawResponse
    .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
    .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ':"$1"$2') // Quote unquoted string values
  
  try {
    const data = JSON.parse(repairedJson)
    return { success: true, data }
  } catch (repairError) {
    // Final failure
  }
  
  return {
    success: false,
    error: {
      type: FTExtractionErrorType.MALFORMED_JSON,
      message: 'Could not parse GPT response as valid JSON',
      details: { 
        rawResponse: rawResponse.substring(0, 200) + '...',
        attempts: ['direct', 'markdown_removal', 'extraction', 'repair']
      },
      retryable: true,
      suggestion: 'Retry with explicit JSON format instructions'
    }
  }
}

/**
 * Handles French market-specific edge cases
 */
export function handleFrenchMarketEdgeCases(
  extraction: FranceTravailExtraction,
  originalOffer: FTOffer
): {
  updatedExtraction: FranceTravailExtraction
  warnings: string[]
} {
  const warnings: string[] = []
  const updated = { ...extraction }
  
  // Handle apprenticeship/alternance specifics
  if (originalOffer.intitule.toLowerCase().includes('alternance') || 
      originalOffer.intitule.toLowerCase().includes('apprenti')) {
    
    if (updated.seniority_level !== 'intern') {
      warnings.push('Alternance position detected but seniority not set to intern')
      updated.seniority_level = 'intern'
      updated.seniority_confidence = Math.max(0.85, updated.seniority_confidence)
    }
    
    // Apprenticeship contract type correction
    if (updated.contract_insights && 
        !['APP', 'PRO'].includes(updated.contract_insights.type_detected || '')) {
      updated.contract_insights.type_detected = 'APP'
    }
  }
  
  // Handle French public sector terms
  const publicSectorTerms = ['fonction publique', 'collectivité', 'mairie', 'ministère']
  if (publicSectorTerms.some(term => 
    originalOffer.description?.toLowerCase().includes(term) ||
    originalOffer.intitule.toLowerCase().includes(term)
  )) {
    warnings.push('Public sector position detected - specific requirements may apply')
    
    // Public sector often requires French nationality
    const frenchLang = updated.languages_detected.find(l => l.code === 'fr')
    if (frenchLang) {
      frenchLang.required = true
      frenchLang.confidence = Math.max(0.9, frenchLang.confidence)
    }
  }
  
  // Handle regional French variations
  const regionalContext = detectRegionalContext(originalOffer)
  if (regionalContext.needsAdjustment) {
    warnings.push(`Regional context detected: ${regionalContext.region}`)
    // Add regional language requirements if needed
    if (regionalContext.additionalLanguages) {
      for (const lang of regionalContext.additionalLanguages) {
        if (!updated.languages_detected.find(l => l.code === lang.code)) {
          updated.languages_detected.push({
            code: lang.code,
            name: lang.name,
            level: lang.level,
            confidence: 0.6,
            required: false,
            source: 'inferred'
          })
        }
      }
    }
  }
  
  // Handle conflicting seniority indicators
  if (updated.extraction_metadata.uncertainty_flags.includes('conflicting_seniority')) {
    const resolvedSeniority = resolveSeniorityConflict(
      originalOffer.experience?.libelle || '',
      originalOffer.description || '',
      updated.seniority_level
    )
    
    if (resolvedSeniority.level !== updated.seniority_level) {
      warnings.push(`Seniority conflict resolved: ${updated.seniority_level} → ${resolvedSeniority.level}`)
      updated.seniority_level = resolvedSeniority.level
      updated.seniority_confidence = resolvedSeniority.confidence
    }
  }
  
  return { updatedExtraction: updated, warnings }
}

/**
 * Detects regional context for French job offers
 */
function detectRegionalContext(offer: FTOffer): {
  region?: string
  needsAdjustment: boolean
  additionalLanguages?: Array<{
    code: string
    name: string
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  }>
} {
  const location = offer.lieuTravail?.commune?.toLowerCase() || ''
  const description = (offer.description || '').toLowerCase()
  
  // Alsace-Lorraine region (German influence)
  if (location.includes('strasbourg') || location.includes('mulhouse') || 
      location.includes('metz') || location.includes('nancy')) {
    return {
      region: 'Alsace-Lorraine',
      needsAdjustment: description.includes('allemand') || description.includes('german'),
      additionalLanguages: description.includes('allemand') ? [{
        code: 'de',
        name: 'allemand',
        level: 'B1'
      }] : undefined
    }
  }
  
  // Corsica (Italian/Corsican)
  if (location.includes('ajaccio') || location.includes('bastia') || 
      location.includes('corse')) {
    return {
      region: 'Corsica',
      needsAdjustment: description.includes('italien') || description.includes('corse'),
      additionalLanguages: description.includes('italien') ? [{
        code: 'it',
        name: 'italien',
        level: 'B1'
      }] : undefined
    }
  }
  
  // DOM-TOM regions
  const domTomTerms = ['martinique', 'guadeloupe', 'réunion', 'guyane', 'mayotte']
  if (domTomTerms.some(term => location.includes(term))) {
    return {
      region: 'DOM-TOM',
      needsAdjustment: true
    }
  }
  
  return { needsAdjustment: false }
}

/**
 * Resolves conflicting seniority indicators
 */
function resolveSeniorityConflict(
  experienceText: string,
  description: string,
  currentLevel: string
): { level: string, confidence: number } {
  const combinedText = `${experienceText} ${description}`.toLowerCase()
  
  // Extract years of experience
  const yearMatches = combinedText.match(/(\d+)\s*(?:ans?|années?)/g)
  const years = yearMatches ? Math.max(...yearMatches.map(m => parseInt(m))) : 0
  
  // Priority hierarchy for conflict resolution
  const seniorityTerms = {
    'stage': { priority: 10, level: 'intern' },
    'apprenti': { priority: 10, level: 'intern' },
    'débutant': { priority: 9, level: 'junior' },
    'junior': { priority: 8, level: 'junior' },
    'confirmé': { priority: 7, level: 'mid' },
    'expérimenté': { priority: 7, level: 'mid' },
    'senior': { priority: 6, level: 'senior' },
    'expert': { priority: 6, level: 'senior' },
    'chef': { priority: 5, level: 'lead' },
    'responsable': { priority: 5, level: 'lead' },
    'manager': { priority: 4, level: 'manager' },
    'directeur': { priority: 3, level: 'manager' }
  }
  
  // Find highest priority term
  let highestPriority = 11
  let resolvedLevel = currentLevel
  
  for (const [term, info] of Object.entries(seniorityTerms)) {
    if (combinedText.includes(term) && info.priority < highestPriority) {
      highestPriority = info.priority
      resolvedLevel = info.level
    }
  }
  
  // Validate against years of experience
  const yearLevelMapping = {
    0: 'intern',
    1: 'junior', 2: 'junior',
    3: 'mid', 4: 'mid', 5: 'mid',
    6: 'senior', 7: 'senior', 8: 'senior',
    9: 'lead', 10: 'lead'
  }
  
  if (years > 0) {
    const yearBasedLevel = yearLevelMapping[Math.min(years, 10) as keyof typeof yearLevelMapping]
    
    // If significant discrepancy, prefer explicit terms over years
    if (highestPriority <= 8 && yearBasedLevel !== resolvedLevel) {
      // Explicit term takes precedence, but reduce confidence
      return { level: resolvedLevel, confidence: 0.7 }
    } else if (highestPriority > 8) {
      // No strong explicit term, use years
      return { level: yearBasedLevel, confidence: 0.75 }
    }
  }
  
  return { 
    level: resolvedLevel, 
    confidence: highestPriority <= 6 ? 0.9 : 0.8 
  }
}

/**
 * Generates fallback extraction for critical failures
 */
export function generateFallbackExtraction(
  offer: FTOffer,
  errors: FTExtractionError[]
): Partial<FranceTravailExtraction> {
  const fallback: Partial<FranceTravailExtraction> = {
    skills_required: [],
    skills_preferred: [],
    seniority_level: 'unknown',
    seniority_confidence: 0.3,
    languages_detected: [{
      code: 'fr',
      name: 'français',
      level: 'C2',
      confidence: 0.95,
      required: true,
      source: 'default'
    }],
    degree_requirements: [],
    confidence_scores: {
      skills: 0.3,
      seniority: 0.3,
      languages: 0.7,
      degrees: 0.3,
      global: 0.35,
      calculation_method: {
        skills_weight: 0.4,
        seniority_weight: 0.3,
        other_weight: 0.3
      }
    },
    extraction_metadata: {
      primary_indicators: ['fallback_extraction'],
      uncertainty_flags: errors.map(e => e.type),
      rome_coherence: false,
      text_quality_score: 0.2,
      processing_notes: [`Generated fallback due to: ${errors.map(e => e.message).join(', ')}`]
    }
  }
  
  // Try to extract basic skills from competences
  if (offer.competences && offer.competences.length > 0) {
    fallback.skills_required = offer.competences.slice(0, 5).map(comp => ({
      name: comp.libelle,
      normalized_name: comp.libelle.toLowerCase().replace(/[^\w\s]/g, '').trim(),
      category: 'technical' as const,
      confidence: 0.6,
      required: true,
      source: 'explicit' as const
    }))
    
    if (fallback.confidence_scores) {
      fallback.confidence_scores.skills = 0.6
      fallback.confidence_scores.global = 0.45
    }
  }
  
  return fallback
}

/**
 * Batch error recovery strategies
 */
export class BatchErrorRecovery {
  private failureCount: number = 0
  private successCount: number = 0
  private errorPatterns: Map<FTExtractionErrorType, number> = new Map()
  
  recordError(error: FTExtractionError): void {
    this.failureCount++
    const current = this.errorPatterns.get(error.type) || 0
    this.errorPatterns.set(error.type, current + 1)
  }
  
  recordSuccess(): void {
    this.successCount++
  }
  
  shouldPause(): boolean {
    // Pause if failure rate > 50% and we've processed at least 10 offers
    const total = this.failureCount + this.successCount
    return total >= 10 && (this.failureCount / total) > 0.5
  }
  
  getRecommendedAction(): {
    action: 'continue' | 'pause' | 'adjust_prompt' | 'fallback_mode'
    reason: string
    adjustments?: string[]
  } {
    const total = this.failureCount + this.successCount
    const failureRate = total > 0 ? this.failureCount / total : 0
    
    if (failureRate < 0.2) {
      return { action: 'continue', reason: 'Success rate acceptable' }
    }
    
    if (this.errorPatterns.get(FTExtractionErrorType.MALFORMED_JSON) >= 3) {
      return {
        action: 'adjust_prompt',
        reason: 'Multiple JSON parsing failures',
        adjustments: ['Strengthen anti-markdown instructions', 'Add JSON validation examples']
      }
    }
    
    if (failureRate > 0.6) {
      return {
        action: 'fallback_mode',
        reason: 'Critical failure rate - switch to basic extraction'
      }
    }
    
    return {
      action: 'pause',
      reason: `High failure rate: ${Math.round(failureRate * 100)}%`
    }
  }
  
  getStats() {
    const total = this.failureCount + this.successCount
    return {
      total,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: total > 0 ? this.successCount / total : 0,
      topErrors: Array.from(this.errorPatterns.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
    }
  }
}