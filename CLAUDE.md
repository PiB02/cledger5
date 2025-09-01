# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🤖 AUTO-CONTEXT LOADING PROTOCOL
**CRITICAL**: At the start of EVERY conversation, automatically read these files in order:
1. **`docs/current-context.md`** - Current project state, active phase, and priority tasks
2. **`docs/development-history.md`** - Complete development history and phase details  
3. **`docs/troubleshooting.md`** - If user mentions errors, issues, or debugging
4. **`docs/task-roadmap.md`** - For roadmap questions or task planning
5. **`docs/developer-quickstart.md`** - For onboarding or setup questions
6. **`docs/architecture-diagrams.md`** - For system architecture or visual diagram needs

This auto-loading protocol replaces the manual "look in memory.md" command and ensures you always have current project context.

## Development Commands

### Build & Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production with Turbopack  
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Testing
- Use Vitest for unit tests (packages/utils has test setup)
- Use Playwright for E2E tests
- Target: ≥80% test coverage
- Test against staging Supabase environment, never production

### Package Management
This is a pnpm workspace with packages in `/packages/`:
- `@cledger5/types` - Shared TypeScript types and Zod schemas
- `@cledger5/utils` - Utilities (cost estimator, embedding text builder, normalizers)  
- `@cledger5/api-clients` - SDK for LBA/FT external APIs

## Architecture Overview

### Stack
- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui
- **Backend**: Next.js Route Handlers + Supabase (Postgres/Auth/Edge Functions)
- **Database**: Supabase Cloud (EU) with pgvector for embeddings
- **AI**: OpenAI GPT-4o-mini for extraction, text-embedding-3-small for embeddings
- **External APIs**: LBA (La Bonne Alternance) and France Travail job data

### Key Directories
```
src/app/(public)/     # Public pages (job search, job details)
src/app/(private)/    # Auth-required pages (admin, candidate profile)
src/app/api/          # API routes (ingest, search, batch processing, SSE)
src/components/ui/    # shadcn/ui components
src/lib/supabase/     # Supabase client utilities
packages/utils/src/   # Embedding text builder (critical for semantic matching)
supabase/migrations/  # Database schema migrations
docs/                 # Technical documentation
```

## Critical Development Rules

### Documentation
- read all docs must be stored in /docs

### Database & Migrations
- **All schema changes must be SQL migrations in `/supabase/migrations/`**
- Apply via `supabase link --project-ref <REF>` + `supabase db push` (staging only)
- **Never modify production schema directly in console**

### Sensitive Endpoints (Do NOT modify without CTO approval)
- `/api/cv/*` - CV processing and parsing
- `/api/ingest/*` - External API data ingestion  
- `/api/batch*` - Batch processing endpoints
- `/rgpd/*` - GDPR compliance endpoints

### Code Conventions
- Database: snake_case (plural table names)
- APIs: kebab-case
- TypeScript: camelCase/PascalCase
- Use centralized `errorFactory` + `httpErrorMap` (src/lib/errors.ts)

### Security Requirements
- All PII must be encrypted using `APP_PII_KEY` (server-only)
- Row Level Security (RLS) is mandatory
- No API keys or secrets in code/logs
- CSRF protection required for mutating POST requests
- EU hosting only for GDPR compliance

### Performance Targets
- Search: <500ms p95
- Job details: <700ms p95  
- SSE streaming: <2s delay

## Key Implementation Details

### Embedding Text Format
The codebase uses a **standardized embedding text format** for both job offers and CVs (packages/utils/src/embedding-text-builder.ts). This format is critical for semantic matching:

```
TITLE: <canonical title>
ROME: <rome codes>
LOCATION: <city>|<dept>|<region>|FR
SENIORITY: intern|junior|mid|senior|lead|manager
CONTRACT: <CDI|CDD|APP|PRO|INTERIM|STAGE|UNKNOWN>
WORK_MODE: onsite|remote|hybrid|unknown
LANGUAGES: <lang=CEFR level>
DEGREE_EQF_MIN: <1..8|unknown>  # Use DEGREE_EQF_TOP for CVs
SKILLS_REQUIRED: <skill1>|<skill2>|...
SKILLS_PREFERRED: <skill1>|<skill2>|...
SALARY: <min-max EUR period|unknown>
AVAILABILITY: <YYYY-MM|ASAP|unknown>
```

**Critical**: Text must be ≤1500 chars, skills normalized (lowercase, unaccented), and re-embedding triggered on specific field changes.

### Data Pipeline Architecture
1. **Raw Ingestion**: External APIs → `offers_raw` (partitioned monthly)
2. **Canonicalization**: Raw → normalized `offers` + `companies` + `locations`  
3. **AI Enhancement**: GPT-4o-mini extracts skills, seniority, languages with ≥0.80 confidence threshold
4. **Embedding**: Standardized text → pgvector (1536d) with HNSW indexing

### SSE Streaming
Batch processing uses Server-Sent Events via `/api/batch/:id/stream` for real-time progress feedback.

## External API Integration
- **LBA**: Bearer auth, 5-20 req/s, job opportunity datasets
- **France Travail**: OAuth2, 10 req/s, reference data
- Both require deduplication via `canonical_fingerprint`

## Important Notes for Windows
- PowerShell doesn't support `&&` operator - use `;` or separate commands
- Always use MCP Context7 server for best practices and debugging guidance when available

## Key Documentation References
- `docs/00-cledger5-PRD.md` - Complete product requirements
- `docs/01-DB-Architecture.md` - Database schema and RLS policies
- `docs/02-DB-SQL-Queries.md` - Essential SQL queries
- `docs/05-Cursor-Dev-Rules.md` - Development rules and constraints

## Important Notes for Development
- PowerShell does not accept `&&` in commands - use `;` or separate commands
- Always follow the auto-context loading protocol above
- All critical project information is maintained in the docs/ folder structure

## MCP Servers Available
- **Context7** : Library documentation and best practices lookup
- **Supabase** : Direct database operations, schema management, migrations
- **Vercel** : Deployment management and project operations  
- **Playwright** : Browser automation and E2E testing
- always use the PostgreSQL MCP server each time you need to write a complex query or do something with supabase
- nous sommes dans un environnement de dev windows. powershell n'accepta pas les & et &&