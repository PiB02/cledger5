/**
 * France Travail Prompt Optimization
 * Token-efficient prompt engineering for GPT-4o-mini
 */

import type { FTOffer } from '@/lib/france-travail'

// Optimized system prompt (≈320 tokens, 40% reduction from original)
export const OPTIMIZED_FT_SYSTEM_PROMPT = `Tu es un expert en recrutement français spécialisé dans l'extraction structurée depuis les offres France Travail.

CARTOGRAPHIE SÉNIORITÉ:
- stage,apprenti,débutant → intern
- 1-2 ans,junior → junior  
- 3-5 ans,expérimenté → mid
- 5+ ans,expert,confirmé → senior
- chef équipe,responsable → lead
- manager,directeur → manager

DIPLÔMES EQF:
CAP/BEP=3, BAC=4, BTS/DUT=5, Licence=6, Master/Ingénieur=7, Doctorat=8

COMPÉTENCES: Extrait skills techniques+métier. Normalise: minuscules, sans accents. 
LANGUES: Détecte requis+niveau CEFR si mentionné.
CONTRATS: CDI/CDD/INTERIM/APP/PRO/STAGE/UNKNOWN

CONFIANCE (0.0-1.0):
- Skills: mention directe=0.9, inféré=0.6
- Séniorité: terme explicite=0.9, années=0.7
- Langues: requis=0.9, assumé=0.5
- Diplômes: cité=0.85, niveau poste=0.6
- Global: moyenne pondérée (skills×0.4 + séniorité×0.3 + autres×0.3)

VALIDATION: Utilise ROME codes pour valider cohérence compétences.

RÉPONSE: JSON brut uniquement. PAS de \`\`\`json ni formatage markdown. Commence par { et finis par }.`

/**
 * Compresses France Travail offer data into token-efficient format
 * Reduces input tokens by ~30% while preserving essential information
 */
export function compressFTOfferForPrompt(offer: FTOffer): string {
  const parts: string[] = []

  // Title (essential)
  parts.push(`OFFRE: ${offer.intitule}`)

  // Description (truncated intelligently)
  if (offer.description) {
    // Keep first 800 chars but break at sentence end
    let desc = offer.description.slice(0, 800)
    const lastSentence = desc.lastIndexOf('.')
    if (lastSentence > 400) {
      desc = desc.slice(0, lastSentence + 1)
    }
    parts.push(`DESC: ${desc}`)
  }

  // Experience (critical for seniority)
  if (offer.experience?.libelle) {
    parts.push(`EXP: ${offer.experience.libelle}`)
  }

  // Contract type (compressed)
  const contractParts = []
  if (offer.typeContrat?.libelle) contractParts.push(offer.typeContrat.libelle)
  if (offer.natureContrat?.libelle) contractParts.push(offer.natureContrat.libelle)
  if (contractParts.length > 0) {
    parts.push(`CONTRAT: ${contractParts.join(' / ')}`)
  }

  // Education (compressed)
  if (offer.formations && offer.formations.length > 0) {
    const formationsStr = offer.formations
      .map(f => f.libelle || f.code)
      .slice(0, 3) // Limit to 3 most relevant
      .join(', ')
    parts.push(`FORM: ${formationsStr}`)
  }

  // Skills (most important - full preservation)
  if (offer.competences && offer.competences.length > 0) {
    const skillsStr = offer.competences
      .map(c => `${c.libelle}${c.exigence ? ` (${c.exigence})` : ''}`)
      .join(', ')
    parts.push(`COMP: ${skillsStr}`)
  }

  // Languages (if present)
  if (offer.langues && offer.langues.length > 0) {
    const languesStr = offer.langues.map(l => l.libelle).join(', ')
    parts.push(`LANG: ${languesStr}`)
  }

  // ROME code (validation anchor)
  if (offer.romeCode) {
    parts.push(`ROME: ${offer.romeCode}`)
  }

  // Salary (compressed)
  if (offer.salaire) {
    const salParts = []
    if (offer.salaire.minimum) salParts.push(`${offer.salaire.minimum}`)
    if (offer.salaire.maximum) salParts.push(`-${offer.salaire.maximum}`)
    if (offer.salaire.unite) salParts.push(offer.salaire.unite)
    if (salParts.length > 0) {
      parts.push(`SAL: ${salParts.join('')}`)
    }
  }

  return parts.join('\n')
}

/**
 * Anti-markdown instructions specifically designed for GPT-4o-mini
 * Addresses the specific issue of ```json wrapping
 */
export const ANTI_MARKDOWN_INSTRUCTIONS = [
  "Réponds avec du JSON brut uniquement",
  "Ne pas utiliser ```json ou autre formatage markdown", 
  "Commence ta réponse par { et termine par }",
  "Assure-toi que ta réponse soit du JSON valide parsable directement"
].join('. ') + '.'

/**
 * Calculates token count estimation for cost prediction
 */
export function estimateTokenCount(systemPrompt: string, userInput: string): number {
  // GPT-4 tokenizer approximation: ~4 characters per token for mixed content
  const totalChars = systemPrompt.length + userInput.length
  return Math.ceil(totalChars / 3.8) // Slightly more conservative estimation
}

/**
 * Optimizes temperature and parameters for consistent extraction
 */
export const OPTIMAL_GPT_PARAMS = {
  model: 'gpt-4o-mini',
  temperature: 0.3, // Balance between consistency and creativity
  max_tokens: 1500, // Sufficient for our schema
  top_p: 0.9, // Slight randomness for natural language understanding
  frequency_penalty: 0.1, // Prevent repetitive outputs
  presence_penalty: 0.1 // Encourage diverse skill extraction
} as const

/**
 * Preprocessing pipeline for France Travail offers
 * Cleans and normalizes data before GPT processing
 */
export function preprocessFTOffer(offer: FTOffer): {
  compressed: string
  metadata: {
    originalTokens: number
    compressedTokens: number
    compressionRatio: number
    estimatedCost: number
  }
} {
  // Original size estimation
  const originalText = JSON.stringify(offer)
  const originalTokens = estimateTokenCount('', originalText)
  
  // Compress
  const compressed = compressFTOfferForPrompt(offer)
  const compressedTokens = estimateTokenCount(OPTIMIZED_FT_SYSTEM_PROMPT, compressed)
  
  // Cost calculation (GPT-4o-mini pricing)
  const inputCostPerToken = 0.150 / 1000000
  const outputCostPerToken = 0.600 / 1000000
  const estimatedOutputTokens = 400
  const estimatedCost = (compressedTokens * inputCostPerToken) + (estimatedOutputTokens * outputCostPerToken)
  
  return {
    compressed,
    metadata: {
      originalTokens,
      compressedTokens,
      compressionRatio: Math.round((1 - compressedTokens / originalTokens) * 100),
      estimatedCost: Math.round(estimatedCost * 100000) / 100000 // 5 decimal places
    }
  }
}

/**
 * Quality validation for compressed input
 * Ensures critical information wasn't lost during compression
 */
export function validateCompressedInput(compressed: string): {
  isValid: boolean
  missingCritical: string[]
  warnings: string[]
} {
  const missingCritical: string[] = []
  const warnings: string[] = []
  
  // Essential fields check
  if (!compressed.includes('OFFRE:')) {
    missingCritical.push('title')
  }
  
  if (!compressed.includes('DESC:') && !compressed.includes('COMP:')) {
    missingCritical.push('description_or_skills')
  }
  
  // Warnings for quality
  if (!compressed.includes('EXP:')) {
    warnings.push('no_experience_info')
  }
  
  if (!compressed.includes('ROME:')) {
    warnings.push('no_rome_code')
  }
  
  if (compressed.length < 100) {
    warnings.push('very_short_input')
  }
  
  return {
    isValid: missingCritical.length === 0,
    missingCritical,
    warnings
  }
}

/**
 * Batch optimization for processing multiple offers
 * Implements intelligent batching to stay within rate limits
 */
export class FTBatchOptimizer {
  private tokenBudget: number
  private currentTokens: number = 0
  private batchSize: number = 0
  
  constructor(maxTokensPerMinute: number = 40000) { // Conservative GPT-4o-mini limit
    this.tokenBudget = maxTokensPerMinute
  }
  
  canProcessOffer(offer: FTOffer): boolean {
    const { metadata } = preprocessFTOffer(offer)
    return (this.currentTokens + metadata.compressedTokens) <= this.tokenBudget
  }
  
  addOfferToBatch(offer: FTOffer): void {
    const { metadata } = preprocessFTOffer(offer)
    this.currentTokens += metadata.compressedTokens
    this.batchSize += 1
  }
  
  resetBatch(): void {
    this.currentTokens = 0
    this.batchSize = 0
  }
  
  getBatchStats() {
    return {
      tokenUsage: this.currentTokens,
      remainingTokens: this.tokenBudget - this.currentTokens,
      batchSize: this.batchSize,
      utilizationPercent: Math.round((this.currentTokens / this.tokenBudget) * 100)
    }
  }
}