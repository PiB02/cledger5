# Technical Reference - cledger5
*Auto-loaded by Claude Code - Complete Technical Specifications - Last Updated: 02/09/2025*

## 🏗️ **ARCHITECTURE SYSTÈME COMPLÈTE**

### **Stack Technique Détaillé**
```
┌─── Frontend ───┐    ┌──── Backend ────┐    ┌─── Database ───┐
│ Next.js 15     │    │ Route Handlers  │    │ PostgreSQL +   │
│ React 19       │◄──►│ + Supabase     │◄──►│ pgvector       │
│ Tailwind +     │    │ + OpenAI       │    │ + Partitioning │
│ shadcn/ui      │    │ + External APIs│    │ + HNSW Indexes │
└────────────────┘    └─────────────────┘    └────────────────┘

┌─── External ───┐    ┌──── Auth ───────┐    ┌─── Storage ────┐
│ LBA API        │    │ Clerk + RLS     │    │ Supabase       │
│ France Travail │◄──►│ + Middleware   │◄──►│ Storage        │
│ OAuth2 + Bearer│    │ + CSRF         │    │ + Signed URLs  │
└────────────────┘    └─────────────────┘    └────────────────┘
```

### **Data Pipeline Architecture**
```
External APIs          Raw Storage         Canonicalization      AI Enhancement         Vector Storage
┌─────────────┐       ┌─────────────┐     ┌─────────────────┐    ┌─────────────────┐   ┌─────────────────┐
│ LBA API     │       │ offers_raw  │     │ offers          │    │ GPT-4o-mini     │   │ offer_embeddings│
│ 5-20 req/s  │──────►│ (monthly    │────►│ + companies     │───►│ extraction      │──►│ pgvector 1536d  │
│             │       │ partitions) │     │ + locations     │    │ confidence≥0.80 │   │ HNSW indexes    │
└─────────────┘       └─────────────┘     └─────────────────┘    └─────────────────┘   └─────────────────┘

┌─────────────┐       
│ France      │       
│ Travail API │       
│ 10 req/s    │──────►
│ OAuth2      │       
└─────────────┘       
```

---

## 🔧 **DATABASE SCHEMA COMPLET**

### **Tables Principales (18+ Tables)**

#### **Job Offers & Companies**
```sql
-- Table principale des offres canoniques
offers (
    id uuid PRIMARY KEY,
    title text NOT NULL,
    company_id uuid REFERENCES companies(id),
    location_id uuid REFERENCES locations(id),
    rome_codes text[],
    contract_type contract_type_enum,
    salary_min integer,
    salary_max integer,
    work_mode work_mode_enum,
    created_at timestamptz DEFAULT now(),
    -- Partitioned by created_at (monthly)
)

-- Raw ingestion avec source tracking
offers_raw (
    id uuid PRIMARY KEY,
    source_type source_type_enum, -- 'lba' | 'france_travail'
    source_id text NOT NULL,
    canonical_fingerprint text UNIQUE, -- Pour déduplication
    raw_data jsonb NOT NULL,
    processed boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
    -- Partitioned by created_at + source_type
)

-- Embeddings vectoriels
offer_embeddings (
    id uuid PRIMARY KEY,
    offer_id uuid REFERENCES offers(id),
    embedding vector(1536), -- text-embedding-3-small
    embedding_model text DEFAULT 'text-embedding-3-small',
    embedding_text text NOT NULL,
    created_at timestamptz DEFAULT now()
)
-- Index: CREATE INDEX ON offer_embeddings USING hnsw (embedding vector_cosine_ops)
```

#### **CV Management System**
```sql
-- Sessions anonymes
anonymous_sessions (
    id uuid PRIMARY KEY,
    session_token uuid UNIQUE NOT NULL,
    client_ip inet,
    user_agent_hash text,
    browser_fingerprint text,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL,
    is_active boolean DEFAULT true
)

-- Sessions CV processing
anonymous_cv_sessions (
    id uuid PRIMARY KEY,
    anonymous_session_id uuid REFERENCES anonymous_sessions(id),
    filename text NOT NULL,
    file_size_bytes bigint NOT NULL,
    storage_path text NOT NULL,
    upload_status upload_status_enum, -- 'initiated'|'uploading'|'uploaded'|'processing'|'completed'|'failed'
    processing_status processing_status_enum DEFAULT 'pending',
    metadata jsonb DEFAULT '{}',
    partial_results jsonb,
    full_results_available boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz NOT NULL
)

-- CV profiles complets
cv_profiles (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    anonymous_session_id uuid REFERENCES anonymous_sessions(id),
    filename text,
    parsed_text text,
    ai_analysis jsonb, -- Résultats GPT-4o-mini
    skills_extracted jsonb,
    experience_level seniority_level_enum,
    years_experience integer,
    embedding vector(1536),
    created_at timestamptz DEFAULT now()
)
```

#### **User Features (Phase 12)**
```sql
-- Applications candidature
applications (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    offer_id uuid REFERENCES offers(id),
    external_offer_url text,
    application_type application_type_enum DEFAULT 'internal', -- 'internal'|'external'
    status application_status_enum DEFAULT 'applied',
    applied_at timestamptz DEFAULT now(),
    status_updated_at timestamptz DEFAULT now(),
    cover_letter text,
    additional_notes text,
    created_at timestamptz DEFAULT now()
)

-- Recherches sauvées
saved_searches (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    search_criteria jsonb NOT NULL, -- Critères de recherche flexibles
    alert_frequency alert_frequency_enum, -- 'never'|'daily'|'weekly'
    is_active boolean DEFAULT true,
    last_run_at timestamptz,
    created_at timestamptz DEFAULT now()
)

-- Alertes utilisateur
user_alerts (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    alert_type alert_type_enum NOT NULL, -- 'new_matches'|'application_update'|'system'
    preferences jsonb DEFAULT '{}',
    delivery_channels text[] DEFAULT ARRAY['email'], -- 'email'|'in_app'
    is_enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
)
```

### **Indexes Critiques**
```sql
-- Performance indexes
CREATE INDEX ON offers (created_at DESC) WHERE status = 'active';
CREATE INDEX ON offers USING gin (rome_codes);
CREATE INDEX ON offers (location_id) WHERE status = 'active';

-- Vector indexes pour matching sémantique
CREATE INDEX ON offer_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON cv_profiles USING hnsw (embedding vector_cosine_ops);

-- Deduplication
CREATE UNIQUE INDEX ON offers_raw (canonical_fingerprint);
CREATE INDEX ON offers_raw (source_type, created_at DESC);

-- User features
CREATE INDEX ON applications (user_id, created_at DESC);
CREATE INDEX ON saved_searches (user_id, is_active);
```

---

## 🤖 **FORMAT EMBEDDING STANDARDISÉ**

### **Template Canonical (≤1500 chars)**
```
TITLE: <titre canonique normalisé>
ROME: <code1>|<code2>|<code3>
LOCATION: <ville>|<département>|<région>|FR
SENIORITY: intern|junior|mid|senior|lead|manager
CONTRACT: CDI|CDD|APP|PRO|INTERIM|STAGE|UNKNOWN
WORK_MODE: onsite|remote|hybrid|unknown
LANGUAGES: fr=C2|en=B2|es=A1
DEGREE_EQF_MIN: 1|2|3|4|5|6|7|8|unknown
SKILLS_REQUIRED: skill1|skill2|skill3
SKILLS_PREFERRED: skill4|skill5|skill6
SALARY: 35000-45000 EUR annual|unknown
AVAILABILITY: 2025-03|ASAP|unknown
```

### **Normalisation Rules**
```javascript
// Skills normalization
const normalizeSkill = (skill) => {
    return skill
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s+#.-]/g, '')     // Keep only alphanumeric + common chars
        .trim()
}

// Location normalization
const normalizeLocation = (city, dept, region) => {
    return `${city.toUpperCase()}|${dept.toUpperCase()}|${region.toUpperCase()}|FR`
}

// ROME codes validation
const validateRomeCodes = (codes) => {
    return codes.filter(code => /^[A-Z]\d{4}$/.test(code))
}
```

---

## 🔌 **API ENDPOINTS COMPLET**

### **Authentication Flow**
```typescript
// Clerk middleware protection
export default authMiddleware({
    publicRoutes: ['/api/health', '/api/search/offers', '/api/offers/(.*)'],
    ignoredRoutes: ['/api/webhooks/(.*)']
})

// RLS Policy Example
CREATE POLICY "users_own_applications" ON applications
    FOR ALL USING (auth.uid() = user_id)
```

### **API Response Standards**
```typescript
// Success Response
interface ApiResponse<T> {
    success: true
    data: T
    metadata?: {
        total?: number
        page?: number
        hasMore?: boolean
    }
}

// Error Response  
interface ApiError {
    success: false
    error: string
    message: string
    details?: unknown
}

// SSE Event Format
interface SSEEvent {
    event: 'progress' | 'complete' | 'error'
    data: {
        progress?: number
        message: string
        result?: unknown
    }
}
```

### **Endpoint Specifications**

#### **Search & Offers**
```typescript
// GET /api/search/offers
interface SearchOffersRequest {
    q?: string              // Text search
    rome_codes?: string[]   // ROME code filters
    location_id?: string    // Location filter
    contract_types?: ContractType[]
    salary_min?: number
    work_mode?: WorkMode
    page?: number          // Default: 1
    limit?: number         // Default: 20, Max: 100
    sort?: 'relevance' | 'date' | 'salary'
}

interface SearchOffersResponse {
    success: true
    data: {
        offers: OfferSummary[]
        total: number
        page: number
        hasMore: boolean
    }
    metadata: {
        searchTime: number
        filters: SearchFilters
    }
}
```

#### **CV Processing**
```typescript
// POST /api/cv/upload/init
interface CVUploadInitRequest {
    filename: string
    file_size: number
    content_type: string
    file_hash?: string
}

interface CVUploadInitResponse {
    success: true
    session_id: string
    upload_url: string      // Supabase signed URL
    session_token: string
    anonymous_session_id: string
    file_path: string
}

// POST /api/cv/process
interface CVProcessResponse {
    success: true
    analysis: {
        confidence: number          // 0.0 - 1.0
        tokensUsed: number
        skillsCount: number
        experienceLevel: SeniorityLevel
        yearsExperience: number
        romeCodes: string[]
        languages: string[]
        embeddingDimensions: number
    }
}
```

---

## ⚡ **PERFORMANCE & OPTIMIZATION**

### **Performance Targets (ACHIEVED)**
- **Search API**: <500ms p95 ✅
- **Job Details**: <700ms p95 ✅  
- **CV Processing**: ~15s end-to-end ✅
- **SSE Streaming**: <2s initial response ✅

### **Database Optimization**
```sql
-- Partitioning strategy
CREATE TABLE offers_raw (
    LIKE template_table INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE offers_raw_202501 PARTITION OF offers_raw
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Vector index optimization
SET maintenance_work_mem = '2GB';
CREATE INDEX CONCURRENTLY ON offer_embeddings 
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

### **API Rate Limiting**
```typescript
// External APIs
const LBA_RATE_LIMIT = 20 // req/s (burst)
const LBA_SUSTAINED = 5   // req/s (sustained)
const FT_RATE_LIMIT = 10  // req/s (strict)
const FT_SAFETY_BUFFER = 8.3 // req/s (with buffer)

// OpenAI Cost Optimization
const GPT_4O_MINI_COST = 0.150 / 1000000 // per input token
const EMBEDDING_COST = 0.02 / 1000000    // per token
const AVERAGE_CV_TOKENS = 2296           // measured average
```

---

## 🔒 **SÉCURITÉ & COMPLIANCE**

### **Environment Variables Critiques**
```bash
# Authentication & Encryption
CLERK_SECRET_KEY=[required]
APP_PII_KEY=[required-for-pii-encryption]
ADMIN_SECRET=[required-for-admin-endpoints]

# Database
SUPABASE_SERVICE_ROLE_KEY=[required-for-admin-operations]

# AI Processing  
OPENAI_API_KEY=[required-for-cv-processing]

# External APIs
FT_CLIENT_ID=[required-for-france-travail]
FT_CLIENT_SECRET=[required-for-france-travail]
```

### **Row Level Security Policies**
```sql
-- User applications (Phase 12)
CREATE POLICY "users_own_applications" ON applications
    FOR ALL USING (auth.uid() = user_id);

-- Saved searches (Phase 12)  
CREATE POLICY "users_own_searches" ON saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- CV profiles
CREATE POLICY "users_own_cv_profiles" ON cv_profiles
    FOR ALL USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND anonymous_session_id IN (
            SELECT id FROM anonymous_sessions 
            WHERE session_token = current_setting('app.session_token', true)::uuid
        ))
    );

-- Public read access
CREATE POLICY "public_read_offers" ON offers
    FOR SELECT USING (status = 'active');
```

### **Data Protection (GDPR)**
```typescript
// PII Encryption (server-only)
const encryptPII = (data: string): string => {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.APP_PII_KEY!)
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
}

// Anonymous session cleanup (24h retention)
const cleanupExpiredSessions = async () => {
    await supabase
        .from('anonymous_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
}
```

---

## 🛠️ **DEBUGGING & TROUBLESHOOTING**

### **Common Issues & Solutions**

#### **CV Upload Errors**
```typescript
// Issue: "Failed to fetch" dans anonymous upload
// Cause: Upload URL incorrecte ou service non disponible
// Solution: Vérifier signed URL Supabase + storage bucket

// Issue: "upload_status constraint violation"
// Cause: Valeur non permise dans enum
// Solution: Utiliser 'initiated'|'uploading'|'uploaded'|'processing'|'completed'|'failed'
```

#### **Database Connection Issues**
```bash
# Check Supabase connection
supabase status
supabase db ping

# Reset local database
supabase db reset
supabase db push

# Check migrations
supabase migration list
```

#### **Performance Issues**
```sql
-- Analyze query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM offers 
WHERE status = 'active' 
ORDER BY created_at DESC 
LIMIT 20;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE tablename = 'offers';
```

### **Logging & Monitoring**
```typescript
// API Error Format
const logApiError = (req: NextRequest, error: Error) => {
    console.error({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        error: error.message,
        stack: error.stack,
        userId: req.headers.get('x-user-id')
    })
}

// Performance Metrics
const trackApiPerformance = (endpoint: string, duration: number) => {
    console.log({
        metric: 'api_response_time',
        endpoint,
        duration,
        timestamp: new Date().toISOString()
    })
}
```

---

*Technical Reference Complete - Production-Ready System - All Specifications Current*