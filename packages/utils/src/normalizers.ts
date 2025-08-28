/**
 * Fonctions de normalisation communes
 */

/**
 * Normalise un numéro de téléphone français
 */
export function normalizePhoneNumber(phone: string): string {
  // Supprime tous les caractères non numériques
  let cleaned = phone.replace(/\D/g, '')
  
  // Ajoute le préfixe français si nécessaire
  if (cleaned.length === 9 && cleaned[0] !== '0') {
    cleaned = '0' + cleaned
  }
  
  // Format international
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    cleaned = '33' + cleaned.slice(1)
  }
  
  // Format avec +
  if (cleaned.length === 11 && cleaned.startsWith('33')) {
    return '+' + cleaned
  }
  
  return cleaned
}

/**
 * Normalise un code SIRET (14 chiffres)
 */
export function normalizeSiret(siret: string): string | null {
  const cleaned = siret.replace(/\D/g, '')
  
  if (cleaned.length !== 14) {
    return null
  }
  
  // Validation basique avec algorithme de Luhn
  if (!validateSiret(cleaned)) {
    return null
  }
  
  // Format avec espaces pour lisibilité
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')
}

/**
 * Valide un SIRET avec l'algorithme de Luhn
 */
function validateSiret(siret: string): boolean {
  if (siret.length !== 14) return false
  
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i])
    if ((i % 2) === 0) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    sum += digit
  }
  
  return (sum % 10) === 0
}

/**
 * Normalise un code postal français
 */
export function normalizePostalCode(code: string): string | null {
  const cleaned = code.replace(/\D/g, '')
  
  if (cleaned.length !== 5) {
    return null
  }
  
  // Vérification département valide (01-95, 971-976, 2A, 2B traités comme 20)
  const dept = parseInt(cleaned.slice(0, 2))
  if (dept < 1 || (dept > 95 && dept < 97) || dept > 97) {
    return null
  }
  
  return cleaned
}

/**
 * Normalise un code ROME (1 lettre + 4 chiffres)
 */
export function normalizeRomeCode(code: string): string | null {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  if (!/^[A-Z]\d{4}$/.test(cleaned)) {
    return null
  }
  
  return cleaned
}

/**
 * Normalise un code NAF (4 chiffres + 1 lettre)
 */
export function normalizeNafCode(code: string): string | null {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  
  // Format attendu : 1234A ou 12.34A
  if (!/^\d{4}[A-Z]$/.test(cleaned)) {
    return null
  }
  
  // Format avec point pour lisibilité
  return cleaned.slice(0, 2) + '.' + cleaned.slice(2, 4) + cleaned[4]
}

/**
 * Normalise une URL
 */
export function normalizeUrl(url: string): string | null {
  try {
    // Ajoute le protocole si manquant
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url
    }
    
    const parsed = new URL(url)
    
    // Supprime le trailing slash
    let normalized = parsed.toString()
    if (normalized.endsWith('/') && parsed.pathname === '/') {
      normalized = normalized.slice(0, -1)
    }
    
    return normalized
  } catch {
    return null
  }
}

/**
 * Normalise et valide une adresse email
 */
export function normalizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  
  // Validation basique
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/
  
  if (!emailRegex.test(trimmed)) {
    return null
  }
  
  return trimmed
}

/**
 * Génère un fingerprint canonique pour une offre
 * Utilisé pour la déduplication
 */
export function generateOfferFingerprint(data: {
  title: string
  company_name: string
  location_city?: string
  contract_type?: string
}): string {
  const parts = [
    normalizeForFingerprint(data.title),
    normalizeForFingerprint(data.company_name),
    normalizeForFingerprint(data.location_city || ''),
    normalizeForFingerprint(data.contract_type || '')
  ]
  
  return parts.filter(Boolean).join('_')
}

/**
 * Normalise une chaîne pour fingerprint
 */
function normalizeForFingerprint(str: string | undefined | null): string {
  if (!str || str === 'undefined') {
    return ''
  }
  
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]/g, '')       // Garde seulement alphanum
    .slice(0, 50)                    // Limite la longueur
} 