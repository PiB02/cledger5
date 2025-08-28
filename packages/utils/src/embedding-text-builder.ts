/**
 * Embedding text builder selon PRD section 3.1
 * Format unifié pour offres et CV pour maximiser la similarité sémantique
 */

export type EmbeddingContext = 'offer' | 'cv'

interface CanonicalizedInput {
  title_canonical: string
  rome_codes?: string[]
  city?: string
  department_code?: string
  region_code?: string
  career_level?: string
  contract_type_code?: string
  work_mode_code?: string
  languages?: Array<{ code: string; cefr: number }>
  degree_min_eqf?: number  // Pour offre
  degree_top_eqf?: number  // Pour CV
  skills_required?: string[]
  skills_preferred?: string[]
  salary_min?: number
  salary_max?: number
  salary_period?: string
  availability?: string
  contract_start_date?: string  // Pour offre
}

/**
 * Convertit un niveau CEFR numérique (1-6) en string (A1-C2)
 */
export function toCEFR(n?: number): string {
  const map: string[] = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  return n && n >= 1 && n <= 6 ? (map[n] || 'unknown') : 'unknown'
}

/**
 * Normalise une compétence : lowercase, unaccent, trim
 */
export function normSkill(s: string): string {
  // Simple unaccent implementation - in production use a proper library
  const unaccent = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[àâä]/gi, 'a')
      .replace(/[éèêë]/gi, 'e')
      .replace(/[îï]/gi, 'i')
      .replace(/[ôö]/gi, 'o')
      .replace(/[ùûü]/gi, 'u')
      .replace(/[ÿ]/gi, 'y')
      .replace(/[ç]/gi, 'c')
      .replace(/[ñ]/gi, 'n')
  }
  
  return unaccent(s)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

/**
 * Construit le texte d'embedding selon les specs PRD section 3.1
 * @param ctx - 'offer' ou 'cv'
 * @param data - Données canonisées
 * @returns Texte formaté pour embedding (max 1500 caractères)
 * @throws Error si le texte dépasse 1500 caractères ou si les skills requises sont vides pour une offre
 */
export function buildEmbeddingText(
  ctx: EmbeddingContext, 
  data: CanonicalizedInput
): string {
  // TITLE: max 80 caractères
  const title = data.title_canonical.slice(0, 80)
  
  // ROME: codes triés
  const rome = (data.rome_codes || []).sort().join('; ') || 'unknown'
  
  // LOCATION: city|dept|region|FR
  const loc = `${data.city || ''}|${data.department_code || ''}|${data.region_code || ''}|FR`
  
  // SENIORITY
  const seniority = data.career_level ?? 'unknown'
  
  // CONTRACT
  const contract = data.contract_type_code ?? 'unknown'
  
  // WORK_MODE
  const workMode = data.work_mode_code ?? 'unknown'
  
  // LANGUAGES: format code=CEFR triés alphabétiquement
  const langs = (data.languages || [])
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(l => `${l.code}=${toCEFR(l.cefr)}`)
    .join('; ') || 'unknown'
  
  // DEGREE: différent entre offre et CV
  const degree = ctx === 'offer' 
    ? (data.degree_min_eqf?.toString() ?? 'unknown')
    : (data.degree_top_eqf?.toString() ?? 'unknown')
  
  // SKILLS: normalisation, dédupe, limite à 50
  const req = (data.skills_required || [])
    .map(normSkill)
    .filter(Boolean)
  
  const pref = (data.skills_preferred || [])
    .map(normSkill)
    .filter(Boolean)
  
  // Dédupe
  const dedup = (arr: string[]) => Array.from(new Set(arr))
  const limit = (arr: string[]) => arr.slice(0, 50)
  
  const reqF = limit(dedup(req))
  const prefF = limit(dedup(pref))
  
  // SALARY
  const salary = data.salary_min && data.salary_max && data.salary_period
    ? `${data.salary_min}-${data.salary_max} EUR ${data.salary_period}`
    : 'unknown'
  
  // AVAILABILITY
  const avail = data.availability || 
    (data.contract_start_date ? 
      new Date(data.contract_start_date).toISOString().slice(0, 7) : // YYYY-MM
      'unknown')
  
  // Construction des lignes selon le format PRD
  const lines = [
    `TITLE: ${title}`,
    `ROME: ${rome}`,
    `LOCATION: ${loc}`,
    `SENIORITY: ${seniority}`,
    `CONTRACT: ${contract}`,
    `WORK_MODE: ${workMode}`,
    `LANGUAGES: ${langs}`,
    `${ctx === 'offer' ? 'DEGREE_EQF_MIN' : 'DEGREE_EQF_TOP'}: ${degree}`,
    `SKILLS_REQUIRED: ${reqF.join('|')}`,
    `SKILLS_PREFERRED: ${prefF.join('|')}`,
    `SALARY: ${salary}`,
    `AVAILABILITY: ${avail}`
  ]
  
  const txt = lines.join('\n')
  
  // Validations
  if (txt.length > 1500) {
    throw new Error(`Embedding text too long: ${txt.length} characters (max: 1500)`)
  }
  
  if (ctx === 'offer' && !reqF.length && data.skills_required?.length) {
    throw new Error('Required skills empty after normalization')
  }
  
  return txt
}

/**
 * Calcule le hash SHA-256 du texte d'embedding
 * @param text - Texte d'embedding
 * @returns Hash SHA-256 en hexadécimal
 */
export async function hashEmbeddingText(text: string): Promise<string> {
  // In browser/edge environment
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // In Node.js environment (fallback)
  try {
    const crypto = await import('crypto')
    return crypto.createHash('sha256').update(text).digest('hex')
  } catch {
    throw new Error('No crypto implementation available')
  }
} 