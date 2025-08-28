# cledger5 Technical Architecture
*Last Updated: 26/08/2025 - 18:00*

## System Overview
```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   Public    │ │   Private   │ │    Admin    │   │
│  │   Pages     │ │   Pages     │ │  Dashboard  │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │
│         └────────────────┴────────────────┘         │
│                          │                          │
│                    API Routes                       │
│  ┌────────────────────────────────────────────┐    │
│  │  /api/search  /api/offers  /api/batch      │    │
│  │  /api/cv      /api/auth    /api/ingest     │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────┘
                          │
                    Supabase Cloud
┌─────────────────────────┴───────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │  Database   │ │    Auth     │ │   Storage   │   │
│  │  (Postgres) │ │  (Supabase) │ │   (Files)   │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │    Edge     │ │  Realtime   │ │   Vector    │   │
│  │  Functions  │ │    (SSE)    │ │  (pgvector) │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└──────────────────────────────────────────────────────┘
                          │
                  External Services
┌──────────────────────────────────────────────────────┐
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   OpenAI    │ │    Resend   │ │  LBA / FT   │   │
│  │  GPT-4o-mini│ │   (Email)   │ │    APIs     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
└──────────────────────────────────────────────────────┘
```

## Directory Structure
```
cledger5/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Public pages
│   │   ├── (private)/          # Auth-protected pages
│   │   ├── api/                # API routes
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── theme-provider.tsx  # Dark mode support
│   ├── features/               # Feature modules
│   │   ├── offers/
│   │   ├── auth/
│   │   ├── batches/
│   │   └── candidate/
│   ├── lib/                    # Utilities
│   │   ├── supabase/          # 4 client types
│   │   └── errors.ts          # Error factory
│   └── hooks/                  # React hooks
├── packages/                   # Monorepo packages
│   ├── types/                  # Shared TypeScript types
│   │   └── src/
│   │       ├── offers.ts
│   │       ├── candidates.ts
│   │       ├── auth.ts
│   │       ├── common.ts
│   │       ├── api.ts
│   │       └── database.ts
│   ├── utils/                  # Shared utilities
│   │   └── src/
│   │       ├── embedding-text-builder.ts
│   │       ├── cost-estimator.ts
│   │       └── normalizers.ts
│   └── api-clients/           # External API clients
│       ├── lba/
│       └── ft/
├── prompts/                    # LLM prompts
├── supabase/                   # Database
│   ├── migrations/
│   ├── functions/
│   └── seed/
│       └── test-offers.sql
├── docs/                       # Documentation
│   ├── memory.md              # AI memory system
│   ├── development-notes.md   # Progress tracking
│   ├── troubleshooting.md    # Issues & solutions
│   └── architecture.md       # This file
└── logs/                      # Application logs
```

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 3.4 + shadcn/ui
- **State**: Server-side (RSC) + React hooks
- **Theme**: Dark mode with next-themes

### Backend
- **Runtime**: Node.js 18+ (Vercel)
- **API**: Next.js Route Handlers
- **Validation**: Zod 3.23.8
- **Database**: Supabase (Postgres)
- **Auth**: Supabase Auth
- **Files**: Supabase Storage

### Database
- **Primary**: PostgreSQL 15+ (Supabase)
- **Vector**: pgvector extension
- **Search**: PostgreSQL full-text (french_unaccent)
- **Partitioning**: offers_raw by month
- **Indexes**: HNSW, GIN, GIST, B-tree

### External Services
- **AI**: OpenAI GPT-4o-mini, text-embedding-3-small
- **Email**: Resend
- **Job APIs**: LBA, France Travail

## API Architecture

### Public Endpoints
```typescript
GET  /api/health                    // Health check
GET  /api/search/offers            // Search with filters
GET  /api/offers/[id]             // Offer details
GET  /api/batch/[id]/stream       // SSE streaming
```

### Protected Endpoints (Future)
```typescript
POST /api/cv/upload               // Upload CV PDF
POST /api/cv/parse               // Parse CV with AI
POST /api/cv/embed              // Generate embeddings
POST /api/ingest/lba           // Ingest from LBA
POST /api/ingest/ft           // Ingest from FT
POST /api/batch              // Create batch job
```

## Database Schema

### Core Tables
- `offers` - Canonical job offers
- `companies` - Company information
- `locations` - Geographic data
- `app_users` - User accounts
- `candidate_profiles` - Candidate data

### Support Tables
- `offer_sources` - Track data origin
- `offer_skills` - Skills per offer
- `offer_languages` - Language requirements
- `offer_embeddings` - Vector embeddings
- `match_scores` - Matching results

### Reference Tables
- `naf_codes` - Business sectors
- `rome_jobs` - Job classifications
- `contract_types_ref` - Contract types
- `work_modes_ref` - Work arrangements

## Security Architecture

### Authentication & Authorization
- **Supabase Auth** for user management
- **RLS** (Row Level Security) on all tables
- **JWT** with role claims (candidate/recruiter/admin)
- **Service role key** for admin operations only

### Data Protection
- **PII encryption** with pgcrypto
- **Key rotation** every 90 days
- **GDPR compliance** with 6-month retention
- **Double opt-in** for candidates

### API Security
- **Input validation** with Zod schemas
- **Rate limiting** (planned)
- **CSRF protection** for mutations
- **Error sanitization** in production

## Performance Targets

### Response Times (p95)
- Search: < 500ms (currently ~1200ms)
- Detail: < 700ms (currently ~1000ms)
- Health: < 200ms (currently ~1300ms)

### Scalability
- Partition match_scores at 5M rows
- HNSW index: m=16, ef_construction=64
- Connection pooling via Supabase
- CDN for static assets (Vercel)

## Deployment Architecture

### Environments
- **Development**: localhost:3000
- **Staging**: Vercel Preview (planned)
- **Production**: Vercel + Supabase Cloud EU

### CI/CD Pipeline (Planned)
```yaml
main branch:
  - Run tests (Vitest, Playwright)
  - Build & type check
  - Deploy to staging
  - Run E2E tests
  
tag/release:
  - All above +
  - Deploy to production
  - Run smoke tests
```

## Monitoring & Observability

### Logging
- **Application**: Console + structured logs
- **Database**: Supabase Dashboard
- **Errors**: Sentry (planned)

### Metrics
- **Performance**: Web Vitals
- **Business**: KPI dashboard
- **Usage**: PostHog (planned)

## Development Workflow

### Local Setup
```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local

# Run development
pnpm dev

# Run tests
pnpm test
pnpm test:e2e
```

### Database Management
```bash
# Generate types
npx supabase gen types typescript

# Run migrations
supabase db push

# Seed data
# Execute supabase/seed/test-offers.sql in SQL editor
```

### Code Quality
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type checking**: TypeScript strict
- **Testing**: Vitest + Playwright
- **Coverage**: Target 80%

## Key Design Decisions

### 1. Monorepo Structure
- Shared types and utils
- Independent versioning
- Better code reuse

### 2. Server Components First
- Better SEO
- Reduced client bundle
- Direct database access

### 3. Supabase Cloud
- Managed infrastructure
- Built-in auth & RLS
- Real-time capabilities
- EU data residency

### 4. Embedding Strategy
- Common format for offers/CV
- Max 1500 characters
- Deterministic generation
- SHA-256 hash tracking

### 5. Error Handling
- Centralized factory
- Consistent HTTP codes
- Detailed logging
- User-friendly messages

---
*End of Architecture Document* 