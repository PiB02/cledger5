# Phase 10 CV Backend Architecture Design

## Overview

This document outlines the complete backend architecture for CV processing and management in Cledger5 Phase 10. The design leverages existing infrastructure while adding specialized CV processing capabilities.

## 1. DATABASE SCHEMA EXTENSIONS

### Additional Tables Required

```sql
-- CV Upload Sessions (for multi-file uploads and progress tracking)
CREATE TABLE IF NOT EXISTS cv_upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('uploading', 'processing', 'completed', 'failed')) DEFAULT 'uploading',
  files_expected INTEGER NOT NULL DEFAULT 1,
  files_uploaded INTEGER NOT NULL DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- CV Processing Queue (for background job management)
CREATE TABLE IF NOT EXISTS cv_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID NOT NULL REFERENCES cv_profiles(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES cv_documents(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 10 CHECK (priority BETWEEN 1 AND 100),
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')) DEFAULT 'queued',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  processing_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CV File Validation Results
CREATE TABLE IF NOT EXISTS cv_file_validations (
  document_id UUID PRIMARY KEY REFERENCES cv_documents(id) ON DELETE CASCADE,
  file_type_validated TEXT NOT NULL, -- 'pdf', 'docx', 'doc'
  file_size_bytes BIGINT NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT FALSE,
  validation_errors JSONB, -- Array of validation error codes
  content_preview TEXT, -- First 500 chars for debugging
  language_detected TEXT, -- 'fr', 'en', etc.
  page_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CV Processing Metrics (for performance monitoring)
CREATE TABLE IF NOT EXISTS cv_processing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hour INTEGER NOT NULL DEFAULT EXTRACT(hour FROM NOW()),
  total_uploads INTEGER NOT NULL DEFAULT 0,
  successful_processing INTEGER NOT NULL DEFAULT 0,
  failed_processing INTEGER NOT NULL DEFAULT 0,
  avg_processing_time_ms INTEGER,
  avg_file_size_bytes BIGINT,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd NUMERIC(10,6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, hour)
);
```

### Indexes for Performance

```sql
-- Upload sessions
CREATE INDEX cv_upload_sessions_user_status_idx ON cv_upload_sessions(user_id, status);
CREATE INDEX cv_upload_sessions_expires_idx ON cv_upload_sessions(expires_at) WHERE status IN ('uploading', 'processing');

-- Processing queue
CREATE INDEX cv_processing_queue_status_priority_idx ON cv_processing_queue(status, priority DESC, created_at);
CREATE INDEX cv_processing_queue_cv_idx ON cv_processing_queue(cv_id);
CREATE INDEX cv_processing_queue_retry_idx ON cv_processing_queue(retry_count, max_retries) WHERE status = 'failed';

-- Metrics
CREATE INDEX cv_processing_metrics_date_hour_idx ON cv_processing_metrics(date DESC, hour DESC);
```

## 2. API ARCHITECTURE

### Core Endpoints

#### A. File Upload System

**POST /api/cv/upload/init**
```typescript
// Request
interface CVUploadInitRequest {
  files: Array<{
    name: string;
    size: number;
    type: string; // MIME type
  }>;
  replace_existing?: boolean;
}

// Response
interface CVUploadInitResponse {
  session_id: string;
  upload_urls: Array<{
    file_index: number;
    upload_url: string; // Supabase Storage signed URL
    expires_at: string;
  }>;
  expires_at: string;
}
```

**POST /api/cv/upload/complete**
```typescript
interface CVUploadCompleteRequest {
  session_id: string;
  files: Array<{
    file_index: number;
    storage_path: string;
    actual_size: number;
  }>;
}

interface CVUploadCompleteResponse {
  success: boolean;
  cv_id: string;
  processing_started: boolean;
  estimated_completion: string; // ISO timestamp
}
```

**GET /api/cv/upload/status/{session_id}**
```typescript
interface CVUploadStatusResponse {
  session_id: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  files_uploaded: number;
  files_expected: number;
  processing_progress?: {
    current_step: string;
    progress_percent: number;
    estimated_remaining_ms: number;
  };
  error_message?: string;
}
```

#### B. CV Processing Pipeline

**POST /api/cv/process/{cv_id}**
```typescript
interface CVProcessRequest {
  force_reprocess?: boolean;
  processing_options?: {
    extract_skills?: boolean;
    extract_languages?: boolean;
    extract_experiences?: boolean;
    extract_degrees?: boolean;
    generate_embeddings?: boolean;
  };
}

interface CVProcessResponse {
  success: boolean;
  queue_position: number;
  estimated_processing_time_ms: number;
  processing_id: string;
}
```

**GET /api/cv/process/{processing_id}/stream**
Server-Sent Events endpoint for real-time processing updates:
```typescript
interface CVProcessingEvent {
  type: 'progress' | 'completed' | 'error';
  data: {
    progress_percent: number;
    current_step: string;
    step_details?: any;
    error_message?: string;
  };
  timestamp: string;
}
```

#### C. CV Management

**GET /api/cv/profile**
```typescript
interface CVProfileResponse {
  cv_id: string;
  status: 'draft' | 'processing' | 'active' | 'archived';
  document?: {
    id: string;
    filename: string;
    file_size: number;
    uploaded_at: string;
  };
  parsing_status: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    completed_at?: string;
    confidence_scores?: Record<string, number>;
  };
  profile_data: {
    profile_title?: string;
    career_level?: string;
    seniority_years?: number;
    skills: Array<{
      skill_label: string;
      level?: number;
      confidence: number;
    }>;
    languages: Array<{
      code: string;
      cefr_level: number;
    }>;
    experiences: Array<{
      title: string;
      company: string;
      duration_months: number;
    }>;
    degrees: Array<{
      eqf_level: number;
      label: string;
    }>;
  };
  matching_stats: {
    embedding_status: 'pending' | 'generated';
    last_match_run?: string;
    total_matches?: number;
    top_match_score?: number;
  };
}
```

**PUT /api/cv/profile/{cv_id}**
```typescript
interface CVProfileUpdateRequest {
  profile_data: {
    profile_title?: string;
    profile_summary?: string;
    career_level?: string;
    skills?: Array<{
      skill_label: string;
      level?: number;
    }>;
    // ... other fields
  };
  privacy_settings?: {
    is_searchable?: boolean;
    allow_recruiter_contact?: boolean;
  };
}
```

**DELETE /api/cv/profile/{cv_id}**
GDPR-compliant deletion with audit trail.

#### D. CV Search & Discovery

**GET /api/cv/search**
```typescript
interface CVSearchRequest {
  query?: string;
  filters?: {
    career_levels?: string[];
    rome_codes?: string[];
    skills?: string[];
    locations?: string[];
    seniority_years_min?: number;
    seniority_years_max?: number;
    languages?: Array<{ code: string; min_cefr?: number }>;
  };
  sort?: 'relevance' | 'updated_at' | 'seniority_years';
  page?: number;
  limit?: number;
}

interface CVSearchResponse {
  results: Array<{
    cv_id: string;
    profile_title: string;
    career_level: string;
    seniority_years: number;
    location?: string;
    top_skills: string[];
    languages: string[];
    match_score?: number;
    updated_at: string;
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  aggregations: {
    career_levels: Record<string, number>;
    top_skills: Record<string, number>;
    locations: Record<string, number>;
  };
}
```

#### E. Admin & Analytics

**GET /api/admin/cv/stats**
```typescript
interface CVAdminStatsResponse {
  totals: {
    profiles: number;
    documents: number;
    processing_queue: number;
    failed_processing: number;
  };
  processing_metrics: {
    avg_processing_time_ms: number;
    success_rate: number;
    daily_uploads: Array<{
      date: string;
      count: number;
    }>;
  };
  costs: {
    total_tokens_used: number;
    estimated_total_cost_usd: number;
    cost_per_cv: number;
  };
}
```

## 3. FILE PROCESSING PIPELINE

### Pipeline Architecture

```
1. File Upload → Supabase Storage
2. File Validation → cv_file_validations
3. Queue Job → cv_processing_queue
4. Text Extraction → cv_documents.extracted_text
5. AI Parsing → GPT-4o-mini → cv_parse_runs
6. Data Storage → cv_skills, cv_experiences, etc.
7. Embedding Generation → cv_embeddings
8. Profile Publishing → candidate_public_profiles
```

### Processing Steps Implementation

#### Step 1: File Validation
```typescript
interface FileValidationResult {
  isValid: boolean;
  fileType: 'pdf' | 'docx' | 'doc';
  sizeBytes: number;
  errors: Array<{
    code: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  contentPreview?: string;
  languageDetected?: string;
  pageCount?: number;
}

async function validateCVFile(file: File): Promise<FileValidationResult>
```

#### Step 2: Text Extraction
```typescript
interface TextExtractionResult {
  success: boolean;
  extractedText: string;
  metadata: {
    pageCount: number;
    wordCount: number;
    characterCount: number;
    tables: number;
    images: number;
  };
  warnings: string[];
}

async function extractTextFromCV(filePath: string): Promise<TextExtractionResult>
```

#### Step 3: AI Parsing with GPT-4o-mini
```typescript
interface CVParsingResult {
  confidence: number;
  extractedData: {
    personalInfo: {
      name?: string;
      email?: string;
      phone?: string;
    };
    professional: {
      title?: string;
      summary?: string;
      careerLevel?: string;
      totalExperience?: number;
    };
    skills: Array<{
      name: string;
      normalized: string;
      level?: number;
      confidence: number;
      evidence: string;
    }>;
    experiences: Array<{
      title: string;
      company: string;
      startDate?: string;
      endDate?: string;
      description: string;
      skills: string[];
    }>;
    degrees: Array<{
      level: string;
      levelEqf?: number;
      field: string;
      institution?: string;
      year?: number;
    }>;
    languages: Array<{
      code: string;
      name: string;
      level: string;
      cefr?: number;
      confidence: number;
    }>;
  };
  processingMetadata: {
    model: string;
    tokensUsed: number;
    processingTimeMs: number;
    cost: number;
  };
}
```

#### Step 4: Embedding Generation
Reuse existing `buildEmbeddingText` utility with CV context:

```typescript
// Use existing embedding text builder
const embeddingText = buildEmbeddingText('cv', {
  title_canonical: cvData.professional.title || 'Professionnel',
  rome_codes: inferredRomeCodes,
  city: location?.city,
  department_code: location?.department_code,
  region_code: location?.region_code,
  career_level: cvData.professional.careerLevel,
  // ... other fields
  degree_top_eqf: Math.max(...cvData.degrees.map(d => d.levelEqf || 0)),
  skills_required: cvData.skills.filter(s => s.level >= 4).map(s => s.normalized),
  skills_preferred: cvData.skills.filter(s => s.level < 4).map(s => s.normalized),
  availability: 'ASAP' // CVs typically show immediate availability
});
```

## 4. SECURITY IMPLEMENTATION

### PII Encryption Strategy
- Reuse existing `pii_encrypt()` and `pii_decrypt()` functions
- All personally identifiable information stored in `pii_profiles` table
- CV document content scrubbed after retention period
- Access controlled via RLS policies

### File Security
```typescript
// Secure file upload with virus scanning
interface FileSecurityCheck {
  virusScanResult: 'clean' | 'infected' | 'unknown';
  contentTypeValidated: boolean;
  fileSizeWithinLimits: boolean;
  fileStructureValid: boolean;
}
```

### Access Control Patterns
```typescript
// Following existing Clerk + Supabase RLS patterns
async function checkCVAccess(cvId: string, action: 'read' | 'write' | 'delete'): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  
  // Admin has full access
  if (user.role === 'admin') return true;
  
  // User can access their own CV
  const supabase = await createSupabaseClerkClient();
  const { data: cv } = await supabase
    .from('cv_profiles')
    .select('user_id')
    .eq('id', cvId)
    .single();
    
  return cv?.user_id === user.id;
}
```

## 5. PERFORMANCE OPTIMIZATION STRATEGY

### Concurrent Processing
- Queue-based processing with priority levels
- Batch processing for multiple CVs
- Rate limiting for OpenAI API calls
- Connection pooling for database operations

### Caching Strategy
```typescript
// Cache frequently accessed CV profiles
interface CVCache {
  profile: LRUCache<string, CVProfileResponse>;
  embeddings: LRUCache<string, Float32Array>;
  searchResults: LRUCache<string, CVSearchResponse>;
}
```

### Performance Targets
- File upload: <5s for files up to 10MB
- Text extraction: <10s average
- AI parsing: <15s average  
- Embedding generation: <3s average
- **Total processing time: <30s for standard CV**

### Monitoring & Metrics
- Processing time tracking per step
- Success/failure rates
- Cost tracking (OpenAI API)
- Queue depth monitoring
- Error categorization and alerting

## 6. INTEGRATION PLAN

### Leverage Existing Infrastructure

#### Authentication & Authorization
- Use existing Clerk integration (`createSupabaseClerkClient`)
- Extend existing RLS policies for CV tables
- Reuse admin authentication patterns

#### Error Handling
- Use existing `errorFactory` and `httpErrorMap`
- Follow established error response patterns
- Maintain consistent logging standards

#### AI Processing
- Extend existing OpenAI integration patterns
- Reuse cost tracking and token monitoring
- Follow existing batch processing approach

#### Database Operations  
- Use existing Supabase service role client
- Follow established migration patterns
- Extend existing KPI and metrics collection

#### File Storage
- Integrate with Supabase Storage
- Follow existing security patterns for file access
- Implement retention policies consistent with GDPR

### Migration Strategy

1. **Phase 10.1**: Core upload and parsing infrastructure
2. **Phase 10.2**: AI processing and embedding generation  
3. **Phase 10.3**: Search and matching integration
4. **Phase 10.4**: Admin interfaces and monitoring
5. **Phase 10.5**: Performance optimization and scaling

This architecture provides a robust, secure, and performant foundation for CV processing while seamlessly integrating with Cledger5's existing infrastructure patterns.