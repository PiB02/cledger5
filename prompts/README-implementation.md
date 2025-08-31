# Guide d'Implémentation - Système d'Extraction GPT-4o-mini

> 🎯 **Objectif** : Système de prompts optimisé pour extraction d'informations métier françaises avec scoring de confiance ≥0.80

## Vue d'Ensemble du Système

### Architecture des Prompts

```
prompts/offer-extraction/
├── system-prompt-v1.yaml              # Prompt système principal
├── complete-extraction-v1.yaml        # Prompt maître pour extraction complète  
├── skills-extraction-v1.yaml          # Spécialisé compétences
├── seniority-classification-v1.yaml   # Spécialisé niveaux séniorité
├── languages-extraction-v1.yaml       # Spécialisé langues CEFR
├── degrees-classification-v1.yaml     # Spécialisé diplômes EQF
├── confidence-scoring-logic.yaml      # Logique de scoring et error handling
└── test-examples-v1.yaml             # Cas de tests et validation
```

### Spécifications Techniques

- **Modèle** : GPT-4o-mini (coût-efficace)
- **Seuil de confiance** : ≥0.80 (qualité garantie)
- **Format output** : JSON strict compatible Zod schemas
- **Coût unitaire estimé** : ~$0.0008 par offre
- **Performance cible** : <2s p95 extraction

## Intégration avec l'Architecture Existante

### 1. Compatibilité Types Existants

Le système est conçu pour alimenter directement les schemas Zod existants :

```typescript
// Compatible avec packages/types/src/offers.ts
interface ExtractionResult extends OfferEnrichment {
  confidence_scores: {
    skills: number
    seniority: number  
    languages: number
    degrees: number
    global: number      // Doit être ≥ 0.80
  }
}
```

### 2. Pipeline d'Extraction Recommandé

```typescript
// src/lib/ai/offer-extraction.ts
export class OfferExtractor {
  
  async extractOfferData(offer: {
    title: string
    description: string
    rome_codes?: string[]
  }): Promise<ExtractionResult> {
    
    // 1. Validation input
    if (!this.isValidInput(offer)) {
      throw new Error('Invalid input data')
    }
    
    // 2. Construction prompt avec template
    const prompt = this.buildExtractionPrompt(offer)
    
    // 3. Appel OpenAI avec retry logic
    const response = await this.callGPTWithRetry(prompt)
    
    // 4. Validation JSON + confidence
    const parsed = this.validateAndParse(response)
    
    // 5. Rejet si confidence < 0.80
    if (parsed.confidence_scores.global < 0.80) {
      return this.handleLowConfidence(offer, parsed)
    }
    
    // 6. Normalisation et mapping vers DB schema
    return this.mapToDbSchema(parsed)
  }
}
```

### 3. Configuration OpenAI Optimisée

```typescript
// src/lib/openai/client.ts
const openaiConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.1,        // Déterminisme maximal
  max_tokens: 2000,        // Suffisant pour JSON complet
  response_format: { type: 'json_object' },
  timeout: 30000           // 30s timeout
}
```

## Stratégies d'Optimisation Coût/Performance

### 1. Caching Intelligent

```typescript
// Cache des extractions par fingerprint offre
interface ExtractionCache {
  fingerprint: string      // generateOfferFingerprint()
  extraction: ExtractionResult
  expires_at: Date
  version: string         // Version prompt pour invalidation
}

// Stratégie de cache
const cacheStrategy = {
  ttl: 24 * 60 * 60 * 1000,     // 24h pour offres stables
  maxSize: 10000,               // 10k extractions en cache
  invalidateOnPromptChange: true
}
```

### 2. Batch Processing

```typescript
// Traitement par lots avec rate limiting
class BatchExtractor {
  private concurrency = 3      // Max 3 appels simultanés
  private rateLimit = 1000     // 1 appel/seconde max
  
  async processBatch(offers: Offer[]): Promise<ExtractionResult[]> {
    // Groupement par similarité pour réutiliser contexte
    const groups = this.groupBySimilarity(offers)
    
    return Promise.all(
      groups.map(group => 
        this.processGroup(group, { useSharedContext: true })
      )
    )
  }
}
```

### 3. Monitoring Coûts

```typescript
// Tracking des métriques d'usage
interface ExtractionMetrics {
  totalCalls: number
  totalCost: number
  averageLatency: number
  successRate: number       // Taux confidence ≥ 0.80
  errorRate: number
  costPerOffer: number
}

// Alertes budgétaires
const budgetAlerts = {
  dailyLimit: 50,           // $50/jour max
  monthlyLimit: 1000,       // $1000/mois max
  costPerOfferMax: 0.002    // $0.002 max par offre
}
```

## Gestion d'Erreurs et Fallbacks

### 1. Hiérarchie de Fallbacks

```typescript
async function extractWithFallbacks(offer: Offer): Promise<ExtractionResult> {
  
  // Tentative 1: Extraction complète
  try {
    const result = await fullExtraction(offer)
    if (result.confidence_scores.global >= 0.80) {
      return result
    }
  } catch (error) {
    console.warn('Full extraction failed:', error)
  }
  
  // Tentative 2: Extraction simplifiée (skills only)
  try {
    const result = await skillsOnlyExtraction(offer)
    if (result.skills_required.length > 0) {
      return result
    }
  } catch (error) {
    console.warn('Skills extraction failed:', error)
  }
  
  // Tentative 3: Extraction minimale (titre + seniority)
  try {
    return await minimalExtraction(offer)
  } catch (error) {
    // Dernière tentative : valeurs par défaut
    return createFallbackResult(offer, error)
  }
}
```

### 2. Error Classification

```typescript
enum ExtractionErrorType {
  JSON_PARSE_ERROR = 'json_parse_error',
  LOW_CONFIDENCE = 'low_confidence',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  API_ERROR = 'api_error',
  VALIDATION_ERROR = 'validation_error'
}

// Actions par type d'erreur
const errorStrategies = {
  [ExtractionErrorType.JSON_PARSE_ERROR]: retryWithJSONRepair,
  [ExtractionErrorType.LOW_CONFIDENCE]: trySimplifiedPrompt,
  [ExtractionErrorType.RATE_LIMIT]: exponentialBackoff,
  [ExtractionErrorType.TIMEOUT]: retryWithShorterPrompt,
  [ExtractionErrorType.API_ERROR]: checkAPIStatus,
  [ExtractionErrorType.VALIDATION_ERROR]: logAndFallback
}
```

## Métriques et KPIs

### 1. Métriques de Qualité

```sql
-- Taux de succès extraction
SELECT 
  COUNT(*) FILTER (WHERE confidence_global >= 0.80) * 100.0 / COUNT(*) as success_rate,
  AVG(confidence_global) as avg_confidence,
  COUNT(*) FILTER (WHERE parse_status = 'error') * 100.0 / COUNT(*) as error_rate
FROM offer_enrichment 
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Distribution des scores de confiance
SELECT 
  CASE 
    WHEN confidence_global >= 0.95 THEN 'excellent'
    WHEN confidence_global >= 0.90 THEN 'very_good'
    WHEN confidence_global >= 0.80 THEN 'good' 
    ELSE 'rejected'
  END as quality_tier,
  COUNT(*) as count
FROM offer_enrichment
GROUP BY 1;
```

### 2. Métriques de Performance

```typescript
// Dashboard de monitoring
interface ExtractionDashboard {
  performance: {
    avgLatency: number      // Temps moyen extraction
    p95Latency: number      // P95 latence  
    throughput: number      // Offres/minute
  }
  
  quality: {
    successRate: number     // % avec confidence ≥ 0.80
    avgConfidence: number   // Confidence moyenne
    skillsCoverage: number  // % offres avec skills extraites
  }
  
  costs: {
    totalCost: number       // Coût total période
    costPerOffer: number    // Coût moyen par offre
    budgetUtilization: number // % budget utilisé
  }
}
```

## Évolution et Maintenance

### 1. Versioning des Prompts

```yaml
# Convention de versioning
version_format: "vMAJOR.MINOR"
# MAJOR: Changements breaking (schema JSON)
# MINOR: Améliorations (wording, exemples)

# Migration strategy
migration_strategy:
  - Test nouvelle version sur échantillon 10%
  - A/B test pendant 7 jours minimum
  - Validation métriques (success rate, confidence)
  - Rollout progressif si amélioration
```

### 2. Amélioration Continue

```typescript
// Collecte feedback pour amélioration prompts
interface PromptFeedback {
  prompt_version: string
  offer_id: string
  extraction_quality: 'excellent' | 'good' | 'poor'
  issues: string[]          // Ex: ["missing_skill", "wrong_seniority"]
  human_correction?: any    // Correction manuelle si disponible
}

// Analyse des échecs pour amélioration
function analyzeFailures(failures: ExtractionResult[]): PromptImprovementSuggestions {
  const patterns = extractFailurePatterns(failures)
  return {
    commonErrors: patterns.errors,
    suggestedPromptChanges: patterns.improvements,
    testCasesToAdd: patterns.edgeCases
  }
}
```

### 3. Roadmap d'Optimisation

**Phase 1 (Immédiate)** :
- [ ] Implémentation prompt système principal
- [ ] Tests sur échantillon 100 offres LBA
- [ ] Validation pipeline avec types existants

**Phase 2 (1 mois)** :
- [ ] Optimisation prompts spécialisés  
- [ ] Cache intelligent avec fingerprinting
- [ ] Monitoring et alertes coûts

**Phase 3 (3 mois)** :
- [ ] A/B testing versions prompts
- [ ] ML pour pré-filtrage offres
- [ ] API rate limiting optimisé

## Checklist de Déploiement

### Pré-Déploiement
- [ ] Tests unitaires tous prompts
- [ ] Validation JSON schemas avec Zod
- [ ] Test batch sur 1000+ offres échantillon
- [ ] Configuration monitoring/alertes
- [ ] Documentation API endpoints

### Déploiement
- [ ] Configuration OpenAI client
- [ ] Migration schema DB si nécessaire  
- [ ] Déploiement avec feature flag
- [ ] Test smoke production
- [ ] Activation progressive (10% → 50% → 100%)

### Post-Déploiement
- [ ] Monitoring métriques 48h
- [ ] Validation coûts vs budget
- [ ] Collecte premiers feedbacks qualité
- [ ] Ajustements prompts si nécessaire

---

**Contact** : L'équipe AI/Prompts pour questions techniques et optimisations