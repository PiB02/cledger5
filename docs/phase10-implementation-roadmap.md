# Phase 10 Implementation Roadmap: CV Processing & Management

## Overview

This roadmap provides concrete next steps for implementing Phase 10 CV processing infrastructure in Cledger5. The backend architecture leverages all existing infrastructure patterns while adding specialized CV processing capabilities.

## ✅ Completed Design Components

### 1. Database Schema Extensions
- **File**: `supabase/migrations/20250901000000_phase10_cv_processing_extensions.sql`
- **Status**: Complete migration ready for deployment
- **Features**: Upload sessions, processing queue, file validation, metrics tracking
- **Security**: Full RLS policies following Cledger5 patterns

### 2. API Architecture Design  
- **File**: `docs/phase10-cv-backend-architecture.md`
- **Status**: Complete endpoint specifications with request/response schemas
- **Features**: Upload init/complete, processing pipeline, CV management, search
- **Patterns**: Follows existing error handling, authentication, and validation patterns

### 3. Type System
- **File**: `packages/types/src/cv.ts`
- **Status**: Complete TypeScript types with Zod validation schemas
- **Features**: All API types, database schemas, processing types
- **Integration**: Compatible with existing `@cledger5/types` package

### 4. Starter Implementation
- **File**: `src/app/api/cv/upload/init/route.ts`
- **Status**: Complete reference implementation
- **Features**: Demonstrates Clerk auth, Supabase integration, error handling
- **Patterns**: Uses `withErrorHandler`, `createSupabaseClerkClient`, proper validation

## 📋 Implementation Tasks

### Phase 10.1: Core Upload Infrastructure (Week 1)

#### T-101: Database Setup
```bash
# Apply the migration
supabase link --project-ref <your-ref>
supabase db push

# Verify tables created
supabase sql --execute "SELECT schemaname,tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'cv_%';"
```

#### T-102: Complete Upload API Endpoints
- [x] `/api/cv/upload/init` - Reference implementation complete
- [ ] `/api/cv/upload/complete` - Mark session complete and trigger processing
- [ ] `/api/cv/upload/status/{session_id}` - Real-time upload progress
- [ ] `/api/cv/upload/cancel/{session_id}` - Cancel upload session

**Implementation Pattern:**
```typescript
// Use existing patterns from embeddings/generate/route.ts
export const POST = withErrorHandler(async (request: NextRequest) => {
  await requireAuth() // or getCurrentUser()
  const validatedRequest = Schema.parse(await request.json())
  const supabase = await createSupabaseClerkClient()
  // ... business logic
  return NextResponse.json(responseSchema.parse(response))
})
```

#### T-103: Supabase Storage Configuration
```typescript
// Create storage bucket for CV documents
await supabase.storage.createBucket('cv-documents', {
  public: false,
  fileSizeLimit: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
})
```

### Phase 10.2: File Processing Pipeline (Week 2)

#### T-104: Text Extraction Service
**File**: `src/lib/cv/text-extractor.ts`
```typescript
// Use libraries like pdf-parse for PDFs, mammoth for DOCX
export async function extractTextFromCV(
  storageUrl: string, 
  fileType: CVFileType
): Promise<TextExtractionResult>
```

#### T-105: File Validation Service  
**File**: `src/lib/cv/file-validator.ts`
```typescript
export async function validateCVFile(
  file: File | Buffer,
  filename: string
): Promise<FileValidationResult>
```

#### T-106: Processing Queue Worker
**File**: `src/lib/cv/queue-worker.ts`
```typescript
// Background job processor using existing SSE patterns
export class CVProcessingWorker {
  async processNext(): Promise<void>
  async handleProcessingStep(step: CVProcessingStep): Promise<void>
}
```

#### T-107: AI Parsing Integration
**File**: `src/lib/cv/ai-parser.ts`
```typescript
// Extend existing OpenAI patterns from offer enrichment
export async function parseCV(
  extractedText: string,
  options: CVProcessRequest['processing_options']
): Promise<CVParsingResult>
```

### Phase 10.3: Core CV Management (Week 3)

#### T-108: CV Profile APIs
- [ ] `GET /api/cv/profile` - Get user's CV profile
- [ ] `PUT /api/cv/profile/{cv_id}` - Update CV profile  
- [ ] `DELETE /api/cv/profile/{cv_id}` - GDPR-compliant deletion
- [ ] `POST /api/cv/process/{cv_id}` - Trigger reprocessing

#### T-109: Processing Status & SSE
- [ ] `GET /api/cv/process/{processing_id}/stream` - Real-time processing updates
- [ ] Integrate with existing SSE patterns from `batch/[id]/stream/route.ts`

#### T-110: Embedding Generation Integration
```typescript
// Extend existing embeddings/generate/route.ts for CVs
export async function generateCVEmbedding(
  cvId: string,
  forceRegenerate?: boolean
): Promise<EmbeddingResponse>
```

### Phase 10.4: Search & Discovery (Week 4)

#### T-111: CV Search API
- [ ] `GET /api/cv/search` - Semantic CV search for recruiters
- [ ] Integrate with existing search patterns from `search/offers/route.ts`
- [ ] Support hybrid search (text + vector similarity)

#### T-112: Matching Integration
- [ ] Extend existing matching pipeline for CV ↔ Offer matching
- [ ] Use existing `match_scores` table with proper RLS
- [ ] Integrate with existing vector search infrastructure

### Phase 10.5: Admin & Monitoring (Week 5)

#### T-113: Admin Dashboard APIs
- [ ] `GET /api/admin/cv/stats` - Processing metrics and costs
- [ ] `GET /api/admin/cv/queue` - Queue management
- [ ] `POST /api/admin/cv/reprocess` - Bulk reprocessing

#### T-114: Performance Optimization
- [ ] Implement batch processing for multiple CVs
- [ ] Add connection pooling for high-volume processing  
- [ ] Implement caching for frequently accessed profiles

## 🛠️ Technical Implementation Details

### Required Dependencies
```json
{
  "dependencies": {
    "pdf-parse": "^1.1.1",
    "mammoth": "^1.6.0", 
    "file-type": "^19.0.0",
    "langdetect": "^1.0.1"
  }
}
```

### Environment Variables
```bash
# Already configured
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=...
APP_PII_KEY=... # For PII encryption

# New for CV processing
CV_UPLOAD_MAX_SIZE_MB=10
CV_PROCESSING_TIMEOUT_MS=30000
CV_STORAGE_RETENTION_DAYS=90
```

### Storage Configuration
```sql
-- Supabase Storage policies
CREATE POLICY "CV documents access" ON storage.objects
FOR ALL USING (
  bucket_id = 'cv-documents' 
  AND (
    app_is_admin() 
    OR auth.uid()::text = (storage.foldername(name))[1]
  )
);
```

## 🔧 Development Commands

```bash
# Development  
pnpm dev              # Start with Turbopack

# Database
supabase db push      # Apply migrations
supabase db reset     # Reset local DB

# Testing
pnpm test:cv          # Run CV processing tests
pnpm test:api         # Run API integration tests

# Production
pnpm build            # Build for production
pnpm start            # Start production server
```

## 📊 Success Metrics

### Performance Targets
- **File Upload**: <5s for 10MB files
- **Text Extraction**: <10s average  
- **AI Parsing**: <15s average
- **Embedding Generation**: <3s average
- **Total Processing**: <30s end-to-end

### Quality Targets  
- **Processing Success Rate**: >95%
- **Text Extraction Accuracy**: >98%
- **AI Parsing Confidence**: >0.80 average
- **Search Relevance**: <500ms p95 response time

### Cost Targets
- **Processing Cost**: <$0.05 per CV
- **Storage Cost**: <$0.01 per CV per month
- **AI Costs**: <$0.03 per CV (parsing + embedding)

## 🚀 Deployment Strategy

### Phase 10.1 → Staging
1. Apply database migrations
2. Deploy upload infrastructure
3. Test file upload flow
4. Validate storage integration

### Phase 10.2 → Staging  
1. Deploy processing pipeline
2. Test AI parsing accuracy
3. Validate embedding generation
4. Performance testing

### Phase 10.3 → Production
1. Gradual rollout to 10% users
2. Monitor processing metrics
3. Validate cost projections
4. Scale to 100% users

## 📋 Integration Checklist

### Pre-Implementation
- [ ] Review existing database schema in `docs/01-DB-Architecture.md`
- [ ] Understand current AI patterns in `embeddings/generate/route.ts`
- [ ] Study error handling in `src/lib/errors.ts`
- [ ] Review Clerk integration in `lib/supabase/clerk.ts`

### During Implementation
- [ ] Follow existing code patterns and conventions
- [ ] Use existing type system and validation schemas
- [ ] Integrate with existing monitoring and logging
- [ ] Maintain compatibility with existing RLS policies

### Post-Implementation
- [ ] Update API documentation
- [ ] Add monitoring alerts for processing failures
- [ ] Implement cost monitoring dashboards
- [ ] Plan Phase 11 integration (France Travail)

## 🎯 Next Actions

1. **Immediate (Today)**: Apply database migration and verify schema
2. **Week 1**: Complete upload API endpoints and storage configuration
3. **Week 2**: Implement text extraction and file validation services
4. **Week 3**: Build AI parsing integration and CV management APIs
5. **Week 4**: Implement search and matching integration
6. **Week 5**: Add admin interfaces and performance optimization

The backend architecture is fully designed and ready for implementation. The provided migration, API starter, and type definitions give you a complete foundation to build upon Cledger5's proven infrastructure patterns.