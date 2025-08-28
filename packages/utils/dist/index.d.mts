/**
 * Embedding text builder selon PRD section 3.1
 * Format unifié pour offres et CV pour maximiser la similarité sémantique
 */
type EmbeddingContext = 'offer' | 'cv';
interface CanonicalizedInput {
    title_canonical: string;
    rome_codes?: string[];
    city?: string;
    department_code?: string;
    region_code?: string;
    career_level?: string;
    contract_type_code?: string;
    work_mode_code?: string;
    languages?: Array<{
        code: string;
        cefr: number;
    }>;
    degree_min_eqf?: number;
    degree_top_eqf?: number;
    skills_required?: string[];
    skills_preferred?: string[];
    salary_min?: number;
    salary_max?: number;
    salary_period?: string;
    availability?: string;
    contract_start_date?: string;
}
/**
 * Convertit un niveau CEFR numérique (1-6) en string (A1-C2)
 */
declare function toCEFR(n?: number): string;
/**
 * Normalise une compétence : lowercase, unaccent, trim
 */
declare function normSkill(s: string): string;
/**
 * Construit le texte d'embedding selon les specs PRD section 3.1
 * @param ctx - 'offer' ou 'cv'
 * @param data - Données canonisées
 * @returns Texte formaté pour embedding (max 1500 caractères)
 * @throws Error si le texte dépasse 1500 caractères ou si les skills requises sont vides pour une offre
 */
declare function buildEmbeddingText(ctx: EmbeddingContext, data: CanonicalizedInput): string;
/**
 * Calcule le hash SHA-256 du texte d'embedding
 * @param text - Texte d'embedding
 * @returns Hash SHA-256 en hexadécimal
 */
declare function hashEmbeddingText(text: string): Promise<string>;

/**
 * Estimateur de coûts et durées pour les opérations IA
 */
/**
 * Estime le coût d'une opération OpenAI
 */
declare function estimateOpenAICost(operation: 'offer_extraction' | 'cv_parsing' | 'embedding', count?: number): {
    cost: number;
    tokens: number;
};
/**
 * Estime la durée d'un batch
 */
declare function estimateBatchDuration(type: 'offers_ingest' | 'cv_parsing' | 'embeddings_update', itemCount: number, concurrency?: number): number;
/**
 * Formate une durée en secondes en format lisible
 */
declare function formatDuration(seconds: number): string;
/**
 * Formate un coût en dollars
 */
declare function formatCost(cost: number): string;

/**
 * Fonctions de normalisation communes
 */
/**
 * Normalise un numéro de téléphone français
 */
declare function normalizePhoneNumber(phone: string): string;
/**
 * Normalise un code SIRET (14 chiffres)
 */
declare function normalizeSiret(siret: string): string | null;
/**
 * Normalise un code postal français
 */
declare function normalizePostalCode(code: string): string | null;
/**
 * Normalise un code ROME (1 lettre + 4 chiffres)
 */
declare function normalizeRomeCode(code: string): string | null;
/**
 * Normalise un code NAF (4 chiffres + 1 lettre)
 */
declare function normalizeNafCode(code: string): string | null;
/**
 * Normalise une URL
 */
declare function normalizeUrl(url: string): string | null;
/**
 * Normalise et valide une adresse email
 */
declare function normalizeEmail(email: string): string | null;
/**
 * Génère un fingerprint canonique pour une offre
 * Utilisé pour la déduplication
 */
declare function generateOfferFingerprint(data: {
    title: string;
    company_name: string;
    location_city?: string;
    contract_type?: string;
}): string;

export { type EmbeddingContext, buildEmbeddingText, estimateBatchDuration, estimateOpenAICost, formatCost, formatDuration, generateOfferFingerprint, hashEmbeddingText, normSkill, normalizeEmail, normalizeNafCode, normalizePhoneNumber, normalizePostalCode, normalizeRomeCode, normalizeSiret, normalizeUrl, toCEFR };
