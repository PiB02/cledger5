# 🚀 Developer Quick-Start Guide - cledger5
*Get up and running in 15 minutes*

## 📋 **Prerequisites**
- **Node.js** 18+ 
- **pnpm** (package manager)
- **Git** 
- **Supabase CLI** (optional for DB operations)

## ⚡ **Quick Setup (5 minutes)**

### **1. Clone & Install**
```bash
git clone <REPO_URL> cledger5
cd cledger5
pnpm install
```

### **2. Environment Variables**
Create `.env.local` from template:
```env
# Supabase (EU Cloud)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Admin Access (NEVER use NEXT_PUBLIC_)
ADMIN_SECRET="your-secure-admin-secret"

# AI Services
OPENAI_API_KEY="sk-..."

# External APIs
LBA_ACCESS_TOKEN="your-lba-jwt-token"
FT_CLIENT_ID="your-ft-client"
FT_CLIENT_SECRET="your-ft-secret"

# Email
RESEND_API_KEY="re_..."

# Encryption (for PII)
APP_PII_KEY="32-char-encryption-key"
```

### **3. Start Development**
```bash
pnpm dev
```

✅ **Your app is now running at [http://localhost:3000](http://localhost:3000)**

---

## 🏗️ **Architecture Overview (2 minutes)**

### **Stack**
```
Frontend:  Next.js 15 + App Router + Tailwind + shadcn/ui
Backend:   Next.js API Routes + Server Actions
Database:  Supabase Cloud (Postgres + pgvector + RLS)
AI:        OpenAI GPT-4o-mini + text-embedding-3-small
External:  LBA + France Travail APIs
```

### **Project Structure**
```
cledger5/
├── src/app/
│   ├── (public)/          # Public pages (/offres, /offres/[id])
│   ├── (private)/         # Admin pages (/admin/*)
│   └── api/               # API routes
├── src/components/ui/     # shadcn/ui components
├── src/lib/               # Utils, Supabase clients, error handling
├── packages/              # Monorepo packages (@cledger5/*)
├── supabase/             # Migrations, seed data
└── docs/                 # Complete documentation
```

### **Key Pages**
- **`/`** - Homepage
- **`/offres`** - Job search with filters
- **`/offres/[id]`** - Job detail page
- **`/admin`** - Admin dashboard
- **`/admin/ingestion`** - LBA data ingestion
- **`/admin/canonicalization`** - Data processing

---

## 🧪 **Test Your Setup (3 minutes)**

### **Health Check**
```powershell
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
```

Expected response: `{ "status": "ok", "supabase": "connected" }`

### **Test Core APIs**
```powershell
# Search offers
Invoke-RestMethod -Uri "http://localhost:3000/api/search/offers"

# Get specific offer  
Invoke-RestMethod -Uri "http://localhost:3000/api/offers/d0000001-0000-4000-8000-000000000001"
```

### **Access Admin Pages**
Visit [http://localhost:3000/admin](http://localhost:3000/admin) - no auth required in dev

---

## 🔧 **Development Commands**

### **Essential Commands**
```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production  
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Packages (monorepo)
pnpm build:packages   # Build all @cledger5/* packages
cd packages/utils && pnpm build  # Build specific package

# Database (if using Supabase CLI)
supabase status       # Check local DB
supabase db push      # Push schema to cloud (staging only!)
```

### **Troubleshooting Commands**
```powershell
# Clear Next.js cache
Remove-Item -Recurse -Force .next
pnpm dev

# Rebuild packages if import errors
cd packages/utils && pnpm build
cd ../api-clients && pnpm build

# Test Supabase connection
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
```

---

## 📚 **Key Documentation Files**

### **Development Context**
- **`docs/current-context.md`** - Current project status (Phase 7)
- **`docs/development-history.md`** - Complete development history
- **`docs/troubleshooting.md`** - 27+ resolved issues with solutions

### **Technical Specs**
- **`docs/00-cledger5-PRD.md`** - Product requirements
- **`docs/01-DB-Architecture.md`** - Database schema + RLS
- **`docs/02-DB-SQL-Queries.md`** - Important SQL queries
- **`docs/task-roadmap.md`** - Phases 0-12 complete roadmap

### **Architecture Diagrams**
- **`docs/architecture-diagrams.md`** - Visual system architecture
- **`docs/07-API-Contracts.md`** - API specifications

---

## 🎯 **What's Currently Working**

### **✅ 100% Functional (Phase 0-6 Complete)**
- **Database**: All tables, relations, RLS policies
- **Search API**: Full-text search + filters + pagination
- **LBA Ingestion**: 183+ offers successfully ingested
- **Canonicalization**: Deduplication + data normalization
- **Admin UI**: Dashboard, ingestion, canonicalization interfaces
- **Error Handling**: Centralized errorFactory system

### **🚀 Current Focus (Phase 7)**
- **AI Enhancement**: GPT-4o-mini for skills/seniority extraction
- **Confidence Scoring**: ≥0.80 threshold for quality
- **Admin Monitoring**: Real-time AI processing dashboard

---

## 🚨 **Important Development Notes**

### **Security Rules**
- **NEVER** use `NEXT_PUBLIC_` prefix for secrets
- **Use Server Actions** for sensitive operations
- **All PII must be encrypted** with `APP_PII_KEY`

### **Database Rules**  
- **All schema changes** must be SQL migrations
- **Use explicit FK syntax** to avoid Supabase ambiguity:
  ```typescript
  .select(`*, companies!offers_company_id_fkey(*)`)
  ```

### **Windows PowerShell Notes**
- Use `;` instead of `&&` for command chaining
- Use `Invoke-RestMethod` instead of `curl`
- Always quote paths with spaces: `"C:\path with spaces\file"`

### **Package Management**
- **Monorepo structure**: Changes in `packages/*` require rebuild
- **Add to next.config.ts**: `transpilePackages: ['@cledger5/*']`
- **Import issues?** Rebuild packages and restart dev server

---

## 🆘 **Need Help?**

### **Common Issues**
1. **API not responding** → Check `.env.local` + restart dev server
2. **Import errors** → Rebuild packages + clear `.next` cache  
3. **Database errors** → Check Supabase connection + RLS policies
4. **Types errors** → Run `pnpm tsc --noEmit` for validation

### **Where to Look**
- **Issues/bugs** → `docs/troubleshooting.md` (27 solved issues)
- **Architecture questions** → `docs/01-DB-Architecture.md`
- **API specs** → `docs/07-API-Contracts.md`  
- **Performance** → `docs/current-context.md` (targets + current metrics)

### **Best Practices**
- **Follow patterns** established in existing code
- **Use Zod validation** for all API inputs
- **Apply defensive programming** (check for `undefined`/`null`)
- **Commit frequently** with descriptive messages

---

**🎉 You're ready to contribute to cledger5! Check `docs/task-roadmap.md` for current priorities.**