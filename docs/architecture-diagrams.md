# 📊 Architecture Diagrams - cledger5
*Visual system architecture with Mermaid diagrams*

## 🏗️ **System Architecture Overview**

### **High-Level System Architecture**
```mermaid
graph TB
    %% External Systems
    LBA[LBA API<br/>La Bonne Alternance]
    FT[France Travail API<br/>OAuth2]
    OpenAI[OpenAI API<br/>GPT-4o-mini + embeddings]
    
    %% Frontend
    Web[Next.js Frontend<br/>App Router + Tailwind]
    
    %% Backend
    API[Next.js API Routes<br/>Route Handlers + Server Actions]
    
    %% Database
    DB[(Supabase Cloud EU<br/>Postgres + pgvector)]
    
    %% User Types
    Candidate[👤 Candidat]
    Admin[🔧 Admin]
    Recruiter[🏢 Recruteur]
    
    %% User Interactions
    Candidate --> Web
    Admin --> Web
    Recruiter --> Web
    
    %% Frontend to Backend
    Web --> API
    
    %% Backend to External
    API --> LBA
    API --> FT  
    API --> OpenAI
    
    %% Backend to Database
    API --> DB
    
    %% Styling
    classDef external fill:#e1f5fe
    classDef frontend fill:#f3e5f5
    classDef backend fill:#e8f5e8
    classDef database fill:#fff3e0
    classDef users fill:#ffebee
    
    class LBA,FT,OpenAI external
    class Web frontend
    class API backend
    class DB database
    class Candidate,Admin,Recruiter users
```

## 🔄 **Data Pipeline Architecture**

### **Complete Data Flow (Phases 5-8)**
```mermaid
graph LR
    %% Raw Data Sources
    LBA_API[LBA API]
    FT_API[France Travail API]
    
    %% Phase 5: Raw Ingestion
    subgraph "Phase 5: Raw Ingestion"
        LBA_Ingest[LBA Ingestion<br/>183+ offres]
        FT_Ingest[FT Ingestion<br/>OAuth2]
        Raw_DB[(offers_raw<br/>Partitioned by month)]
    end
    
    %% Phase 6: Canonicalization  
    subgraph "Phase 6: Canonicalization"
        Dedup[Deduplication<br/>Fingerprinting]
        Canon[Canonicalization<br/>Pipeline]
        Offers_DB[(offers)]
        Companies_DB[(companies)]  
        Locations_DB[(locations)]
    end
    
    %% Phase 7: AI Enhancement (Current)
    subgraph "Phase 7: AI Enhancement"
        AI_Extract[GPT-4o-mini<br/>Skills/Seniority]
        Confidence[Confidence ≥0.80<br/>Validation]
        Enriched_DB[(offer_enrichment)]
    end
    
    %% Phase 8: Embeddings (Next)
    subgraph "Phase 8: Embeddings"
        Text_Builder[Embedding Text<br/>Builder ≤1500 chars]
        OpenAI_Embed[text-embedding-3-small<br/>1536d vectors]
        Vector_DB[(offer_embeddings<br/>HNSW index)]
    end
    
    %% Data Flow
    LBA_API --> LBA_Ingest
    FT_API --> FT_Ingest
    
    LBA_Ingest --> Raw_DB
    FT_Ingest --> Raw_DB
    
    Raw_DB --> Dedup
    Dedup --> Canon
    Canon --> Offers_DB
    Canon --> Companies_DB
    Canon --> Locations_DB
    
    Offers_DB --> AI_Extract
    AI_Extract --> Confidence
    Confidence --> Enriched_DB
    
    Enriched_DB --> Text_Builder
    Text_Builder --> OpenAI_Embed
    OpenAI_Embed --> Vector_DB
    
    %% Styling
    classDef phase5 fill:#ffcdd2
    classDef phase6 fill:#dcedc8  
    classDef phase7 fill:#fff3c4
    classDef phase8 fill:#e1f5fe
    classDef database fill:#f5f5f5
    
    class LBA_Ingest,FT_Ingest phase5
    class Dedup,Canon phase6
    class AI_Extract,Confidence phase7
    class Text_Builder,OpenAI_Embed phase8
    class Raw_DB,Offers_DB,Companies_DB,Locations_DB,Enriched_DB,Vector_DB database
```

## 🖥️ **Frontend Architecture**

### **Next.js App Router Structure**
```mermaid
graph TB
    %% Root Layout
    Root[app/layout.tsx<br/>Root Layout]
    
    %% Public Routes
    subgraph "Public Routes"
        PublicLayout[app/&#40public&#41/layout.tsx<br/>Public Layout + Nav]
        Homepage[app/page.tsx<br/>Homepage]
        Search[app/&#40public&#41/offres/page.tsx<br/>Job Search + Filters]
        Detail[app/&#40public&#41/offres/[id]/page.tsx<br/>Job Detail]
    end
    
    %% Private Routes (Admin)
    subgraph "Private Routes"
        PrivateLayout[app/&#40private&#41/layout.tsx<br/>Admin Layout + Nav]
        Dashboard[app/&#40private&#41/admin/page.tsx<br/>Admin Dashboard]
        Ingestion[app/&#40private&#41/admin/ingestion/page.tsx<br/>LBA Ingestion UI]
        Canonicalization[app/&#40private&#41/admin/canonicalization/page.tsx<br/>Data Processing]
    end
    
    %% API Routes
    subgraph "API Routes"
        SearchAPI[app/api/search/offers/route.ts]
        DetailAPI[app/api/offers/[id]/route.ts] 
        IngestAPI[app/api/ingest/lba/route.ts]
        CanonAPI[app/api/canonicalize/route.ts]
        SSE[app/api/batch/[id]/stream/route.ts]
    end
    
    %% Components
    subgraph "UI Components"
        shadcn[src/components/ui/<br/>shadcn/ui components]
        Custom[src/components/<br/>Custom components]
    end
    
    %% Flow
    Root --> PublicLayout
    Root --> PrivateLayout
    
    PublicLayout --> Homepage
    PublicLayout --> Search
    PublicLayout --> Detail
    
    PrivateLayout --> Dashboard
    PrivateLayout --> Ingestion
    PrivateLayout --> Canonicalization
    
    Search --> SearchAPI
    Detail --> DetailAPI
    Ingestion --> IngestAPI
    Canonicalization --> CanonAPI
    Dashboard --> SSE
    
    PublicLayout --> shadcn
    PrivateLayout --> shadcn
    Search --> Custom
    Detail --> Custom
    
    %% Styling
    classDef public fill:#e8f5e8
    classDef private fill:#fff3c4
    classDef api fill:#e1f5fe
    classDef components fill:#f3e5f5
    
    class PublicLayout,Homepage,Search,Detail public
    class PrivateLayout,Dashboard,Ingestion,Canonicalization private
    class SearchAPI,DetailAPI,IngestAPI,CanonAPI,SSE api
    class shadcn,Custom components
```

## 💾 **Database Architecture** 

### **Database Schema Relationships**
```mermaid
erDiagram
    %% Reference Tables
    sources {
        text id PK "LBA, FT"
        text label
        text api_url
        integer rate_limit
    }
    
    naf_codes {
        text code PK "62.01Z"
        text label "Programmation informatique"
    }
    
    rome_codes {
        text code PK "M1805"
        text label "Études et développement informatique"
    }
    
    departments {
        text code PK "75"
        text name "Paris"
    }
    
    %% Raw Data
    offers_raw {
        uuid id PK
        text source_id FK
        jsonb raw_data "Original API response"
        timestamp fetched_at
        timestamp processed_at "NULL until canonicalized"
    }
    
    %% Canonical Data
    companies {
        uuid id PK
        text name
        text siret
        text naf_code FK
        text size
        text description
        timestamp created_at
    }
    
    locations {
        uuid id PK
        text city
        text postal_code
        text department_code FK
        text region
        text country "FR"
        point geo "PostGIS POINT(lon lat)"
        timestamp created_at
    }
    
    offers {
        uuid id PK
        text title
        text canonical_fingerprint "For deduplication"
        uuid company_id FK
        uuid location_id FK
        text description
        text[] rome_codes
        text contract_type "CDI, CDD, APP, etc."
        text work_mode "onsite, remote, hybrid"
        integer salary_min
        integer salary_max
        text salary_period "monthly, yearly"
        date published_at
        boolean is_alternance
        text apply_url
        timestamp created_at
        timestamp updated_at
    }
    
    %% AI Enhancement (Phase 7)
    offer_enrichment {
        uuid id PK
        uuid offer_id FK
        jsonb extracted_skills "AI extracted"
        text seniority "junior, mid, senior"
        jsonb languages "lang: CEFR level"
        integer degree_min "1-8 EQF"
        decimal confidence_score "≥0.80 required"
        timestamp processed_at
    }
    
    %% Embeddings (Phase 8) 
    offer_embeddings {
        uuid id PK
        uuid offer_id FK
        text embedding_text "≤1500 chars standardized"
        vector embedding "1536d pgvector"
        timestamp created_at
    }
    
    %% Relationships
    sources ||--o{ offers_raw : "source_id"
    naf_codes ||--o{ companies : "naf_code"
    departments ||--o{ locations : "department_code"
    offers_raw }o--|| offers : "processed via canonicalization"
    companies ||--o{ offers : "company_id"
    locations ||--o{ offers : "location_id"
    offers ||--o| offer_enrichment : "offer_id"
    offers ||--o| offer_embeddings : "offer_id"
```

## 🔒 **Security Architecture**

### **Authentication & Authorization Flow**
```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🖥️ Frontend
    participant ServerAction as ⚡ Server Action
    participant Supabase as 🔒 Supabase
    participant Database as 💾 Database
    
    Note over User,Database: Current: Admin Operations (Phase 0-7)
    
    User->>Frontend: Access /admin pages
    Frontend->>ServerAction: triggerLBAIngestion()
    
    ServerAction->>ServerAction: Verify ADMIN_SECRET<br/>(server-side only)
    
    alt Valid Admin Secret
        ServerAction->>Supabase: Service Role Key
        Supabase->>Database: Query/Insert with RLS bypass
        Database-->>Supabase: Success
        Supabase-->>ServerAction: Data
        ServerAction-->>Frontend: Success Response
        Frontend-->>User: Operation Complete
    else Invalid Admin Secret  
        ServerAction-->>Frontend: 401 Unauthorized
        Frontend-->>User: Access Denied
    end
    
    Note over User,Database: Future: Candidate Auth (Phase 9)
    
    User->>Frontend: Login/Register
    Frontend->>Supabase: Email/Password Auth
    Supabase->>Database: Check user + RLS policies
    Database-->>Supabase: User data (filtered by RLS)
    Supabase-->>Frontend: JWT Token
    Frontend-->>User: Authenticated Session
```

## 🚀 **Deployment Architecture**

### **Production Environment**
```mermaid
graph TB
    %% Users
    Users[👥 Users<br/>France + EU]
    
    %% CDN/Edge
    Vercel[Vercel Edge Network<br/>Global CDN]
    
    %% Application
    NextJS[Next.js Application<br/>App Router + API Routes]
    
    %% Database
    Supabase[Supabase Cloud EU<br/>Frankfurt Region]
    
    %% External Services  
    subgraph "External APIs"
        LBA_Prod[LBA Production API<br/>labonnealternance.apprentissage.beta.gouv.fr]
        FT_Prod[France Travail API<br/>OAuth2 Production]
        OpenAI_Prod[OpenAI API<br/>GPT-4o-mini + embeddings]
    end
    
    %% Monitoring
    subgraph "Monitoring & Analytics"
        Logs[Application Logs<br/>Vercel Analytics]
        Metrics[Performance Metrics<br/>Supabase Dashboard]  
        Errors[Error Tracking<br/>Built-in Error Factory]
    end
    
    %% Flow
    Users --> Vercel
    Vercel --> NextJS
    NextJS --> Supabase
    
    NextJS --> LBA_Prod
    NextJS --> FT_Prod
    NextJS --> OpenAI_Prod
    
    NextJS --> Logs
    Supabase --> Metrics
    NextJS --> Errors
    
    %% Styling
    classDef users fill:#ffebee
    classDef infrastructure fill:#e3f2fd
    classDef application fill:#e8f5e8
    classDef database fill:#fff3e0
    classDef external fill:#f3e5f5
    classDef monitoring fill:#fce4ec
    
    class Users users
    class Vercel infrastructure
    class NextJS application
    class Supabase database
    class LBA_Prod,FT_Prod,OpenAI_Prod external
    class Logs,Metrics,Errors monitoring
```

## 🔄 **User Journey Flows**

### **Job Search User Journey**
```mermaid
journey
    title Job Seeker Journey (Public)
    section Discovery
      Visit Homepage: 5: Candidate
      Browse Job Categories: 4: Candidate
    section Search  
      Enter Search Terms: 5: Candidate
      Apply Filters (ROME, Location): 4: Candidate
      View Search Results: 5: Candidate
    section Detail
      Click Job Offer: 5: Candidate
      Read Full Description: 4: Candidate
      Check Company Info: 4: Candidate
      Click Apply Link: 5: Candidate
    section Future (Phase 11)
      Upload CV: 5: Candidate
      AI Matching Recommendations: 5: Candidate
      Save Favorite Jobs: 4: Candidate
```

### **Admin Data Management Journey**  
```mermaid
journey
    title Admin Data Management Journey
    section Ingestion
      Access Admin Dashboard: 5: Admin
      Trigger LBA Ingestion: 4: Admin  
      Monitor SSE Progress: 4: Admin
      Verify Raw Data: 5: Admin
    section Processing
      Start Canonicalization: 5: Admin
      Monitor Deduplication: 4: Admin
      Review Statistics: 4: Admin
    section Quality (Phase 7)
      Trigger AI Enhancement: 5: Admin
      Monitor Confidence Scores: 4: Admin
      Review Enriched Data: 5: Admin
    section Analytics
      View KPIs Dashboard: 4: Admin
      Generate Reports: 3: Admin
```

---

## 📈 **Performance Architecture**

### **Performance Targets vs Current**
```mermaid
xychart-beta
    title "API Response Time Targets vs Current"
    x-axis ["Search API", "Detail API", "Health Check", "SSE Stream", "Ingestion"]
    y-axis "Response Time (ms)" 0 --> 2000
    bar [500, 700, 100, 2000, 5000]
    bar [1200, 1000, 1300, 2000, "N/A"]
```

### **Optimization Roadmap**
```mermaid
gantt
    title Performance Optimization Timeline
    dateFormat  YYYY-MM-DD
    section Database
    Add Missing Indexes     :a1, 2025-09-01, 3d
    Query Optimization      :a2, after a1, 5d
    section Caching  
    API Response Cache      :b1, 2025-09-01, 4d
    Static Asset CDN        :b2, after b1, 2d
    section Infrastructure
    Connection Pooling      :c1, 2025-09-10, 3d
    Edge Computing          :c2, after c1, 7d
```

---

*Visual architecture documentation - All system diagrams in one place*