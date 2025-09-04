/**
 * France Travail Confidence Calculation Methodology
 * French market-specific confidence scoring for GPT-4o-mini extractions
 */

import type { FranceTravailExtraction } from './france-travail-extraction-schema'

// French recruitment context confidence boosters
export const FRENCH_CONFIDENCE_PATTERNS = {
  // High confidence seniority indicators
  explicitSeniority: [
    'chef d\'équipe', 'responsable', 'manager', 'directeur', 'senior',
    'expert', 'confirmé', 'débutant', 'junior', 'stage', 'apprenti'
  ],
  
  // High confidence skill indicators  
  explicitSkillTerms: [
    'maîtrise de', 'expertise', 'compétence requise', 'obligatoire',
    'indispensable', 'nécessaire', 'connaissance de'
  ],
  
  // High confidence education indicators
  explicitEducation: [
    'diplôme requis', 'formation exigée', 'niveau', 'bac+', 'master',
    'licence', 'ingénieur', 'bts', 'dut', 'cap'
  ],
  
  // Medium confidence patterns (years of experience)
  experienceYears: /(\d+)\s*(?:ans?|années?)\s*(?:d[\'e]?expérience|expérience)/gi,
  
  // Low confidence patterns (assumptions)
  assumptionTerms: [
    'de préférence', 'souhaité', 'apprécié', 'un plus', 'serait un atout'
  ]
}

/**
 * Calculates skill confidence based on French recruitment patterns
 */
export function calculateSkillConfidence(
  skillName: string,
  context: string,
  source: 'explicit' | 'inferred' | 'rome_derived'
): number {
  let confidence = 0.5 // Base confidence
  
  // Source-based scoring
  switch (source) {
    case 'explicit':
      confidence = 0.9
      break
    case 'inferred':
      confidence = 0.6
      break
    case 'rome_derived':
      confidence = 0.7 // ROME codes are reliable
      break
  }
  
  // Context boosters
  const contextLower = context.toLowerCase()
  
  // High confidence indicators
  for (const pattern of FRENCH_CONFIDENCE_PATTERNS.explicitSkillTerms) {
    if (contextLower.includes(pattern.toLowerCase())) {
      confidence = Math.min(0.95, confidence + 0.15)
    }
  }
  
  // Required vs preferred distinction
  if (contextLower.includes('obligatoire') || contextLower.includes('indispensable')) {
    confidence = Math.min(0.95, confidence + 0.1)
  }
  
  if (FRENCH_CONFIDENCE_PATTERNS.assumptionTerms.some(term => 
    contextLower.includes(term.toLowerCase())
  )) {
    confidence = Math.max(0.3, confidence - 0.2)
  }
  
  return Math.round(confidence * 100) / 100
}

/**
 * Calculates seniority confidence using French recruitment terminology
 */
export function calculateSeniorityConfidence(
  level: string,
  context: string,
  indicators: string[]
): number {
  let confidence = 0.5
  
  const contextLower = context.toLowerCase()
  
  // Explicit seniority terms (highest confidence)
  const hasExplicitTerm = FRENCH_CONFIDENCE_PATTERNS.explicitSeniority.some(term =>
    contextLower.includes(term.toLowerCase())
  )
  
  if (hasExplicitTerm) {
    confidence = 0.9
  }
  
  // Years of experience pattern (medium-high confidence)
  const yearMatches = [...contextLower.matchAll(FRENCH_CONFIDENCE_PATTERNS.experienceYears)]
  if (yearMatches.length > 0) {
    confidence = Math.max(confidence, 0.75)
    
    // Cross-validate years with detected level
    const years = parseInt(yearMatches[0][1])
    const expectedYears = getExpectedYearsForLevel(level)
    
    if (Math.abs(years - expectedYears.avg) <= expectedYears.tolerance) {
      confidence = Math.min(0.95, confidence + 0.1)
    }
  }
  
  // Multiple indicators boost confidence
  if (indicators.length >= 2) {
    confidence = Math.min(0.95, confidence + 0.05)
  }
  
  return Math.round(confidence * 100) / 100
}

/**
 * Expected years of experience for French seniority levels
 */
function getExpectedYearsForLevel(level: string): { avg: number, tolerance: number } {
  const mapping = {
    'intern': { avg: 0, tolerance: 0 },
    'junior': { avg: 1, tolerance: 1 },
    'mid': { avg: 4, tolerance: 2 },
    'senior': { avg: 7, tolerance: 3 },
    'lead': { avg: 8, tolerance: 3 },
    'manager': { avg: 10, tolerance: 5 }
  }
  
  return mapping[level as keyof typeof mapping] || { avg: 5, tolerance: 3 }
}

/**
 * Calculates language confidence with French market specifics
 */
export function calculateLanguageConfidence(
  languageCode: string,
  context: string,
  hasLevel: boolean,
  required: boolean
): number {
  let confidence = 0.5
  
  // French is assumed for French job market (high confidence)
  if (languageCode === 'fr') {
    confidence = 0.95
  }
  
  // Explicit language requirements
  if (required) {
    confidence = Math.min(0.9, confidence + 0.2)
  }
  
  // CEFR level mentioned (high confidence)
  if (hasLevel) {
    confidence = Math.min(0.9, confidence + 0.15)
  }
  
  // Context indicators
  const contextLower = context.toLowerCase()
  const languageTerms = ['bilingue', 'courant', 'opérationnel', 'niveau', 'maîtrise']
  
  if (languageTerms.some(term => contextLower.includes(term))) {
    confidence = Math.min(0.9, confidence + 0.1)
  }
  
  return Math.round(confidence * 100) / 100
}

/**
 * Calculates education confidence using French qualification system
 */
export function calculateEducationConfidence(
  eqfLevel: number,
  degreeType: string,
  context: string,
  source: 'explicit' | 'job_level_inferred' | 'industry_standard'
): number {
  let confidence = 0.5
  
  // Source-based scoring
  switch (source) {
    case 'explicit':
      confidence = 0.85
      break
    case 'industry_standard':
      confidence = 0.7
      break
    case 'job_level_inferred':
      confidence = 0.6
      break
  }
  
  // French education system validation
  const contextLower = context.toLowerCase()
  
  // Explicit education requirements
  if (FRENCH_CONFIDENCE_PATTERNS.explicitEducation.some(term => 
    contextLower.includes(term.toLowerCase())
  )) {
    confidence = Math.min(0.9, confidence + 0.1)
  }
  
  // Specific French qualifications (high confidence)
  const frenchQualifications = ['bts', 'dut', 'cap', 'bep', 'licence', 'master', 'ingénieur']
  if (frenchQualifications.some(qual => degreeType.toLowerCase().includes(qual))) {
    confidence = Math.min(0.9, confidence + 0.05)
  }
  
  return Math.round(confidence * 100) / 100
}

/**
 * ROME code validation boost for overall confidence
 */
export function calculateRomeCoherenceBoost(
  romeCode: string,
  extractedSkills: string[],
  romeSkillsMatch: number
): number {
  if (!romeCode || romeSkillsMatch < 0.5) {
    return 0 // No boost for poor ROME match
  }
  
  // Progressive boost based on ROME match quality
  if (romeSkillsMatch >= 0.8) return 0.1  // Excellent match
  if (romeSkillsMatch >= 0.7) return 0.075 // Good match  
  if (romeSkillsMatch >= 0.6) return 0.05  // Moderate match
  
  return 0.025 // Weak but positive match
}

/**
 * Main global confidence calculation with French market weighting
 */
export function calculateGlobalConfidence(
  skillsConfidence: number,
  seniorityConfidence: number,
  languagesConfidence: number,
  degreesConfidence: number,
  romeCoherenceBoost: number = 0,
  weights: {
    skills: number,
    seniority: number,
    languages: number,
    degrees: number
  } = {
    skills: 0.4,    // Skills are most important for job matching
    seniority: 0.3, // Seniority is critical for relevance
    languages: 0.15, // Languages matter but less critical
    degrees: 0.15   // Education is important but variable
  }
): number {
  // Weighted average
  const baseConfidence = 
    (skillsConfidence * weights.skills) +
    (seniorityConfidence * weights.seniority) +
    (languagesConfidence * weights.languages) +
    (degreesConfidence * weights.degrees)
  
  // Apply ROME coherence boost
  const boostedConfidence = Math.min(1.0, baseConfidence + romeCoherenceBoost)
  
  return Math.round(boostedConfidence * 1000) / 1000 // 3 decimal places
}

/**
 * Quality assessment for extraction results
 */
export function assessExtractionQuality(extraction: FranceTravailExtraction): {
  isProduction: boolean,
  qualityScore: number,
  issues: string[],
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  let qualityScore = extraction.confidence_scores.global
  
  // Critical quality checks
  if (extraction.skills_required.length === 0) {
    issues.push('no_skills_extracted')
    qualityScore -= 0.2
    recommendations.push('Verify skill extraction from competences field')
  }
  
  if (extraction.seniority_level === 'unknown') {
    issues.push('seniority_unknown')
    qualityScore -= 0.15
    recommendations.push('Check experience field for seniority indicators')
  }
  
  // Quality boosters
  if (extraction.rome_validation?.coherence_check) {
    qualityScore = Math.min(1.0, qualityScore + 0.05)
  }
  
  if (extraction.skills_required.length >= 5) {
    qualityScore = Math.min(1.0, qualityScore + 0.02)
  }
  
  // Production readiness criteria
  const isProduction = 
    qualityScore >= 0.8 &&
    extraction.skills_required.length > 0 &&
    extraction.seniority_level !== 'unknown' &&
    issues.length === 0
  
  return {
    isProduction,
    qualityScore: Math.round(qualityScore * 1000) / 1000,
    issues,
    recommendations
  }
}

/**
 * Confidence trending analysis for batch processing
 */
export class ConfidenceTrendAnalyzer {
  private results: number[] = []
  private targetConfidence: number
  
  constructor(targetConfidence: number = 0.8) {
    this.targetConfidence = targetConfidence
  }
  
  addResult(globalConfidence: number): void {
    this.results.push(globalConfidence)
  }
  
  getStats() {
    if (this.results.length === 0) {
      return null
    }
    
    const avg = this.results.reduce((sum, conf) => sum + conf, 0) / this.results.length
    const successful = this.results.filter(conf => conf >= this.targetConfidence).length
    const successRate = successful / this.results.length
    
    const sorted = [...this.results].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    
    return {
      average: Math.round(avg * 1000) / 1000,
      median: Math.round(median * 1000) / 1000,
      successRate: Math.round(successRate * 1000) / 1000,
      total: this.results.length,
      successful,
      min: Math.min(...this.results),
      max: Math.max(...this.results),
      trend: this.calculateTrend()
    }
  }
  
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (this.results.length < 10) return 'stable'
    
    const recent = this.results.slice(-10)
    const earlier = this.results.slice(-20, -10)
    
    if (earlier.length === 0) return 'stable'
    
    const recentAvg = recent.reduce((sum, conf) => sum + conf, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, conf) => sum + conf, 0) / earlier.length
    
    const diff = recentAvg - earlierAvg
    
    if (diff > 0.05) return 'improving'
    if (diff < -0.05) return 'declining'
    return 'stable'
  }
}