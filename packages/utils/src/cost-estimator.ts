/**
 * Estimateur de coûts et durées pour les opérations IA
 */

// Prix OpenAI (en $ pour 1M tokens) - À mettre à jour selon les prix actuels
const OPENAI_PRICING = {
  'gpt-4o-mini': {
    input: 0.15,   // $0.15 per 1M input tokens
    output: 0.60   // $0.60 per 1M output tokens
  },
  'text-embedding-3-small': {
    input: 0.02    // $0.02 per 1M tokens
  }
}

// Estimations moyennes de tokens
const TOKEN_ESTIMATES = {
  offer_extraction: {
    input: 800,    // Description offre moyenne
    output: 400    // JSON structuré extrait
  },
  cv_parsing: {
    input: 2000,   // CV moyen 2 pages
    output: 800    // Profil structuré extrait
  },
  embedding_text: {
    input: 400     // Texte formaté pour embedding
  }
}

// Temps moyens d'exécution (en secondes)
const TIME_ESTIMATES = {
  offer_extraction: 2,
  cv_parsing: 3,
  embedding_generation: 0.5,
  database_write: 0.2
}

/**
 * Estime le coût d'une opération OpenAI
 */
export function estimateOpenAICost(
  operation: 'offer_extraction' | 'cv_parsing' | 'embedding',
  count: number = 1
): { cost: number; tokens: number } {
  let totalCost = 0
  let totalTokens = 0

  switch (operation) {
    case 'offer_extraction': {
      const inputTokens = TOKEN_ESTIMATES.offer_extraction.input * count
      const outputTokens = TOKEN_ESTIMATES.offer_extraction.output * count
      totalTokens = inputTokens + outputTokens
      
      totalCost = 
        (inputTokens / 1_000_000) * OPENAI_PRICING['gpt-4o-mini'].input +
        (outputTokens / 1_000_000) * OPENAI_PRICING['gpt-4o-mini'].output
      break
    }
    
    case 'cv_parsing': {
      const inputTokens = TOKEN_ESTIMATES.cv_parsing.input * count
      const outputTokens = TOKEN_ESTIMATES.cv_parsing.output * count
      totalTokens = inputTokens + outputTokens
      
      totalCost = 
        (inputTokens / 1_000_000) * OPENAI_PRICING['gpt-4o-mini'].input +
        (outputTokens / 1_000_000) * OPENAI_PRICING['gpt-4o-mini'].output
      break
    }
    
    case 'embedding': {
      const inputTokens = TOKEN_ESTIMATES.embedding_text.input * count
      totalTokens = inputTokens
      
      totalCost = 
        (inputTokens / 1_000_000) * OPENAI_PRICING['text-embedding-3-small'].input
      break
    }
  }

  return {
    cost: Math.round(totalCost * 10000) / 10000, // Arrondi à 4 décimales
    tokens: totalTokens
  }
}

/**
 * Estime la durée d'un batch
 */
export function estimateBatchDuration(
  type: 'offers_ingest' | 'cv_parsing' | 'embeddings_update',
  itemCount: number,
  concurrency: number = 3
): number {
  let timePerItem = 0

  switch (type) {
    case 'offers_ingest':
      timePerItem = 
        TIME_ESTIMATES.offer_extraction + 
        TIME_ESTIMATES.embedding_generation + 
        TIME_ESTIMATES.database_write
      break
      
    case 'cv_parsing':
      timePerItem = 
        TIME_ESTIMATES.cv_parsing + 
        TIME_ESTIMATES.embedding_generation + 
        TIME_ESTIMATES.database_write * 3 // Plus d'écritures DB
      break
      
    case 'embeddings_update':
      timePerItem = 
        TIME_ESTIMATES.embedding_generation + 
        TIME_ESTIMATES.database_write
      break
  }

  // Calcul avec concurrence
  const batches = Math.ceil(itemCount / concurrency)
  const totalSeconds = batches * timePerItem

  // Ajout d'une marge de 20% pour les delays réseau, retry, etc.
  return Math.ceil(totalSeconds * 1.2)
}

/**
 * Formate une durée en secondes en format lisible
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`
  }
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  
  return remainingMinutes > 0
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`
}

/**
 * Formate un coût en dollars
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
} 