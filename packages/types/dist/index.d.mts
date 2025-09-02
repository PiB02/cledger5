import { z } from 'zod';

declare const ContractTypeEnum: z.ZodEnum<["CDI", "CDD", "INTERIM", "APP", "PRO", "STAGE"]>;
type ContractType = z.infer<typeof ContractTypeEnum>;
declare const WorkModeEnum: z.ZodEnum<["onsite", "remote", "hybrid", "unknown"]>;
type WorkMode = z.infer<typeof WorkModeEnum>;
declare const SeniorityLevelEnum: z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>;
type SeniorityLevel = z.infer<typeof SeniorityLevelEnum>;
declare const OfferStatusEnum: z.ZodEnum<["active", "expired", "suspended"]>;
type OfferStatus = z.infer<typeof OfferStatusEnum>;
declare const CEFRLevelEnum: z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2"]>;
type CEFRLevel = z.infer<typeof CEFRLevelEnum>;
declare const OfferSourceEnum: z.ZodEnum<["lba", "france_travail"]>;
type OfferSource = z.infer<typeof OfferSourceEnum>;
declare const LanguageRequirementSchema: z.ZodObject<{
    code: z.ZodString;
    level: z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2"]>;
    required: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    required: boolean;
}, {
    code: string;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    required?: boolean | undefined;
}>;
type LanguageRequirement = z.infer<typeof LanguageRequirementSchema>;
declare const SkillSchema: z.ZodObject<{
    name: z.ZodString;
    confidence: z.ZodNumber;
    required: z.ZodBoolean;
    years: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    required: boolean;
    name: string;
    confidence: number;
    years?: number | undefined;
}, {
    required: boolean;
    name: string;
    confidence: number;
    years?: number | undefined;
}>;
type Skill = z.infer<typeof SkillSchema>;
declare const OfferSchema: z.ZodObject<{
    id: z.ZodString;
    canonical_fingerprint: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    company_id: z.ZodOptional<z.ZodString>;
    location_id: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["active", "expired", "suspended"]>;
    alternance: z.ZodDefault<z.ZodBoolean>;
    contract_type_code: z.ZodOptional<z.ZodEnum<["CDI", "CDD", "INTERIM", "APP", "PRO", "STAGE"]>>;
    work_mode_code: z.ZodOptional<z.ZodEnum<["onsite", "remote", "hybrid", "unknown"]>>;
    seniority_level: z.ZodOptional<z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>>;
    salary_min: z.ZodOptional<z.ZodNumber>;
    salary_max: z.ZodOptional<z.ZodNumber>;
    salary_period: z.ZodOptional<z.ZodEnum<["hour", "day", "month", "year"]>>;
    rome_codes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    naf_code: z.ZodOptional<z.ZodString>;
    skills_required: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        confidence: z.ZodNumber;
        required: z.ZodBoolean;
        years: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }, {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }>, "many">>;
    skills_preferred: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        confidence: z.ZodNumber;
        required: z.ZodBoolean;
        years: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }, {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }>, "many">>;
    languages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        level: z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2"]>;
        required: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required: boolean;
    }, {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required?: boolean | undefined;
    }>, "many">>;
    degree_min_eqf: z.ZodOptional<z.ZodNumber>;
    contract_start_date: z.ZodOptional<z.ZodString>;
    expiration_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "active" | "expired" | "suspended";
    id: string;
    canonical_fingerprint: string;
    title: string;
    alternance: boolean;
    rome_codes: string[];
    skills_required: {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }[];
    skills_preferred: {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }[];
    languages: {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required: boolean;
    }[];
    created_at: string;
    updated_at: string;
    description?: string | undefined;
    company_id?: string | undefined;
    location_id?: string | undefined;
    contract_type_code?: "CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE" | undefined;
    work_mode_code?: "onsite" | "remote" | "hybrid" | "unknown" | undefined;
    seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    salary_min?: number | undefined;
    salary_max?: number | undefined;
    salary_period?: "hour" | "day" | "month" | "year" | undefined;
    naf_code?: string | undefined;
    degree_min_eqf?: number | undefined;
    contract_start_date?: string | undefined;
    expiration_at?: string | undefined;
}, {
    status: "active" | "expired" | "suspended";
    id: string;
    canonical_fingerprint: string;
    title: string;
    created_at: string;
    updated_at: string;
    description?: string | undefined;
    company_id?: string | undefined;
    location_id?: string | undefined;
    alternance?: boolean | undefined;
    contract_type_code?: "CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE" | undefined;
    work_mode_code?: "onsite" | "remote" | "hybrid" | "unknown" | undefined;
    seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    salary_min?: number | undefined;
    salary_max?: number | undefined;
    salary_period?: "hour" | "day" | "month" | "year" | undefined;
    rome_codes?: string[] | undefined;
    naf_code?: string | undefined;
    skills_required?: {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }[] | undefined;
    skills_preferred?: {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }[] | undefined;
    languages?: {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required?: boolean | undefined;
    }[] | undefined;
    degree_min_eqf?: number | undefined;
    contract_start_date?: string | undefined;
    expiration_at?: string | undefined;
}>;
type Offer = z.infer<typeof OfferSchema>;
declare const ConfidenceScoreSchema: z.ZodObject<{
    skills: z.ZodNumber;
    seniority: z.ZodNumber;
    languages: z.ZodNumber;
    degrees: z.ZodNumber;
    global: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    languages: number;
    skills: number;
    seniority: number;
    degrees: number;
    global: number;
}, {
    languages: number;
    skills: number;
    seniority: number;
    degrees: number;
    global: number;
}>;
type ConfidenceScore = z.infer<typeof ConfidenceScoreSchema>;
declare const SkillCategoryEnum: z.ZodEnum<["technical", "business", "soft", "language", "certification"]>;
type SkillCategory = z.infer<typeof SkillCategoryEnum>;
declare const EnrichedSkillSchema: z.ZodObject<{
    name: z.ZodString;
    normalized_name: z.ZodString;
    category: z.ZodEnum<["technical", "business", "soft", "language", "certification"]>;
    confidence: z.ZodNumber;
    required: z.ZodDefault<z.ZodBoolean>;
    years_required: z.ZodOptional<z.ZodNumber>;
    source: z.ZodDefault<z.ZodEnum<["extracted", "existing", "inferred"]>>;
}, "strip", z.ZodTypeAny, {
    required: boolean;
    name: string;
    confidence: number;
    normalized_name: string;
    category: "technical" | "business" | "soft" | "language" | "certification";
    source: "extracted" | "existing" | "inferred";
    years_required?: number | undefined;
}, {
    name: string;
    confidence: number;
    normalized_name: string;
    category: "technical" | "business" | "soft" | "language" | "certification";
    required?: boolean | undefined;
    years_required?: number | undefined;
    source?: "extracted" | "existing" | "inferred" | undefined;
}>;
type EnrichedSkill = z.infer<typeof EnrichedSkillSchema>;
declare const EnrichedLanguageSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    level: z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2"]>;
    confidence: z.ZodNumber;
    required: z.ZodDefault<z.ZodBoolean>;
    context: z.ZodOptional<z.ZodEnum<["professional", "client", "technical", "general"]>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    required: boolean;
    name: string;
    confidence: number;
    context?: "technical" | "professional" | "client" | "general" | undefined;
}, {
    code: string;
    level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    name: string;
    confidence: number;
    required?: boolean | undefined;
    context?: "technical" | "professional" | "client" | "general" | undefined;
}>;
type EnrichedLanguage = z.infer<typeof EnrichedLanguageSchema>;
declare const DegreeClassificationSchema: z.ZodObject<{
    level_eqf: z.ZodNumber;
    degree_type: z.ZodOptional<z.ZodString>;
    field_of_study: z.ZodOptional<z.ZodString>;
    confidence: z.ZodNumber;
    source_text: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    level_eqf: number;
    degree_type?: string | undefined;
    field_of_study?: string | undefined;
    source_text?: string | undefined;
}, {
    confidence: number;
    level_eqf: number;
    degree_type?: string | undefined;
    field_of_study?: string | undefined;
    source_text?: string | undefined;
}>;
type DegreeClassification = z.infer<typeof DegreeClassificationSchema>;
declare const OfferEnrichmentSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    offer_id: z.ZodString;
    enrichment_status: z.ZodDefault<z.ZodEnum<["pending", "processing", "completed", "failed", "low_confidence"]>>;
    enrichment_version: z.ZodDefault<z.ZodString>;
    model_used: z.ZodDefault<z.ZodString>;
    skills_required: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        normalized_name: z.ZodString;
        category: z.ZodEnum<["technical", "business", "soft", "language", "certification"]>;
        confidence: z.ZodNumber;
        required: z.ZodDefault<z.ZodBoolean>;
        years_required: z.ZodOptional<z.ZodNumber>;
        source: z.ZodDefault<z.ZodEnum<["extracted", "existing", "inferred"]>>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        source: "extracted" | "existing" | "inferred";
        years_required?: number | undefined;
    }, {
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        required?: boolean | undefined;
        years_required?: number | undefined;
        source?: "extracted" | "existing" | "inferred" | undefined;
    }>, "many">>;
    skills_preferred: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        normalized_name: z.ZodString;
        category: z.ZodEnum<["technical", "business", "soft", "language", "certification"]>;
        confidence: z.ZodNumber;
        required: z.ZodDefault<z.ZodBoolean>;
        years_required: z.ZodOptional<z.ZodNumber>;
        source: z.ZodDefault<z.ZodEnum<["extracted", "existing", "inferred"]>>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        source: "extracted" | "existing" | "inferred";
        years_required?: number | undefined;
    }, {
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        required?: boolean | undefined;
        years_required?: number | undefined;
        source?: "extracted" | "existing" | "inferred" | undefined;
    }>, "many">>;
    seniority_level: z.ZodOptional<z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>>;
    languages_detected: z.ZodDefault<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        name: z.ZodString;
        level: z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2"]>;
        confidence: z.ZodNumber;
        required: z.ZodDefault<z.ZodBoolean>;
        context: z.ZodOptional<z.ZodEnum<["professional", "client", "technical", "general"]>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required: boolean;
        name: string;
        confidence: number;
        context?: "technical" | "professional" | "client" | "general" | undefined;
    }, {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        name: string;
        confidence: number;
        required?: boolean | undefined;
        context?: "technical" | "professional" | "client" | "general" | undefined;
    }>, "many">>;
    degree_requirements: z.ZodDefault<z.ZodArray<z.ZodObject<{
        level_eqf: z.ZodNumber;
        degree_type: z.ZodOptional<z.ZodString>;
        field_of_study: z.ZodOptional<z.ZodString>;
        confidence: z.ZodNumber;
        source_text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        level_eqf: number;
        degree_type?: string | undefined;
        field_of_study?: string | undefined;
        source_text?: string | undefined;
    }, {
        confidence: number;
        level_eqf: number;
        degree_type?: string | undefined;
        field_of_study?: string | undefined;
        source_text?: string | undefined;
    }>, "many">>;
    confidence_scores: z.ZodOptional<z.ZodObject<{
        skills: z.ZodNumber;
        seniority: z.ZodNumber;
        languages: z.ZodNumber;
        degrees: z.ZodNumber;
        global: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    }, {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    }>>;
    rome_codes_suggested: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    job_category_detected: z.ZodOptional<z.ZodString>;
    company_size_indicators: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tokens_used: z.ZodOptional<z.ZodNumber>;
    processing_time_ms: z.ZodOptional<z.ZodNumber>;
    error_message: z.ZodOptional<z.ZodString>;
    retry_count: z.ZodDefault<z.ZodNumber>;
    created_at: z.ZodOptional<z.ZodString>;
    processed_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    skills_required: {
        required: boolean;
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        source: "extracted" | "existing" | "inferred";
        years_required?: number | undefined;
    }[];
    skills_preferred: {
        required: boolean;
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        source: "extracted" | "existing" | "inferred";
        years_required?: number | undefined;
    }[];
    offer_id: string;
    enrichment_status: "pending" | "processing" | "completed" | "failed" | "low_confidence";
    enrichment_version: string;
    model_used: string;
    languages_detected: {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required: boolean;
        name: string;
        confidence: number;
        context?: "technical" | "professional" | "client" | "general" | undefined;
    }[];
    degree_requirements: {
        confidence: number;
        level_eqf: number;
        degree_type?: string | undefined;
        field_of_study?: string | undefined;
        source_text?: string | undefined;
    }[];
    rome_codes_suggested: string[];
    company_size_indicators: string[];
    retry_count: number;
    id?: string | undefined;
    seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    confidence_scores?: {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    } | undefined;
    job_category_detected?: string | undefined;
    tokens_used?: number | undefined;
    processing_time_ms?: number | undefined;
    error_message?: string | undefined;
    processed_at?: string | undefined;
}, {
    offer_id: string;
    id?: string | undefined;
    seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    skills_required?: {
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        required?: boolean | undefined;
        years_required?: number | undefined;
        source?: "extracted" | "existing" | "inferred" | undefined;
    }[] | undefined;
    skills_preferred?: {
        name: string;
        confidence: number;
        normalized_name: string;
        category: "technical" | "business" | "soft" | "language" | "certification";
        required?: boolean | undefined;
        years_required?: number | undefined;
        source?: "extracted" | "existing" | "inferred" | undefined;
    }[] | undefined;
    created_at?: string | undefined;
    updated_at?: string | undefined;
    enrichment_status?: "pending" | "processing" | "completed" | "failed" | "low_confidence" | undefined;
    enrichment_version?: string | undefined;
    model_used?: string | undefined;
    languages_detected?: {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        name: string;
        confidence: number;
        required?: boolean | undefined;
        context?: "technical" | "professional" | "client" | "general" | undefined;
    }[] | undefined;
    degree_requirements?: {
        confidence: number;
        level_eqf: number;
        degree_type?: string | undefined;
        field_of_study?: string | undefined;
        source_text?: string | undefined;
    }[] | undefined;
    confidence_scores?: {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    } | undefined;
    rome_codes_suggested?: string[] | undefined;
    job_category_detected?: string | undefined;
    company_size_indicators?: string[] | undefined;
    tokens_used?: number | undefined;
    processing_time_ms?: number | undefined;
    error_message?: string | undefined;
    retry_count?: number | undefined;
    processed_at?: string | undefined;
}>;
type OfferEnrichment = z.infer<typeof OfferEnrichmentSchema>;
declare const OfferEmbeddingSchema: z.ZodObject<{
    offer_id: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<["semantic", "skills"]>>;
    embedding: z.ZodArray<z.ZodNumber, "many">;
    text_used: z.ZodString;
    text_used_hash: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    created_at: string;
    offer_id: string;
    kind: "skills" | "semantic";
    embedding: number[];
    text_used: string;
    text_used_hash: string;
}, {
    created_at: string;
    offer_id: string;
    embedding: number[];
    text_used: string;
    text_used_hash: string;
    kind?: "skills" | "semantic" | undefined;
}>;
type OfferEmbedding = z.infer<typeof OfferEmbeddingSchema>;

declare const CVDocumentSchema: z.ZodObject<{
    id: z.ZodString;
    app_user_id: z.ZodString;
    file_name: z.ZodString;
    file_path: z.ZodString;
    file_size: z.ZodNumber;
    mime_type: z.ZodString;
    upload_at: z.ZodString;
    delete_after_date: z.ZodString;
    is_current: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    app_user_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    upload_at: string;
    delete_after_date: string;
    is_current: boolean;
}, {
    id: string;
    app_user_id: string;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    upload_at: string;
    delete_after_date: string;
    is_current?: boolean | undefined;
}>;
type CVDocument = z.infer<typeof CVDocumentSchema>;
declare const CVParseStatusEnum: z.ZodEnum<["pending", "processing", "ok", "error"]>;
type CVParseStatus = z.infer<typeof CVParseStatusEnum>;
declare const CandidateProfileSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    profile_title: z.ZodString;
    profile_summary: z.ZodOptional<z.ZodString>;
    years_experience: z.ZodOptional<z.ZodNumber>;
    seniority_level: z.ZodOptional<z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>>;
    location_id: z.ZodOptional<z.ZodString>;
    work_mode_preference: z.ZodOptional<z.ZodEnum<["onsite", "remote", "hybrid", "unknown"]>>;
    contract_type_preference: z.ZodOptional<z.ZodEnum<["CDI", "CDD", "INTERIM", "APP", "PRO", "STAGE"]>>;
    availability: z.ZodOptional<z.ZodEnum<["immediately", "within_month", "within_3_months", "later"]>>;
    availability_date: z.ZodOptional<z.ZodString>;
    salary_expectation_min: z.ZodOptional<z.ZodNumber>;
    salary_expectation_max: z.ZodOptional<z.ZodNumber>;
    is_public: z.ZodDefault<z.ZodBoolean>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    created_at: string;
    updated_at: string;
    app_user_id: string;
    profile_title: string;
    is_public: boolean;
    location_id?: string | undefined;
    seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    profile_summary?: string | undefined;
    years_experience?: number | undefined;
    work_mode_preference?: "onsite" | "remote" | "hybrid" | "unknown" | undefined;
    contract_type_preference?: "CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE" | undefined;
    availability?: "immediately" | "within_month" | "within_3_months" | "later" | undefined;
    availability_date?: string | undefined;
    salary_expectation_min?: number | undefined;
    salary_expectation_max?: number | undefined;
}, {
    created_at: string;
    updated_at: string;
    app_user_id: string;
    profile_title: string;
    location_id?: string | undefined;
    seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    profile_summary?: string | undefined;
    years_experience?: number | undefined;
    work_mode_preference?: "onsite" | "remote" | "hybrid" | "unknown" | undefined;
    contract_type_preference?: "CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE" | undefined;
    availability?: "immediately" | "within_month" | "within_3_months" | "later" | undefined;
    availability_date?: string | undefined;
    salary_expectation_min?: number | undefined;
    salary_expectation_max?: number | undefined;
    is_public?: boolean | undefined;
}>;
type CandidateProfile = z.infer<typeof CandidateProfileSchema>;
declare const CVSkillSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    skill_name: z.ZodString;
    confidence: z.ZodNumber;
    years_experience: z.ZodOptional<z.ZodNumber>;
    level: z.ZodOptional<z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>>;
    source: z.ZodDefault<z.ZodEnum<["extracted", "manual"]>>;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    source: "extracted" | "manual";
    app_user_id: string;
    skill_name: string;
    level?: "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    years_experience?: number | undefined;
}, {
    confidence: number;
    app_user_id: string;
    skill_name: string;
    level?: "beginner" | "intermediate" | "advanced" | "expert" | undefined;
    source?: "extracted" | "manual" | undefined;
    years_experience?: number | undefined;
}>;
type CVSkill = z.infer<typeof CVSkillSchema>;
declare const CVLanguageSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    language_code: z.ZodString;
    cefr_level: z.ZodNumber;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    app_user_id: string;
    language_code: string;
    cefr_level: number;
}, {
    confidence: number;
    app_user_id: string;
    language_code: string;
    cefr_level: number;
}>;
type CVLanguage = z.infer<typeof CVLanguageSchema>;
declare const CVDegreeSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    degree_name: z.ZodString;
    field_of_study: z.ZodOptional<z.ZodString>;
    institution: z.ZodOptional<z.ZodString>;
    eqf_level: z.ZodOptional<z.ZodNumber>;
    start_year: z.ZodOptional<z.ZodNumber>;
    end_year: z.ZodOptional<z.ZodNumber>;
    is_completed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    app_user_id: string;
    degree_name: string;
    is_completed: boolean;
    field_of_study?: string | undefined;
    institution?: string | undefined;
    eqf_level?: number | undefined;
    start_year?: number | undefined;
    end_year?: number | undefined;
}, {
    app_user_id: string;
    degree_name: string;
    field_of_study?: string | undefined;
    institution?: string | undefined;
    eqf_level?: number | undefined;
    start_year?: number | undefined;
    end_year?: number | undefined;
    is_completed?: boolean | undefined;
}>;
type CVDegree = z.infer<typeof CVDegreeSchema>;
declare const CVExperienceSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    job_title: z.ZodString;
    company_name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    start_date: z.ZodOptional<z.ZodString>;
    end_date: z.ZodOptional<z.ZodString>;
    is_current: z.ZodDefault<z.ZodBoolean>;
    rome_codes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skills_used: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    app_user_id: string;
    is_current: boolean;
    job_title: string;
    description?: string | undefined;
    rome_codes?: string[] | undefined;
    company_name?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    skills_used?: string[] | undefined;
}, {
    app_user_id: string;
    job_title: string;
    description?: string | undefined;
    rome_codes?: string[] | undefined;
    is_current?: boolean | undefined;
    company_name?: string | undefined;
    start_date?: string | undefined;
    end_date?: string | undefined;
    skills_used?: string[] | undefined;
}>;
type CVExperience = z.infer<typeof CVExperienceSchema>;
declare const CVEnrichmentSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    parse_status: z.ZodEnum<["pending", "processing", "ok", "error"]>;
    profile_title_canonical: z.ZodOptional<z.ZodString>;
    rome_codes_extracted: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skills_extracted: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        confidence: z.ZodNumber;
        required: z.ZodBoolean;
        years: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }, {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }>, "many">>;
    languages_extracted: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        level: z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2"]>;
        required: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required: boolean;
    }, {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required?: boolean | undefined;
    }>, "many">>;
    seniority_detected: z.ZodOptional<z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>>;
    years_experience_detected: z.ZodOptional<z.ZodNumber>;
    confidence_scores: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    error_message: z.ZodOptional<z.ZodString>;
    processed_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    app_user_id: string;
    parse_status: "pending" | "processing" | "ok" | "error";
    confidence_scores?: Record<string, number> | undefined;
    error_message?: string | undefined;
    processed_at?: string | undefined;
    profile_title_canonical?: string | undefined;
    rome_codes_extracted?: string[] | undefined;
    skills_extracted?: {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }[] | undefined;
    languages_extracted?: {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required: boolean;
    }[] | undefined;
    seniority_detected?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    years_experience_detected?: number | undefined;
}, {
    app_user_id: string;
    parse_status: "pending" | "processing" | "ok" | "error";
    confidence_scores?: Record<string, number> | undefined;
    error_message?: string | undefined;
    processed_at?: string | undefined;
    profile_title_canonical?: string | undefined;
    rome_codes_extracted?: string[] | undefined;
    skills_extracted?: {
        required: boolean;
        name: string;
        confidence: number;
        years?: number | undefined;
    }[] | undefined;
    languages_extracted?: {
        code: string;
        level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
        required?: boolean | undefined;
    }[] | undefined;
    seniority_detected?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    years_experience_detected?: number | undefined;
}>;
type CVEnrichment = z.infer<typeof CVEnrichmentSchema>;
declare const CVEmbeddingSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    kind: z.ZodDefault<z.ZodEnum<["semantic", "skills"]>>;
    embedding: z.ZodArray<z.ZodNumber, "many">;
    text_used: z.ZodString;
    text_used_hash: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    created_at: string;
    kind: "skills" | "semantic";
    embedding: number[];
    text_used: string;
    text_used_hash: string;
    app_user_id: string;
}, {
    created_at: string;
    embedding: number[];
    text_used: string;
    text_used_hash: string;
    app_user_id: string;
    kind?: "skills" | "semantic" | undefined;
}>;
type CVEmbedding = z.infer<typeof CVEmbeddingSchema>;

declare const AppRoleEnum: z.ZodEnum<["candidate", "recruiter", "admin"]>;
type AppRole = z.infer<typeof AppRoleEnum>;
declare const AppUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    role: z.ZodEnum<["candidate", "recruiter", "admin"]>;
    email_verified_at: z.ZodOptional<z.ZodString>;
    is_active: z.ZodDefault<z.ZodBoolean>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    email: string;
    role: "candidate" | "recruiter" | "admin";
    is_active: boolean;
    email_verified_at?: string | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    email: string;
    role: "candidate" | "recruiter" | "admin";
    email_verified_at?: string | undefined;
    is_active?: boolean | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
    phone?: string | undefined;
}>;
type AppUser = z.infer<typeof AppUserSchema>;
declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
type LoginCredentials = z.infer<typeof LoginSchema>;
declare const RegistrationSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["candidate", "recruiter", "admin"]>>;
    first_name: z.ZodOptional<z.ZodString>;
    last_name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "candidate" | "recruiter" | "admin";
    password: string;
    first_name?: string | undefined;
    last_name?: string | undefined;
}, {
    email: string;
    password: string;
    role?: "candidate" | "recruiter" | "admin" | undefined;
    first_name?: string | undefined;
    last_name?: string | undefined;
}>;
type Registration = z.infer<typeof RegistrationSchema>;
declare const PasswordResetRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
declare const PasswordResetSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
type PasswordReset = z.infer<typeof PasswordResetSchema>;
declare const SessionSchema: z.ZodObject<{
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        role: z.ZodEnum<["candidate", "recruiter", "admin"]>;
        email_verified_at: z.ZodOptional<z.ZodString>;
        is_active: z.ZodDefault<z.ZodBoolean>;
        first_name: z.ZodOptional<z.ZodString>;
        last_name: z.ZodOptional<z.ZodString>;
        phone: z.ZodOptional<z.ZodString>;
        created_at: z.ZodString;
        updated_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
        role: "candidate" | "recruiter" | "admin";
        is_active: boolean;
        email_verified_at?: string | undefined;
        first_name?: string | undefined;
        last_name?: string | undefined;
        phone?: string | undefined;
    }, {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
        role: "candidate" | "recruiter" | "admin";
        email_verified_at?: string | undefined;
        is_active?: boolean | undefined;
        first_name?: string | undefined;
        last_name?: string | undefined;
        phone?: string | undefined;
    }>;
    access_token: z.ZodString;
    refresh_token: z.ZodOptional<z.ZodString>;
    expires_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    user: {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
        role: "candidate" | "recruiter" | "admin";
        is_active: boolean;
        email_verified_at?: string | undefined;
        first_name?: string | undefined;
        last_name?: string | undefined;
        phone?: string | undefined;
    };
    access_token: string;
    expires_at: string;
    refresh_token?: string | undefined;
}, {
    user: {
        id: string;
        created_at: string;
        updated_at: string;
        email: string;
        role: "candidate" | "recruiter" | "admin";
        email_verified_at?: string | undefined;
        is_active?: boolean | undefined;
        first_name?: string | undefined;
        last_name?: string | undefined;
        phone?: string | undefined;
    };
    access_token: string;
    expires_at: string;
    refresh_token?: string | undefined;
}>;
type Session = z.infer<typeof SessionSchema>;

declare const PaginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    total: z.ZodOptional<z.ZodNumber>;
    totalPages: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total?: number | undefined;
    totalPages?: number | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    total?: number | undefined;
    totalPages?: number | undefined;
}>;
type Pagination = z.infer<typeof PaginationSchema>;
declare const SortOrderEnum: z.ZodEnum<["asc", "desc"]>;
type SortOrder = z.infer<typeof SortOrderEnum>;
declare const LocationSchema: z.ZodObject<{
    id: z.ZodString;
    city: z.ZodString;
    postal_code: z.ZodOptional<z.ZodString>;
    department_code: z.ZodOptional<z.ZodString>;
    department_name: z.ZodOptional<z.ZodString>;
    region_code: z.ZodOptional<z.ZodString>;
    region_name: z.ZodOptional<z.ZodString>;
    country_code: z.ZodDefault<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    city: string;
    country_code: string;
    postal_code?: string | undefined;
    department_code?: string | undefined;
    department_name?: string | undefined;
    region_code?: string | undefined;
    region_name?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}, {
    id: string;
    city: string;
    postal_code?: string | undefined;
    department_code?: string | undefined;
    department_name?: string | undefined;
    region_code?: string | undefined;
    region_name?: string | undefined;
    country_code?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}>;
type Location = z.infer<typeof LocationSchema>;
declare const CompanySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    siret: z.ZodOptional<z.ZodString>;
    naf_code: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodEnum<["1-9", "10-49", "50-249", "250-999", "1000+"]>>;
    description: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
    description?: string | undefined;
    naf_code?: string | undefined;
    siret?: string | undefined;
    size?: "1-9" | "10-49" | "50-249" | "250-999" | "1000+" | undefined;
    website?: string | undefined;
}, {
    name: string;
    id: string;
    created_at: string;
    updated_at: string;
    description?: string | undefined;
    naf_code?: string | undefined;
    siret?: string | undefined;
    size?: "1-9" | "10-49" | "50-249" | "250-999" | "1000+" | undefined;
    website?: string | undefined;
}>;
type Company = z.infer<typeof CompanySchema>;
declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
    message: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    error: string;
    code?: string | undefined;
    details?: Record<string, any> | undefined;
}, {
    message: string;
    error: string;
    code?: string | undefined;
    details?: Record<string, any> | undefined;
}>;
type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
declare const SuccessResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
    data: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
    data?: any;
}, {
    success: boolean;
    message?: string | undefined;
    data?: any;
}>;
type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
declare const BatchStatusEnum: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
type BatchStatus = z.infer<typeof BatchStatusEnum>;
declare const BatchSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["offers_ingest", "cv_parsing", "embeddings_update"]>;
    status: z.ZodEnum<["pending", "running", "completed", "failed", "cancelled"]>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    total_items: z.ZodOptional<z.ZodNumber>;
    processed_items: z.ZodDefault<z.ZodNumber>;
    failed_items: z.ZodDefault<z.ZodNumber>;
    estimated_cost: z.ZodOptional<z.ZodNumber>;
    estimated_duration_seconds: z.ZodOptional<z.ZodNumber>;
    started_at: z.ZodOptional<z.ZodString>;
    completed_at: z.ZodOptional<z.ZodString>;
    error_message: z.ZodOptional<z.ZodString>;
    created_by: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "offers_ingest" | "cv_parsing" | "embeddings_update";
    status: "pending" | "completed" | "failed" | "running" | "cancelled";
    name: string;
    id: string;
    created_at: string;
    processed_items: number;
    failed_items: number;
    created_by: string;
    error_message?: string | undefined;
    filters?: Record<string, any> | undefined;
    total_items?: number | undefined;
    estimated_cost?: number | undefined;
    estimated_duration_seconds?: number | undefined;
    started_at?: string | undefined;
    completed_at?: string | undefined;
}, {
    type: "offers_ingest" | "cv_parsing" | "embeddings_update";
    status: "pending" | "completed" | "failed" | "running" | "cancelled";
    name: string;
    id: string;
    created_at: string;
    created_by: string;
    error_message?: string | undefined;
    filters?: Record<string, any> | undefined;
    total_items?: number | undefined;
    processed_items?: number | undefined;
    failed_items?: number | undefined;
    estimated_cost?: number | undefined;
    estimated_duration_seconds?: number | undefined;
    started_at?: string | undefined;
    completed_at?: string | undefined;
}>;
type Batch = z.infer<typeof BatchSchema>;

declare const SearchOffersRequestSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodString>;
    rome_codes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    location: z.ZodOptional<z.ZodString>;
    radius_km: z.ZodOptional<z.ZodNumber>;
    contract_types: z.ZodOptional<z.ZodArray<z.ZodEnum<["CDI", "CDD", "INTERIM", "APP", "PRO", "STAGE"]>, "many">>;
    work_modes: z.ZodOptional<z.ZodArray<z.ZodEnum<["onsite", "remote", "hybrid", "unknown"]>, "many">>;
    salary_min: z.ZodOptional<z.ZodNumber>;
    alternance: z.ZodOptional<z.ZodBoolean>;
    sort_by: z.ZodDefault<z.ZodEnum<["relevance", "date", "salary"]>>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort_by: "date" | "relevance" | "salary";
    sort_order: "asc" | "desc";
    alternance?: boolean | undefined;
    salary_min?: number | undefined;
    rome_codes?: string[] | undefined;
    query?: string | undefined;
    location?: string | undefined;
    radius_km?: number | undefined;
    contract_types?: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE")[] | undefined;
    work_modes?: ("onsite" | "remote" | "hybrid" | "unknown")[] | undefined;
}, {
    alternance?: boolean | undefined;
    salary_min?: number | undefined;
    rome_codes?: string[] | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    query?: string | undefined;
    location?: string | undefined;
    radius_km?: number | undefined;
    contract_types?: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE")[] | undefined;
    work_modes?: ("onsite" | "remote" | "hybrid" | "unknown")[] | undefined;
    sort_by?: "date" | "relevance" | "salary" | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
type SearchOffersRequest = z.infer<typeof SearchOffersRequestSchema>;
declare const IngestOffersRequestSchema: z.ZodObject<{
    source: z.ZodEnum<["lba", "france_travail"]>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    limit: z.ZodOptional<z.ZodNumber>;
    dry_run: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    source: "lba" | "france_travail";
    dry_run: boolean;
    limit?: number | undefined;
    filters?: Record<string, any> | undefined;
}, {
    source: "lba" | "france_travail";
    limit?: number | undefined;
    filters?: Record<string, any> | undefined;
    dry_run?: boolean | undefined;
}>;
type IngestOffersRequest = z.infer<typeof IngestOffersRequestSchema>;
declare const CVUploadRequestSchema: z.ZodObject<{
    file_name: z.ZodString;
    mime_type: z.ZodEnum<["application/pdf"]>;
    file_size: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    file_name: string;
    file_size: number;
    mime_type: "application/pdf";
}, {
    file_name: string;
    file_size: number;
    mime_type: "application/pdf";
}>;
type CVUploadRequest = z.infer<typeof CVUploadRequestSchema>;
declare const MatchRequestSchema: z.ZodObject<{
    app_user_id: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    min_score: z.ZodDefault<z.ZodNumber>;
    include_explanations: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    app_user_id: string;
    limit: number;
    min_score: number;
    include_explanations: boolean;
}, {
    app_user_id: string;
    limit?: number | undefined;
    min_score?: number | undefined;
    include_explanations?: boolean | undefined;
}>;
type MatchRequest = z.infer<typeof MatchRequestSchema>;
declare const MatchResultSchema: z.ZodObject<{
    offer_id: z.ZodString;
    score: z.ZodNumber;
    score_components: z.ZodOptional<z.ZodObject<{
        semantic_similarity: z.ZodNumber;
        skills_overlap: z.ZodNumber;
        location_match: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        semantic_similarity: number;
        skills_overlap: number;
        location_match: number;
    }, {
        semantic_similarity: number;
        skills_overlap: number;
        location_match: number;
    }>>;
    explanations: z.ZodOptional<z.ZodObject<{
        matched_skills: z.ZodArray<z.ZodString, "many">;
        missing_skills: z.ZodArray<z.ZodString, "many">;
        gating_reasons: z.ZodArray<z.ZodString, "many">;
        distance_km: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        matched_skills: string[];
        missing_skills: string[];
        gating_reasons: string[];
        distance_km?: number | undefined;
    }, {
        matched_skills: string[];
        missing_skills: string[];
        gating_reasons: string[];
        distance_km?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    offer_id: string;
    score: number;
    score_components?: {
        semantic_similarity: number;
        skills_overlap: number;
        location_match: number;
    } | undefined;
    explanations?: {
        matched_skills: string[];
        missing_skills: string[];
        gating_reasons: string[];
        distance_km?: number | undefined;
    } | undefined;
}, {
    offer_id: string;
    score: number;
    score_components?: {
        semantic_similarity: number;
        skills_overlap: number;
        location_match: number;
    } | undefined;
    explanations?: {
        matched_skills: string[];
        missing_skills: string[];
        gating_reasons: string[];
        distance_km?: number | undefined;
    } | undefined;
}>;
type MatchResult = z.infer<typeof MatchResultSchema>;
declare const BatchCreateRequestSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["offers_ingest", "cv_parsing", "embeddings_update"]>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    options: z.ZodOptional<z.ZodObject<{
        concurrency: z.ZodDefault<z.ZodNumber>;
        retry_count: z.ZodDefault<z.ZodNumber>;
        dry_run: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        retry_count: number;
        dry_run: boolean;
        concurrency: number;
    }, {
        retry_count?: number | undefined;
        dry_run?: boolean | undefined;
        concurrency?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "offers_ingest" | "cv_parsing" | "embeddings_update";
    name: string;
    options?: {
        retry_count: number;
        dry_run: boolean;
        concurrency: number;
    } | undefined;
    filters?: Record<string, any> | undefined;
}, {
    type: "offers_ingest" | "cv_parsing" | "embeddings_update";
    name: string;
    options?: {
        retry_count?: number | undefined;
        dry_run?: boolean | undefined;
        concurrency?: number | undefined;
    } | undefined;
    filters?: Record<string, any> | undefined;
}>;
type BatchCreateRequest = z.infer<typeof BatchCreateRequestSchema>;
declare const SSEEventTypeEnum: z.ZodEnum<["batch_started", "batch_progress", "batch_item_processed", "batch_item_failed", "batch_completed", "batch_failed", "batch_cancelled"]>;
type SSEEventType = z.infer<typeof SSEEventTypeEnum>;
declare const SSEEventSchema: z.ZodObject<{
    type: z.ZodEnum<["batch_started", "batch_progress", "batch_item_processed", "batch_item_failed", "batch_completed", "batch_failed", "batch_cancelled"]>;
    data: z.ZodAny;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "batch_started" | "batch_progress" | "batch_item_processed" | "batch_item_failed" | "batch_completed" | "batch_failed" | "batch_cancelled";
    timestamp: string;
    data?: any;
}, {
    type: "batch_started" | "batch_progress" | "batch_item_processed" | "batch_item_failed" | "batch_completed" | "batch_failed" | "batch_cancelled";
    timestamp: string;
    data?: any;
}>;
type SSEEvent = z.infer<typeof SSEEventSchema>;
declare const SkillExtractionSchema: z.ZodObject<{
    name: z.ZodString;
    normalized_name: z.ZodString;
    category: z.ZodEnum<["technical", "soft", "domain", "tool", "language"]>;
    confidence: z.ZodNumber;
    required: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    required: boolean;
    name: string;
    confidence: number;
    normalized_name: string;
    category: "technical" | "soft" | "language" | "domain" | "tool";
}, {
    required: boolean;
    name: string;
    confidence: number;
    normalized_name: string;
    category: "technical" | "soft" | "language" | "domain" | "tool";
}>;
type SkillExtraction = z.infer<typeof SkillExtractionSchema>;
declare const LanguageDetectionSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    level: z.ZodOptional<z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2", "native"]>>;
    confidence: z.ZodNumber;
    required: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    code: string;
    required: boolean;
    name: string;
    confidence: number;
    level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
}, {
    code: string;
    required: boolean;
    name: string;
    confidence: number;
    level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
}>;
type LanguageDetection = z.infer<typeof LanguageDetectionSchema>;
declare const DegreeRequirementSchema: z.ZodObject<{
    level_eqf: z.ZodNumber;
    degree_type: z.ZodString;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidence: number;
    level_eqf: number;
    degree_type: string;
}, {
    confidence: number;
    level_eqf: number;
    degree_type: string;
}>;
type DegreeRequirement = z.infer<typeof DegreeRequirementSchema>;
declare const ConfidenceScoresSchema: z.ZodObject<{
    skills: z.ZodNumber;
    seniority: z.ZodNumber;
    languages: z.ZodNumber;
    degrees: z.ZodNumber;
    global: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    languages: number;
    skills: number;
    seniority: number;
    degrees: number;
    global: number;
}, {
    languages: number;
    skills: number;
    seniority: number;
    degrees: number;
    global: number;
}>;
type ConfidenceScores = z.infer<typeof ConfidenceScoresSchema>;
declare const EnrichmentRequestSchema: z.ZodObject<{
    offer_ids: z.ZodArray<z.ZodString, "many">;
    confidence_threshold: z.ZodDefault<z.ZodNumber>;
    force_reprocess: z.ZodDefault<z.ZodBoolean>;
    include_low_confidence: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    offer_ids: string[];
    confidence_threshold: number;
    force_reprocess: boolean;
    include_low_confidence: boolean;
}, {
    offer_ids: string[];
    confidence_threshold?: number | undefined;
    force_reprocess?: boolean | undefined;
    include_low_confidence?: boolean | undefined;
}>;
type EnrichmentRequest = z.infer<typeof EnrichmentRequestSchema>;
declare const EnrichmentResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    processed_count: z.ZodNumber;
    enrichments: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        offer_id: z.ZodString;
        skills_required: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            normalized_name: z.ZodString;
            category: z.ZodEnum<["technical", "soft", "domain", "tool", "language"]>;
            confidence: z.ZodNumber;
            required: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }, {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }>, "many">;
        skills_preferred: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            normalized_name: z.ZodString;
            category: z.ZodEnum<["technical", "soft", "domain", "tool", "language"]>;
            confidence: z.ZodNumber;
            required: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }, {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }>, "many">;
        seniority_level: z.ZodOptional<z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>>;
        languages_detected: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            name: z.ZodString;
            level: z.ZodOptional<z.ZodEnum<["A1", "A2", "B1", "B2", "C1", "C2", "native"]>>;
            confidence: z.ZodNumber;
            required: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            code: string;
            required: boolean;
            name: string;
            confidence: number;
            level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
        }, {
            code: string;
            required: boolean;
            name: string;
            confidence: number;
            level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
        }>, "many">;
        degree_requirements: z.ZodArray<z.ZodObject<{
            level_eqf: z.ZodNumber;
            degree_type: z.ZodString;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }, {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }>, "many">;
        confidence_scores: z.ZodObject<{
            skills: z.ZodNumber;
            seniority: z.ZodNumber;
            languages: z.ZodNumber;
            degrees: z.ZodNumber;
            global: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        }, {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        }>;
        enrichment_status: z.ZodEnum<["completed", "low_confidence", "failed"]>;
        processed_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        skills_required: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        skills_preferred: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        offer_id: string;
        enrichment_status: "completed" | "failed" | "low_confidence";
        languages_detected: {
            code: string;
            required: boolean;
            name: string;
            confidence: number;
            level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
        }[];
        degree_requirements: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }[];
        confidence_scores: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        };
        processed_at: string;
        seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    }, {
        id: string;
        skills_required: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        skills_preferred: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        offer_id: string;
        enrichment_status: "completed" | "failed" | "low_confidence";
        languages_detected: {
            code: string;
            required: boolean;
            name: string;
            confidence: number;
            level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
        }[];
        degree_requirements: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }[];
        confidence_scores: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        };
        processed_at: string;
        seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    }>, "many">;
    errors: z.ZodArray<z.ZodObject<{
        offer_id: z.ZodString;
        error: z.ZodString;
        retryable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        offer_id: string;
        error: string;
        retryable: boolean;
    }, {
        offer_id: string;
        error: string;
        retryable: boolean;
    }>, "many">;
    cost_estimate: z.ZodObject<{
        tokens_used: z.ZodNumber;
        estimated_cost_usd: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        tokens_used: number;
        estimated_cost_usd: number;
    }, {
        tokens_used: number;
        estimated_cost_usd: number;
    }>;
    processing_stats: z.ZodObject<{
        total_time_ms: z.ZodNumber;
        avg_confidence: z.ZodNumber;
        success_rate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total_time_ms: number;
        avg_confidence: number;
        success_rate: number;
    }, {
        total_time_ms: number;
        avg_confidence: number;
        success_rate: number;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    processed_count: number;
    enrichments: {
        id: string;
        skills_required: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        skills_preferred: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        offer_id: string;
        enrichment_status: "completed" | "failed" | "low_confidence";
        languages_detected: {
            code: string;
            required: boolean;
            name: string;
            confidence: number;
            level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
        }[];
        degree_requirements: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }[];
        confidence_scores: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        };
        processed_at: string;
        seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    }[];
    errors: {
        offer_id: string;
        error: string;
        retryable: boolean;
    }[];
    cost_estimate: {
        tokens_used: number;
        estimated_cost_usd: number;
    };
    processing_stats: {
        total_time_ms: number;
        avg_confidence: number;
        success_rate: number;
    };
}, {
    success: boolean;
    processed_count: number;
    enrichments: {
        id: string;
        skills_required: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        skills_preferred: {
            required: boolean;
            name: string;
            confidence: number;
            normalized_name: string;
            category: "technical" | "soft" | "language" | "domain" | "tool";
        }[];
        offer_id: string;
        enrichment_status: "completed" | "failed" | "low_confidence";
        languages_detected: {
            code: string;
            required: boolean;
            name: string;
            confidence: number;
            level?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native" | undefined;
        }[];
        degree_requirements: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }[];
        confidence_scores: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        };
        processed_at: string;
        seniority_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
    }[];
    errors: {
        offer_id: string;
        error: string;
        retryable: boolean;
    }[];
    cost_estimate: {
        tokens_used: number;
        estimated_cost_usd: number;
    };
    processing_stats: {
        total_time_ms: number;
        avg_confidence: number;
        success_rate: number;
    };
}>;
type EnrichmentResponse = z.infer<typeof EnrichmentResponseSchema>;
declare const AdminEnrichmentStatsSchema: z.ZodObject<{
    overview: z.ZodObject<{
        total_offers: z.ZodNumber;
        enriched_offers: z.ZodNumber;
        enrichment_rate: z.ZodNumber;
        avg_confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        avg_confidence: number;
        total_offers: number;
        enriched_offers: number;
        enrichment_rate: number;
    }, {
        avg_confidence: number;
        total_offers: number;
        enriched_offers: number;
        enrichment_rate: number;
    }>;
    status_breakdown: z.ZodObject<{
        completed: z.ZodNumber;
        processing: z.ZodNumber;
        failed: z.ZodNumber;
        low_confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        processing: number;
        completed: number;
        failed: number;
        low_confidence: number;
    }, {
        processing: number;
        completed: number;
        failed: number;
        low_confidence: number;
    }>;
    cost_tracking: z.ZodObject<{
        total_tokens_used: z.ZodNumber;
        total_cost_usd: z.ZodNumber;
        avg_cost_per_offer: z.ZodNumber;
        monthly_budget_used: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total_tokens_used: number;
        total_cost_usd: number;
        avg_cost_per_offer: number;
        monthly_budget_used: number;
    }, {
        total_tokens_used: number;
        total_cost_usd: number;
        avg_cost_per_offer: number;
        monthly_budget_used: number;
    }>;
    performance_metrics: z.ZodObject<{
        avg_processing_time_ms: z.ZodNumber;
        success_rate_24h: z.ZodNumber;
        latest_batch_id: z.ZodOptional<z.ZodString>;
        active_batches: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        avg_processing_time_ms: number;
        success_rate_24h: number;
        active_batches: number;
        latest_batch_id?: string | undefined;
    }, {
        avg_processing_time_ms: number;
        success_rate_24h: number;
        active_batches: number;
        latest_batch_id?: string | undefined;
    }>;
    skill_categories: z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        count: z.ZodNumber;
        confidence_avg: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        category: string;
        count: number;
        confidence_avg: number;
    }, {
        category: string;
        count: number;
        confidence_avg: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    overview: {
        avg_confidence: number;
        total_offers: number;
        enriched_offers: number;
        enrichment_rate: number;
    };
    status_breakdown: {
        processing: number;
        completed: number;
        failed: number;
        low_confidence: number;
    };
    cost_tracking: {
        total_tokens_used: number;
        total_cost_usd: number;
        avg_cost_per_offer: number;
        monthly_budget_used: number;
    };
    performance_metrics: {
        avg_processing_time_ms: number;
        success_rate_24h: number;
        active_batches: number;
        latest_batch_id?: string | undefined;
    };
    skill_categories: {
        category: string;
        count: number;
        confidence_avg: number;
    }[];
}, {
    overview: {
        avg_confidence: number;
        total_offers: number;
        enriched_offers: number;
        enrichment_rate: number;
    };
    status_breakdown: {
        processing: number;
        completed: number;
        failed: number;
        low_confidence: number;
    };
    cost_tracking: {
        total_tokens_used: number;
        total_cost_usd: number;
        avg_cost_per_offer: number;
        monthly_budget_used: number;
    };
    performance_metrics: {
        avg_processing_time_ms: number;
        success_rate_24h: number;
        active_batches: number;
        latest_batch_id?: string | undefined;
    };
    skill_categories: {
        category: string;
        count: number;
        confidence_avg: number;
    }[];
}>;
type AdminEnrichmentStats = z.infer<typeof AdminEnrichmentStatsSchema>;
declare const EnrichmentHistoryItemSchema: z.ZodObject<{
    id: z.ZodString;
    batch_id: z.ZodOptional<z.ZodString>;
    offer_id: z.ZodString;
    offer_title: z.ZodString;
    enrichment_status: z.ZodEnum<["completed", "processing", "failed", "low_confidence"]>;
    confidence_scores: z.ZodOptional<z.ZodObject<{
        skills: z.ZodNumber;
        seniority: z.ZodNumber;
        languages: z.ZodNumber;
        degrees: z.ZodNumber;
        global: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    }, {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    }>>;
    skills_count: z.ZodNumber;
    tokens_used: z.ZodNumber;
    processing_time_ms: z.ZodNumber;
    error_message: z.ZodOptional<z.ZodString>;
    processed_at: z.ZodString;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    offer_id: string;
    enrichment_status: "processing" | "completed" | "failed" | "low_confidence";
    tokens_used: number;
    processing_time_ms: number;
    processed_at: string;
    offer_title: string;
    skills_count: number;
    confidence_scores?: {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    } | undefined;
    error_message?: string | undefined;
    batch_id?: string | undefined;
}, {
    id: string;
    created_at: string;
    offer_id: string;
    enrichment_status: "processing" | "completed" | "failed" | "low_confidence";
    tokens_used: number;
    processing_time_ms: number;
    processed_at: string;
    offer_title: string;
    skills_count: number;
    confidence_scores?: {
        languages: number;
        skills: number;
        seniority: number;
        degrees: number;
        global: number;
    } | undefined;
    error_message?: string | undefined;
    batch_id?: string | undefined;
}>;
type EnrichmentHistoryItem = z.infer<typeof EnrichmentHistoryItemSchema>;
declare const EnrichmentHistoryResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    history: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        batch_id: z.ZodOptional<z.ZodString>;
        offer_id: z.ZodString;
        offer_title: z.ZodString;
        enrichment_status: z.ZodEnum<["completed", "processing", "failed", "low_confidence"]>;
        confidence_scores: z.ZodOptional<z.ZodObject<{
            skills: z.ZodNumber;
            seniority: z.ZodNumber;
            languages: z.ZodNumber;
            degrees: z.ZodNumber;
            global: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        }, {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        }>>;
        skills_count: z.ZodNumber;
        tokens_used: z.ZodNumber;
        processing_time_ms: z.ZodNumber;
        error_message: z.ZodOptional<z.ZodString>;
        processed_at: z.ZodString;
        created_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        offer_id: string;
        enrichment_status: "processing" | "completed" | "failed" | "low_confidence";
        tokens_used: number;
        processing_time_ms: number;
        processed_at: string;
        offer_title: string;
        skills_count: number;
        confidence_scores?: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        } | undefined;
        error_message?: string | undefined;
        batch_id?: string | undefined;
    }, {
        id: string;
        created_at: string;
        offer_id: string;
        enrichment_status: "processing" | "completed" | "failed" | "low_confidence";
        tokens_used: number;
        processing_time_ms: number;
        processed_at: string;
        offer_title: string;
        skills_count: number;
        confidence_scores?: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        } | undefined;
        error_message?: string | undefined;
        batch_id?: string | undefined;
    }>, "many">;
    pagination: z.ZodObject<{
        total: z.ZodNumber;
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total_pages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    }, {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    history: {
        id: string;
        created_at: string;
        offer_id: string;
        enrichment_status: "processing" | "completed" | "failed" | "low_confidence";
        tokens_used: number;
        processing_time_ms: number;
        processed_at: string;
        offer_title: string;
        skills_count: number;
        confidence_scores?: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        } | undefined;
        error_message?: string | undefined;
        batch_id?: string | undefined;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}, {
    success: boolean;
    history: {
        id: string;
        created_at: string;
        offer_id: string;
        enrichment_status: "processing" | "completed" | "failed" | "low_confidence";
        tokens_used: number;
        processing_time_ms: number;
        processed_at: string;
        offer_title: string;
        skills_count: number;
        confidence_scores?: {
            languages: number;
            skills: number;
            seniority: number;
            degrees: number;
            global: number;
        } | undefined;
        error_message?: string | undefined;
        batch_id?: string | undefined;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}>;
type EnrichmentHistoryResponse = z.infer<typeof EnrichmentHistoryResponseSchema>;
declare const AdminBatchEnrichmentRequestSchema: z.ZodObject<{
    filters: z.ZodOptional<z.ZodObject<{
        rome_codes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        source: z.ZodOptional<z.ZodEnum<["LBA", "FT"]>>;
        created_after: z.ZodOptional<z.ZodString>;
        not_enriched_only: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        not_enriched_only: boolean;
        rome_codes?: string[] | undefined;
        source?: "LBA" | "FT" | undefined;
        created_after?: string | undefined;
    }, {
        rome_codes?: string[] | undefined;
        source?: "LBA" | "FT" | undefined;
        created_after?: string | undefined;
        not_enriched_only?: boolean | undefined;
    }>>;
    batch_size: z.ZodDefault<z.ZodNumber>;
    confidence_threshold: z.ZodDefault<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["low", "normal", "high"]>>;
}, "strip", z.ZodTypeAny, {
    confidence_threshold: number;
    batch_size: number;
    priority: "low" | "normal" | "high";
    filters?: {
        not_enriched_only: boolean;
        rome_codes?: string[] | undefined;
        source?: "LBA" | "FT" | undefined;
        created_after?: string | undefined;
    } | undefined;
}, {
    filters?: {
        rome_codes?: string[] | undefined;
        source?: "LBA" | "FT" | undefined;
        created_after?: string | undefined;
        not_enriched_only?: boolean | undefined;
    } | undefined;
    confidence_threshold?: number | undefined;
    batch_size?: number | undefined;
    priority?: "low" | "normal" | "high" | undefined;
}>;
type AdminBatchEnrichmentRequest = z.infer<typeof AdminBatchEnrichmentRequestSchema>;

interface Database {
    public: {
        Tables: {
            app_users: {
                Row: {
                    id: string;
                    email: string;
                    role: 'candidate' | 'recruiter' | 'admin';
                    email_verified_at: string | null;
                    is_active: boolean;
                    first_name: string | null;
                    last_name: string | null;
                    phone: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['app_users']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['app_users']['Insert']>;
            };
            offers: {
                Row: {
                    id: string;
                    canonical_fingerprint: string;
                    title: string;
                    description: string | null;
                    company_id: string | null;
                    location_id: string | null;
                    status: 'active' | 'expired' | 'suspended';
                    alternance: boolean;
                    contract_type_code: string | null;
                    work_mode_code: string | null;
                    seniority_level: string | null;
                    salary_min: number | null;
                    salary_max: number | null;
                    salary_period: string | null;
                    rome_codes: string[];
                    naf_code: string | null;
                    contract_start_date: string | null;
                    expiration_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['offers']['Insert']>;
            };
            offer_sources: {
                Row: {
                    offer_id: string;
                    source_id: string;
                    source_offer_id: string;
                    source_url: string | null;
                    last_seen_at: string;
                    created_at: string;
                };
                Insert: Database['public']['Tables']['offer_sources']['Row'];
                Update: Partial<Database['public']['Tables']['offer_sources']['Insert']>;
            };
            companies: {
                Row: {
                    id: string;
                    name: string;
                    siret: string | null;
                    naf_code: string | null;
                    size: string | null;
                    description: string | null;
                    website: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['companies']['Insert']>;
            };
            locations: {
                Row: {
                    id: string;
                    city: string;
                    postal_code: string | null;
                    department_code: string | null;
                    department_name: string | null;
                    region_code: string | null;
                    region_name: string | null;
                    country_code: string;
                    latitude: number | null;
                    longitude: number | null;
                };
                Insert: Omit<Database['public']['Tables']['locations']['Row'], 'id'>;
                Update: Partial<Database['public']['Tables']['locations']['Insert']>;
            };
            candidate_profiles: {
                Row: {
                    app_user_id: string;
                    profile_title: string;
                    profile_summary: string | null;
                    years_experience: number | null;
                    seniority_level: string | null;
                    location_id: string | null;
                    work_mode_preference: string | null;
                    contract_type_preference: string | null;
                    availability: string | null;
                    availability_date: string | null;
                    salary_expectation_min: number | null;
                    salary_expectation_max: number | null;
                    is_public: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['candidate_profiles']['Row'], 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['candidate_profiles']['Insert']>;
            };
            cv_documents: {
                Row: {
                    id: string;
                    app_user_id: string;
                    file_name: string;
                    file_path: string;
                    file_size: number;
                    mime_type: string;
                    upload_at: string;
                    delete_after_date: string;
                    is_current: boolean;
                };
                Insert: Omit<Database['public']['Tables']['cv_documents']['Row'], 'id' | 'upload_at'>;
                Update: Partial<Database['public']['Tables']['cv_documents']['Insert']>;
            };
            match_scores: {
                Row: {
                    candidate_id: string;
                    offer_id: string;
                    score: number;
                    score_ann: number;
                    score_skill: number;
                    score_geo: number;
                    gating_applied: boolean;
                    penalty_applied: boolean;
                    explanations: Record<string, any>;
                    computed_at: string;
                };
                Insert: Database['public']['Tables']['match_scores']['Row'];
                Update: Partial<Database['public']['Tables']['match_scores']['Insert']>;
            };
            batches: {
                Row: {
                    id: string;
                    name: string;
                    type: string;
                    status: string;
                    filters: Record<string, any> | null;
                    total_items: number | null;
                    processed_items: number;
                    failed_items: number;
                    estimated_cost: number | null;
                    estimated_duration_seconds: number | null;
                    started_at: string | null;
                    completed_at: string | null;
                    error_message: string | null;
                    created_by: string;
                    created_at: string;
                };
                Insert: Omit<Database['public']['Tables']['batches']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['batches']['Insert']>;
            };
        };
        Views: {
            kpi_daily_admin: {
                Row: {
                    date: string;
                    total_offers: number;
                    active_offers: number;
                    total_candidates: number;
                    active_candidates: number;
                    total_matches: number;
                    avg_match_score: number;
                };
            };
        };
        Functions: {};
    };
}

declare const AgentCapability: z.ZodEnum<["project_management", "task_delegation", "team_coordination", "decision_making", "conflict_resolution", "database_design", "api_development", "supabase", "postgresql", "performance_optimization", "data_modeling", "react", "nextjs", "tailwind", "shadcn_ui", "user_experience", "responsive_design", "job_matching", "rome_codes", "france_travail", "lba_api", "recruitment_processes", "candidate_profiling", "openai_integration", "embeddings", "vector_search", "pgvector", "prompt_engineering", "ai_optimization", "vercel_deployment", "ci_cd", "monitoring", "performance", "security", "infrastructure"]>;
type AgentCapabilityType = z.infer<typeof AgentCapability>;
declare const TaskType: z.ZodEnum<["database_issue", "api_bug_fix", "performance_optimization", "ui_improvement", "ai_integration", "deployment_issue", "security_review", "code_review", "architecture_design", "data_analysis", "user_research", "testing", "documentation", "troubleshooting"]>;
type TaskTypeType = z.infer<typeof TaskType>;
declare const ConversationStatus: z.ZodEnum<["pending", "in_progress", "completed", "failed", "escalated"]>;
type ConversationStatusType = z.infer<typeof ConversationStatus>;
declare const Priority: z.ZodNumber;
declare const Agent: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    role: z.ZodString;
    capabilities: z.ZodArray<z.ZodEnum<["project_management", "task_delegation", "team_coordination", "decision_making", "conflict_resolution", "database_design", "api_development", "supabase", "postgresql", "performance_optimization", "data_modeling", "react", "nextjs", "tailwind", "shadcn_ui", "user_experience", "responsive_design", "job_matching", "rome_codes", "france_travail", "lba_api", "recruitment_processes", "candidate_profiling", "openai_integration", "embeddings", "vector_search", "pgvector", "prompt_engineering", "ai_optimization", "vercel_deployment", "ci_cd", "monitoring", "performance", "security", "infrastructure"]>, "many">;
    system_prompt: z.ZodString;
    hierarchy_level: z.ZodNumber;
    can_invoke: z.ZodArray<z.ZodString, "many">;
    created_at: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
    updated_at: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    role: string;
    capabilities: ("france_travail" | "rome_codes" | "project_management" | "task_delegation" | "team_coordination" | "decision_making" | "conflict_resolution" | "database_design" | "api_development" | "supabase" | "postgresql" | "performance_optimization" | "data_modeling" | "react" | "nextjs" | "tailwind" | "shadcn_ui" | "user_experience" | "responsive_design" | "job_matching" | "lba_api" | "recruitment_processes" | "candidate_profiling" | "openai_integration" | "embeddings" | "vector_search" | "pgvector" | "prompt_engineering" | "ai_optimization" | "vercel_deployment" | "ci_cd" | "monitoring" | "performance" | "security" | "infrastructure")[];
    system_prompt: string;
    hierarchy_level: number;
    can_invoke: string[];
    created_at?: string | undefined;
    updated_at?: string | undefined;
}, {
    name: string;
    id: string;
    role: string;
    capabilities: ("france_travail" | "rome_codes" | "project_management" | "task_delegation" | "team_coordination" | "decision_making" | "conflict_resolution" | "database_design" | "api_development" | "supabase" | "postgresql" | "performance_optimization" | "data_modeling" | "react" | "nextjs" | "tailwind" | "shadcn_ui" | "user_experience" | "responsive_design" | "job_matching" | "lba_api" | "recruitment_processes" | "candidate_profiling" | "openai_integration" | "embeddings" | "vector_search" | "pgvector" | "prompt_engineering" | "ai_optimization" | "vercel_deployment" | "ci_cd" | "monitoring" | "performance" | "security" | "infrastructure")[];
    system_prompt: string;
    hierarchy_level: number;
    can_invoke: string[];
    created_at?: string | undefined;
    updated_at?: string | undefined;
}>;
type AgentType = z.infer<typeof Agent>;
declare const AgentConversation: z.ZodObject<{
    id: z.ZodString;
    from_agent: z.ZodString;
    to_agent: z.ZodString;
    task_type: z.ZodEnum<["database_issue", "api_bug_fix", "performance_optimization", "ui_improvement", "ai_integration", "deployment_issue", "security_review", "code_review", "architecture_design", "data_analysis", "user_research", "testing", "documentation", "troubleshooting"]>;
    task_description: z.ZodString;
    request_data: z.ZodRecord<z.ZodString, z.ZodAny>;
    response_data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    status: z.ZodEnum<["pending", "in_progress", "completed", "failed", "escalated"]>;
    priority: z.ZodNumber;
    created_at: z.ZodString;
    started_at: z.ZodOptional<z.ZodString>;
    completed_at: z.ZodOptional<z.ZodString>;
    error_message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "completed" | "failed" | "in_progress" | "escalated";
    id: string;
    created_at: string;
    priority: number;
    from_agent: string;
    to_agent: string;
    task_type: "performance_optimization" | "database_issue" | "api_bug_fix" | "ui_improvement" | "ai_integration" | "deployment_issue" | "security_review" | "code_review" | "architecture_design" | "data_analysis" | "user_research" | "testing" | "documentation" | "troubleshooting";
    task_description: string;
    request_data: Record<string, any>;
    error_message?: string | undefined;
    started_at?: string | undefined;
    completed_at?: string | undefined;
    response_data?: Record<string, any> | undefined;
}, {
    status: "pending" | "completed" | "failed" | "in_progress" | "escalated";
    id: string;
    created_at: string;
    priority: number;
    from_agent: string;
    to_agent: string;
    task_type: "performance_optimization" | "database_issue" | "api_bug_fix" | "ui_improvement" | "ai_integration" | "deployment_issue" | "security_review" | "code_review" | "architecture_design" | "data_analysis" | "user_research" | "testing" | "documentation" | "troubleshooting";
    task_description: string;
    request_data: Record<string, any>;
    error_message?: string | undefined;
    started_at?: string | undefined;
    completed_at?: string | undefined;
    response_data?: Record<string, any> | undefined;
}>;
type AgentConversationType = z.infer<typeof AgentConversation>;
declare const InvokeAgentRequest: z.ZodObject<{
    target_agent: z.ZodString;
    task_type: z.ZodEnum<["database_issue", "api_bug_fix", "performance_optimization", "ui_improvement", "ai_integration", "deployment_issue", "security_review", "code_review", "architecture_design", "data_analysis", "user_research", "testing", "documentation", "troubleshooting"]>;
    task_description: z.ZodString;
    request_data: z.ZodRecord<z.ZodString, z.ZodAny>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    priority: number;
    task_type: "performance_optimization" | "database_issue" | "api_bug_fix" | "ui_improvement" | "ai_integration" | "deployment_issue" | "security_review" | "code_review" | "architecture_design" | "data_analysis" | "user_research" | "testing" | "documentation" | "troubleshooting";
    task_description: string;
    request_data: Record<string, any>;
    target_agent: string;
}, {
    task_type: "performance_optimization" | "database_issue" | "api_bug_fix" | "ui_improvement" | "ai_integration" | "deployment_issue" | "security_review" | "code_review" | "architecture_design" | "data_analysis" | "user_research" | "testing" | "documentation" | "troubleshooting";
    task_description: string;
    request_data: Record<string, any>;
    target_agent: string;
    priority?: number | undefined;
}>;
type InvokeAgentRequestType = z.infer<typeof InvokeAgentRequest>;
declare const DelegateTaskRequest: z.ZodObject<{
    task_description: z.ZodString;
    context: z.ZodRecord<z.ZodString, z.ZodAny>;
    priority: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    preferred_agent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    context: Record<string, any>;
    priority: number;
    task_description: string;
    preferred_agent?: string | undefined;
}, {
    context: Record<string, any>;
    task_description: string;
    priority?: number | undefined;
    preferred_agent?: string | undefined;
}>;
type DelegateTaskRequestType = z.infer<typeof DelegateTaskRequest>;
declare const AgentResponse: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    error: z.ZodOptional<z.ZodString>;
    agent_id: z.ZodString;
    conversation_id: z.ZodString;
    execution_time_ms: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    agent_id: string;
    conversation_id: string;
    error?: string | undefined;
    data?: Record<string, any> | undefined;
    execution_time_ms?: number | undefined;
}, {
    success: boolean;
    agent_id: string;
    conversation_id: string;
    error?: string | undefined;
    data?: Record<string, any> | undefined;
    execution_time_ms?: number | undefined;
}>;
type AgentResponseType = z.infer<typeof AgentResponse>;
declare const CapabilitiesResponse: z.ZodObject<{
    agents: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        role: z.ZodString;
        capabilities: z.ZodArray<z.ZodEnum<["project_management", "task_delegation", "team_coordination", "decision_making", "conflict_resolution", "database_design", "api_development", "supabase", "postgresql", "performance_optimization", "data_modeling", "react", "nextjs", "tailwind", "shadcn_ui", "user_experience", "responsive_design", "job_matching", "rome_codes", "france_travail", "lba_api", "recruitment_processes", "candidate_profiling", "openai_integration", "embeddings", "vector_search", "pgvector", "prompt_engineering", "ai_optimization", "vercel_deployment", "ci_cd", "monitoring", "performance", "security", "infrastructure"]>, "many">;
        system_prompt: z.ZodString;
        hierarchy_level: z.ZodNumber;
        can_invoke: z.ZodArray<z.ZodString, "many">;
        created_at: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
        updated_at: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        role: string;
        capabilities: ("france_travail" | "rome_codes" | "project_management" | "task_delegation" | "team_coordination" | "decision_making" | "conflict_resolution" | "database_design" | "api_development" | "supabase" | "postgresql" | "performance_optimization" | "data_modeling" | "react" | "nextjs" | "tailwind" | "shadcn_ui" | "user_experience" | "responsive_design" | "job_matching" | "lba_api" | "recruitment_processes" | "candidate_profiling" | "openai_integration" | "embeddings" | "vector_search" | "pgvector" | "prompt_engineering" | "ai_optimization" | "vercel_deployment" | "ci_cd" | "monitoring" | "performance" | "security" | "infrastructure")[];
        system_prompt: string;
        hierarchy_level: number;
        can_invoke: string[];
        created_at?: string | undefined;
        updated_at?: string | undefined;
    }, {
        name: string;
        id: string;
        role: string;
        capabilities: ("france_travail" | "rome_codes" | "project_management" | "task_delegation" | "team_coordination" | "decision_making" | "conflict_resolution" | "database_design" | "api_development" | "supabase" | "postgresql" | "performance_optimization" | "data_modeling" | "react" | "nextjs" | "tailwind" | "shadcn_ui" | "user_experience" | "responsive_design" | "job_matching" | "lba_api" | "recruitment_processes" | "candidate_profiling" | "openai_integration" | "embeddings" | "vector_search" | "pgvector" | "prompt_engineering" | "ai_optimization" | "vercel_deployment" | "ci_cd" | "monitoring" | "performance" | "security" | "infrastructure")[];
        system_prompt: string;
        hierarchy_level: number;
        can_invoke: string[];
        created_at?: string | undefined;
        updated_at?: string | undefined;
    }>, "many">;
    total_count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    agents: {
        name: string;
        id: string;
        role: string;
        capabilities: ("france_travail" | "rome_codes" | "project_management" | "task_delegation" | "team_coordination" | "decision_making" | "conflict_resolution" | "database_design" | "api_development" | "supabase" | "postgresql" | "performance_optimization" | "data_modeling" | "react" | "nextjs" | "tailwind" | "shadcn_ui" | "user_experience" | "responsive_design" | "job_matching" | "lba_api" | "recruitment_processes" | "candidate_profiling" | "openai_integration" | "embeddings" | "vector_search" | "pgvector" | "prompt_engineering" | "ai_optimization" | "vercel_deployment" | "ci_cd" | "monitoring" | "performance" | "security" | "infrastructure")[];
        system_prompt: string;
        hierarchy_level: number;
        can_invoke: string[];
        created_at?: string | undefined;
        updated_at?: string | undefined;
    }[];
    total_count: number;
}, {
    agents: {
        name: string;
        id: string;
        role: string;
        capabilities: ("france_travail" | "rome_codes" | "project_management" | "task_delegation" | "team_coordination" | "decision_making" | "conflict_resolution" | "database_design" | "api_development" | "supabase" | "postgresql" | "performance_optimization" | "data_modeling" | "react" | "nextjs" | "tailwind" | "shadcn_ui" | "user_experience" | "responsive_design" | "job_matching" | "lba_api" | "recruitment_processes" | "candidate_profiling" | "openai_integration" | "embeddings" | "vector_search" | "pgvector" | "prompt_engineering" | "ai_optimization" | "vercel_deployment" | "ci_cd" | "monitoring" | "performance" | "security" | "infrastructure")[];
        system_prompt: string;
        hierarchy_level: number;
        can_invoke: string[];
        created_at?: string | undefined;
        updated_at?: string | undefined;
    }[];
    total_count: number;
}>;
type CapabilitiesResponseType = z.infer<typeof CapabilitiesResponse>;
declare const getAgentByCapability: (agents: AgentType[], capability: AgentCapabilityType) => AgentType | null;
declare const getAgentsByTaskType: (agents: AgentType[], taskType: TaskTypeType) => AgentType[];
declare const canAgentInvoke: (fromAgent: AgentType, toAgentId: string) => boolean;

declare const CVUploadSessionSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodNullable<z.ZodString>;
    anonymous_session_id: z.ZodNullable<z.ZodString>;
    filename: z.ZodString;
    file_size_bytes: z.ZodNumber;
    file_hash: z.ZodString;
    upload_status: z.ZodEnum<["initiated", "uploading", "uploaded", "processing", "completed", "failed"]>;
    storage_path: z.ZodNullable<z.ZodString>;
    processing_started_at: z.ZodNullable<z.ZodString>;
    processing_completed_at: z.ZodNullable<z.ZodString>;
    error_message: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    session_type: z.ZodDefault<z.ZodEnum<["authenticated", "anonymous"]>>;
    partial_results_shown: z.ZodDefault<z.ZodBoolean>;
    full_access_available: z.ZodDefault<z.ZodBoolean>;
    conversion_attempted: z.ZodDefault<z.ZodBoolean>;
    converted_user_id: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    error_message: string | null;
    user_id: string | null;
    anonymous_session_id: string | null;
    filename: string;
    file_size_bytes: number;
    file_hash: string;
    upload_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    storage_path: string | null;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    metadata: Record<string, unknown>;
    session_type: "authenticated" | "anonymous";
    partial_results_shown: boolean;
    full_access_available: boolean;
    conversion_attempted: boolean;
    converted_user_id: string | null;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    error_message: string | null;
    user_id: string | null;
    anonymous_session_id: string | null;
    filename: string;
    file_size_bytes: number;
    file_hash: string;
    upload_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    storage_path: string | null;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    converted_user_id: string | null;
    metadata?: Record<string, unknown> | undefined;
    session_type?: "authenticated" | "anonymous" | undefined;
    partial_results_shown?: boolean | undefined;
    full_access_available?: boolean | undefined;
    conversion_attempted?: boolean | undefined;
}>;
type CVUploadSession = z.infer<typeof CVUploadSessionSchema>;
declare const CVProcessingQueueSchema: z.ZodObject<{
    id: z.ZodString;
    upload_session_id: z.ZodString;
    queue_status: z.ZodEnum<["pending", "processing", "completed", "failed", "retry"]>;
    priority: z.ZodDefault<z.ZodNumber>;
    retry_count: z.ZodDefault<z.ZodNumber>;
    max_retries: z.ZodDefault<z.ZodNumber>;
    processing_started_at: z.ZodNullable<z.ZodString>;
    processing_completed_at: z.ZodNullable<z.ZodString>;
    worker_id: z.ZodNullable<z.ZodString>;
    error_message: z.ZodNullable<z.ZodString>;
    stage_details: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    error_message: string | null;
    retry_count: number;
    priority: number;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    upload_session_id: string;
    queue_status: "pending" | "processing" | "completed" | "failed" | "retry";
    max_retries: number;
    worker_id: string | null;
    stage_details: Record<string, unknown>;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    error_message: string | null;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    upload_session_id: string;
    queue_status: "pending" | "processing" | "completed" | "failed" | "retry";
    worker_id: string | null;
    retry_count?: number | undefined;
    priority?: number | undefined;
    max_retries?: number | undefined;
    stage_details?: Record<string, unknown> | undefined;
}>;
type CVProcessingQueue = z.infer<typeof CVProcessingQueueSchema>;
declare const CVValidationResultSchema: z.ZodObject<{
    id: z.ZodString;
    upload_session_id: z.ZodString;
    validation_type: z.ZodEnum<["format", "content", "security", "quality"]>;
    validation_status: z.ZodEnum<["passed", "failed", "warning"]>;
    validation_score: z.ZodNullable<z.ZodNumber>;
    validation_details: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    validation_errors: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    upload_session_id: string;
    validation_type: "security" | "format" | "content" | "quality";
    validation_status: "failed" | "passed" | "warning";
    validation_score: number | null;
    validation_details: Record<string, unknown>;
    validation_errors: string[];
}, {
    id: string;
    created_at: string;
    upload_session_id: string;
    validation_type: "security" | "format" | "content" | "quality";
    validation_status: "failed" | "passed" | "warning";
    validation_score: number | null;
    validation_details?: Record<string, unknown> | undefined;
    validation_errors?: string[] | undefined;
}>;
type CVValidationResult = z.infer<typeof CVValidationResultSchema>;
declare const CVProcessingMetricSchema: z.ZodObject<{
    id: z.ZodString;
    upload_session_id: z.ZodString;
    metric_type: z.ZodEnum<["processing_time", "api_cost", "extraction_accuracy", "tokens_used"]>;
    metric_value: z.ZodNumber;
    metric_unit: z.ZodNullable<z.ZodEnum<["seconds", "dollars", "percentage", "tokens"]>>;
    processing_stage: z.ZodNullable<z.ZodEnum<["text_extraction", "ai_parsing", "embedding_generation", "total"]>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    created_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    metadata: Record<string, unknown>;
    upload_session_id: string;
    metric_type: "tokens_used" | "processing_time" | "api_cost" | "extraction_accuracy";
    metric_value: number;
    metric_unit: "seconds" | "dollars" | "percentage" | "tokens" | null;
    processing_stage: "total" | "text_extraction" | "ai_parsing" | "embedding_generation" | null;
}, {
    id: string;
    created_at: string;
    upload_session_id: string;
    metric_type: "tokens_used" | "processing_time" | "api_cost" | "extraction_accuracy";
    metric_value: number;
    metric_unit: "seconds" | "dollars" | "percentage" | "tokens" | null;
    processing_stage: "total" | "text_extraction" | "ai_parsing" | "embedding_generation" | null;
    metadata?: Record<string, unknown> | undefined;
}>;
type CVProcessingMetric = z.infer<typeof CVProcessingMetricSchema>;
declare const CVEmbeddingContextSchema: z.ZodObject<{
    profile_title: z.ZodString;
    rome_codes: z.ZodArray<z.ZodString, "many">;
    location: z.ZodObject<{
        city: z.ZodString;
        department_code: z.ZodString;
        region_code: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city: string;
        department_code: string;
        region_code: string;
        country: string;
    }, {
        city: string;
        department_code: string;
        region_code: string;
        country?: string | undefined;
    }>;
    seniority_level: z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>;
    contract_preferences: z.ZodArray<z.ZodEnum<["CDI", "CDD", "APP", "PRO", "INTERIM", "STAGE", "FLEXIBLE"]>, "many">;
    work_mode_preferences: z.ZodArray<z.ZodEnum<["onsite", "remote", "hybrid", "flexible"]>, "many">;
    languages: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        cefr_level: z.ZodNumber;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        code: string;
        confidence: number;
        cefr_level: number;
    }, {
        code: string;
        confidence: number;
        cefr_level: number;
    }>, "many">;
    degree_eqf_top: z.ZodNullable<z.ZodNumber>;
    skills_mastered: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        normalized_name: z.ZodString;
        years_experience: z.ZodNullable<z.ZodNumber>;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }, {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }>, "many">;
    skills_learning: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        normalized_name: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: number;
        normalized_name: string;
    }, {
        name: string;
        confidence: number;
        normalized_name: string;
    }>, "many">;
    salary_expectation: z.ZodNullable<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        period: z.ZodEnum<["annual", "monthly", "daily"]>;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
        period: "annual" | "monthly" | "daily";
        currency: string;
    }, {
        min: number;
        max: number;
        period: "annual" | "monthly" | "daily";
        currency?: string | undefined;
    }>>;
    availability: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    seniority_level: "intern" | "junior" | "mid" | "senior" | "lead" | "manager";
    rome_codes: string[];
    languages: {
        code: string;
        confidence: number;
        cefr_level: number;
    }[];
    profile_title: string;
    availability: string | null;
    location: {
        city: string;
        department_code: string;
        region_code: string;
        country: string;
    };
    contract_preferences: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE" | "FLEXIBLE")[];
    work_mode_preferences: ("onsite" | "remote" | "hybrid" | "flexible")[];
    degree_eqf_top: number | null;
    skills_mastered: {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }[];
    skills_learning: {
        name: string;
        confidence: number;
        normalized_name: string;
    }[];
    salary_expectation: {
        min: number;
        max: number;
        period: "annual" | "monthly" | "daily";
        currency: string;
    } | null;
}, {
    seniority_level: "intern" | "junior" | "mid" | "senior" | "lead" | "manager";
    rome_codes: string[];
    languages: {
        code: string;
        confidence: number;
        cefr_level: number;
    }[];
    profile_title: string;
    availability: string | null;
    location: {
        city: string;
        department_code: string;
        region_code: string;
        country?: string | undefined;
    };
    contract_preferences: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE" | "FLEXIBLE")[];
    work_mode_preferences: ("onsite" | "remote" | "hybrid" | "flexible")[];
    degree_eqf_top: number | null;
    skills_mastered: {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }[];
    skills_learning: {
        name: string;
        confidence: number;
        normalized_name: string;
    }[];
    salary_expectation: {
        min: number;
        max: number;
        period: "annual" | "monthly" | "daily";
        currency?: string | undefined;
    } | null;
}>;
type CVEmbeddingContext = z.infer<typeof CVEmbeddingContextSchema>;
declare const CVAIExtractionSchema: z.ZodObject<{
    profile: z.ZodObject<{
        title_canonical: z.ZodString;
        location_preferred: z.ZodObject<{
            city: z.ZodString;
            department_code: z.ZodString;
            region_code: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            city: string;
            department_code: string;
            region_code: string;
        }, {
            city: string;
            department_code: string;
            region_code: string;
        }>;
        availability: z.ZodNullable<z.ZodString>;
        seniority_level: z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>;
    }, "strip", z.ZodTypeAny, {
        seniority_level: "intern" | "junior" | "mid" | "senior" | "lead" | "manager";
        availability: string | null;
        title_canonical: string;
        location_preferred: {
            city: string;
            department_code: string;
            region_code: string;
        };
    }, {
        seniority_level: "intern" | "junior" | "mid" | "senior" | "lead" | "manager";
        availability: string | null;
        title_canonical: string;
        location_preferred: {
            city: string;
            department_code: string;
            region_code: string;
        };
    }>;
    skills_mastered: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        normalized_name: z.ZodString;
        years_experience: z.ZodNullable<z.ZodNumber>;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }, {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }>, "many">;
    skills_learning: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        normalized_name: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: number;
        normalized_name: string;
    }, {
        name: string;
        confidence: number;
        normalized_name: string;
    }>, "many">;
    experience: z.ZodObject<{
        total_years: z.ZodNumber;
        rome_codes_detected: z.ZodArray<z.ZodString, "many">;
        previous_roles: z.ZodArray<z.ZodObject<{
            title: z.ZodString;
            duration_months: z.ZodNumber;
            company: z.ZodString;
            responsibilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            title: string;
            duration_months: number;
            company: string;
            responsibilities?: string[] | undefined;
        }, {
            title: string;
            duration_months: number;
            company: string;
            responsibilities?: string[] | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        total_years: number;
        rome_codes_detected: string[];
        previous_roles: {
            title: string;
            duration_months: number;
            company: string;
            responsibilities?: string[] | undefined;
        }[];
    }, {
        total_years: number;
        rome_codes_detected: string[];
        previous_roles: {
            title: string;
            duration_months: number;
            company: string;
            responsibilities?: string[] | undefined;
        }[];
    }>;
    education: z.ZodObject<{
        highest_degree: z.ZodNullable<z.ZodObject<{
            level_eqf: z.ZodNumber;
            degree_type: z.ZodString;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }, {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        highest_degree: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        } | null;
    }, {
        highest_degree: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        } | null;
    }>;
    languages: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        cefr_level: z.ZodNumber;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        code: string;
        confidence: number;
        cefr_level: number;
    }, {
        code: string;
        confidence: number;
        cefr_level: number;
    }>, "many">;
    preferences: z.ZodObject<{
        contract_types: z.ZodArray<z.ZodEnum<["CDI", "CDD", "APP", "PRO", "INTERIM", "STAGE"]>, "many">;
        work_modes: z.ZodArray<z.ZodEnum<["onsite", "remote", "hybrid"]>, "many">;
        salary_expectation: z.ZodNullable<z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
            period: z.ZodEnum<["annual", "monthly"]>;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
            period: "annual" | "monthly";
        }, {
            min: number;
            max: number;
            period: "annual" | "monthly";
        }>>;
    }, "strip", z.ZodTypeAny, {
        contract_types: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE")[];
        work_modes: ("onsite" | "remote" | "hybrid")[];
        salary_expectation: {
            min: number;
            max: number;
            period: "annual" | "monthly";
        } | null;
    }, {
        contract_types: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE")[];
        work_modes: ("onsite" | "remote" | "hybrid")[];
        salary_expectation: {
            min: number;
            max: number;
            period: "annual" | "monthly";
        } | null;
    }>;
    confidence_scores: z.ZodObject<{
        profile: z.ZodNumber;
        skills: z.ZodNumber;
        experience: z.ZodNumber;
        education: z.ZodNumber;
        global: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        skills: number;
        global: number;
        profile: number;
        experience: number;
        education: number;
    }, {
        skills: number;
        global: number;
        profile: number;
        experience: number;
        education: number;
    }>;
}, "strip", z.ZodTypeAny, {
    languages: {
        code: string;
        confidence: number;
        cefr_level: number;
    }[];
    confidence_scores: {
        skills: number;
        global: number;
        profile: number;
        experience: number;
        education: number;
    };
    skills_mastered: {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }[];
    skills_learning: {
        name: string;
        confidence: number;
        normalized_name: string;
    }[];
    profile: {
        seniority_level: "intern" | "junior" | "mid" | "senior" | "lead" | "manager";
        availability: string | null;
        title_canonical: string;
        location_preferred: {
            city: string;
            department_code: string;
            region_code: string;
        };
    };
    experience: {
        total_years: number;
        rome_codes_detected: string[];
        previous_roles: {
            title: string;
            duration_months: number;
            company: string;
            responsibilities?: string[] | undefined;
        }[];
    };
    education: {
        highest_degree: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        } | null;
    };
    preferences: {
        contract_types: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE")[];
        work_modes: ("onsite" | "remote" | "hybrid")[];
        salary_expectation: {
            min: number;
            max: number;
            period: "annual" | "monthly";
        } | null;
    };
}, {
    languages: {
        code: string;
        confidence: number;
        cefr_level: number;
    }[];
    confidence_scores: {
        skills: number;
        global: number;
        profile: number;
        experience: number;
        education: number;
    };
    skills_mastered: {
        name: string;
        confidence: number;
        normalized_name: string;
        years_experience: number | null;
    }[];
    skills_learning: {
        name: string;
        confidence: number;
        normalized_name: string;
    }[];
    profile: {
        seniority_level: "intern" | "junior" | "mid" | "senior" | "lead" | "manager";
        availability: string | null;
        title_canonical: string;
        location_preferred: {
            city: string;
            department_code: string;
            region_code: string;
        };
    };
    experience: {
        total_years: number;
        rome_codes_detected: string[];
        previous_roles: {
            title: string;
            duration_months: number;
            company: string;
            responsibilities?: string[] | undefined;
        }[];
    };
    education: {
        highest_degree: {
            confidence: number;
            level_eqf: number;
            degree_type: string;
        } | null;
    };
    preferences: {
        contract_types: ("CDI" | "CDD" | "INTERIM" | "APP" | "PRO" | "STAGE")[];
        work_modes: ("onsite" | "remote" | "hybrid")[];
        salary_expectation: {
            min: number;
            max: number;
            period: "annual" | "monthly";
        } | null;
    };
}>;
type CVAIExtraction = z.infer<typeof CVAIExtractionSchema>;
declare const CVUploadInitRequestSchema: z.ZodObject<{
    filename: z.ZodString;
    file_size: z.ZodNumber;
    file_hash: z.ZodString;
    content_type: z.ZodEnum<["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]>;
}, "strip", z.ZodTypeAny, {
    file_size: number;
    filename: string;
    file_hash: string;
    content_type: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}, {
    file_size: number;
    filename: string;
    file_hash: string;
    content_type: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}>;
type CVUploadInitRequest = z.infer<typeof CVUploadInitRequestSchema>;
declare const CVUploadInitResponseSchema: z.ZodObject<{
    session_id: z.ZodString;
    upload_url: z.ZodString;
    success: z.ZodBoolean;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    session_id: string;
    upload_url: string;
    message?: string | undefined;
}, {
    success: boolean;
    session_id: string;
    upload_url: string;
    message?: string | undefined;
}>;
type CVUploadInitResponse = z.infer<typeof CVUploadInitResponseSchema>;
declare const CVProcessStatusResponseSchema: z.ZodObject<{
    session_id: z.ZodString;
    status: z.ZodEnum<["initiated", "uploading", "uploaded", "processing", "completed", "failed"]>;
    progress_percentage: z.ZodNumber;
    current_stage: z.ZodOptional<z.ZodString>;
    estimated_time_remaining: z.ZodNullable<z.ZodNumber>;
    error_message: z.ZodNullable<z.ZodString>;
    validation_results: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        upload_session_id: z.ZodString;
        validation_type: z.ZodEnum<["format", "content", "security", "quality"]>;
        validation_status: z.ZodEnum<["passed", "failed", "warning"]>;
        validation_score: z.ZodNullable<z.ZodNumber>;
        validation_details: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        validation_errors: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        created_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        upload_session_id: string;
        validation_type: "security" | "format" | "content" | "quality";
        validation_status: "failed" | "passed" | "warning";
        validation_score: number | null;
        validation_details: Record<string, unknown>;
        validation_errors: string[];
    }, {
        id: string;
        created_at: string;
        upload_session_id: string;
        validation_type: "security" | "format" | "content" | "quality";
        validation_status: "failed" | "passed" | "warning";
        validation_score: number | null;
        validation_details?: Record<string, unknown> | undefined;
        validation_errors?: string[] | undefined;
    }>, "many">>;
    processing_metrics: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        upload_session_id: z.ZodString;
        metric_type: z.ZodEnum<["processing_time", "api_cost", "extraction_accuracy", "tokens_used"]>;
        metric_value: z.ZodNumber;
        metric_unit: z.ZodNullable<z.ZodEnum<["seconds", "dollars", "percentage", "tokens"]>>;
        processing_stage: z.ZodNullable<z.ZodEnum<["text_extraction", "ai_parsing", "embedding_generation", "total"]>>;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        created_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        created_at: string;
        metadata: Record<string, unknown>;
        upload_session_id: string;
        metric_type: "tokens_used" | "processing_time" | "api_cost" | "extraction_accuracy";
        metric_value: number;
        metric_unit: "seconds" | "dollars" | "percentage" | "tokens" | null;
        processing_stage: "total" | "text_extraction" | "ai_parsing" | "embedding_generation" | null;
    }, {
        id: string;
        created_at: string;
        upload_session_id: string;
        metric_type: "tokens_used" | "processing_time" | "api_cost" | "extraction_accuracy";
        metric_value: number;
        metric_unit: "seconds" | "dollars" | "percentage" | "tokens" | null;
        processing_stage: "total" | "text_extraction" | "ai_parsing" | "embedding_generation" | null;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    error_message: string | null;
    session_id: string;
    progress_percentage: number;
    estimated_time_remaining: number | null;
    current_stage?: string | undefined;
    validation_results?: {
        id: string;
        created_at: string;
        upload_session_id: string;
        validation_type: "security" | "format" | "content" | "quality";
        validation_status: "failed" | "passed" | "warning";
        validation_score: number | null;
        validation_details: Record<string, unknown>;
        validation_errors: string[];
    }[] | undefined;
    processing_metrics?: {
        id: string;
        created_at: string;
        metadata: Record<string, unknown>;
        upload_session_id: string;
        metric_type: "tokens_used" | "processing_time" | "api_cost" | "extraction_accuracy";
        metric_value: number;
        metric_unit: "seconds" | "dollars" | "percentage" | "tokens" | null;
        processing_stage: "total" | "text_extraction" | "ai_parsing" | "embedding_generation" | null;
    }[] | undefined;
}, {
    status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    error_message: string | null;
    session_id: string;
    progress_percentage: number;
    estimated_time_remaining: number | null;
    current_stage?: string | undefined;
    validation_results?: {
        id: string;
        created_at: string;
        upload_session_id: string;
        validation_type: "security" | "format" | "content" | "quality";
        validation_status: "failed" | "passed" | "warning";
        validation_score: number | null;
        validation_details?: Record<string, unknown> | undefined;
        validation_errors?: string[] | undefined;
    }[] | undefined;
    processing_metrics?: {
        id: string;
        created_at: string;
        upload_session_id: string;
        metric_type: "tokens_used" | "processing_time" | "api_cost" | "extraction_accuracy";
        metric_value: number;
        metric_unit: "seconds" | "dollars" | "percentage" | "tokens" | null;
        processing_stage: "total" | "text_extraction" | "ai_parsing" | "embedding_generation" | null;
        metadata?: Record<string, unknown> | undefined;
    }[] | undefined;
}>;
type CVProcessStatusResponse = z.infer<typeof CVProcessStatusResponseSchema>;
declare const CVProcessingStageSchema: z.ZodObject<{
    stage_name: z.ZodString;
    stage_order: z.ZodNumber;
    status: z.ZodEnum<["pending", "processing", "completed", "failed", "skipped"]>;
    progress_percentage: z.ZodNumber;
    started_at: z.ZodNullable<z.ZodString>;
    completed_at: z.ZodNullable<z.ZodString>;
    duration_ms: z.ZodNullable<z.ZodNumber>;
    error_message: z.ZodNullable<z.ZodString>;
    stage_data: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "processing" | "completed" | "failed" | "skipped";
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    progress_percentage: number;
    stage_name: string;
    stage_order: number;
    duration_ms: number | null;
    stage_data: Record<string, unknown>;
}, {
    status: "pending" | "processing" | "completed" | "failed" | "skipped";
    error_message: string | null;
    started_at: string | null;
    completed_at: string | null;
    progress_percentage: number;
    stage_name: string;
    stage_order: number;
    duration_ms: number | null;
    stage_data?: Record<string, unknown> | undefined;
}>;
type CVProcessingStage = z.infer<typeof CVProcessingStageSchema>;
declare const CVProcessingProgressSchema: z.ZodObject<{
    session_id: z.ZodString;
    overall_status: z.ZodEnum<["initiated", "uploading", "uploaded", "processing", "completed", "failed"]>;
    overall_progress: z.ZodNumber;
    estimated_completion: z.ZodNullable<z.ZodString>;
    stages: z.ZodArray<z.ZodObject<{
        stage_name: z.ZodString;
        stage_order: z.ZodNumber;
        status: z.ZodEnum<["pending", "processing", "completed", "failed", "skipped"]>;
        progress_percentage: z.ZodNumber;
        started_at: z.ZodNullable<z.ZodString>;
        completed_at: z.ZodNullable<z.ZodString>;
        duration_ms: z.ZodNullable<z.ZodNumber>;
        error_message: z.ZodNullable<z.ZodString>;
        stage_data: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "processing" | "completed" | "failed" | "skipped";
        error_message: string | null;
        started_at: string | null;
        completed_at: string | null;
        progress_percentage: number;
        stage_name: string;
        stage_order: number;
        duration_ms: number | null;
        stage_data: Record<string, unknown>;
    }, {
        status: "pending" | "processing" | "completed" | "failed" | "skipped";
        error_message: string | null;
        started_at: string | null;
        completed_at: string | null;
        progress_percentage: number;
        stage_name: string;
        stage_order: number;
        duration_ms: number | null;
        stage_data?: Record<string, unknown> | undefined;
    }>, "many">;
    quality_score: z.ZodNullable<z.ZodNumber>;
    cost_estimate: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    cost_estimate: number | null;
    session_id: string;
    overall_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    overall_progress: number;
    estimated_completion: string | null;
    stages: {
        status: "pending" | "processing" | "completed" | "failed" | "skipped";
        error_message: string | null;
        started_at: string | null;
        completed_at: string | null;
        progress_percentage: number;
        stage_name: string;
        stage_order: number;
        duration_ms: number | null;
        stage_data: Record<string, unknown>;
    }[];
    quality_score: number | null;
}, {
    cost_estimate: number | null;
    session_id: string;
    overall_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    overall_progress: number;
    estimated_completion: string | null;
    stages: {
        status: "pending" | "processing" | "completed" | "failed" | "skipped";
        error_message: string | null;
        started_at: string | null;
        completed_at: string | null;
        progress_percentage: number;
        stage_name: string;
        stage_order: number;
        duration_ms: number | null;
        stage_data?: Record<string, unknown> | undefined;
    }[];
    quality_score: number | null;
}>;
type CVProcessingProgress = z.infer<typeof CVProcessingProgressSchema>;
declare const CVJobMatchSchema: z.ZodObject<{
    offer_id: z.ZodString;
    match_score: z.ZodNumber;
    explanation: z.ZodObject<{
        semantic_similarity: z.ZodNumber;
        skills_coverage: z.ZodNumber;
        seniority_compatibility: z.ZodNumber;
        location_match: z.ZodNumber;
        preferences_alignment: z.ZodNumber;
        reasons: z.ZodArray<z.ZodString, "many">;
        skill_gaps: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        semantic_similarity: number;
        location_match: number;
        skills_coverage: number;
        seniority_compatibility: number;
        preferences_alignment: number;
        reasons: string[];
        skill_gaps: string[];
    }, {
        semantic_similarity: number;
        location_match: number;
        skills_coverage: number;
        seniority_compatibility: number;
        preferences_alignment: number;
        reasons: string[];
        skill_gaps: string[];
    }>;
    offer_summary: z.ZodObject<{
        title: z.ZodString;
        company_name: z.ZodString;
        location: z.ZodString;
        contract_type: z.ZodString;
        salary_range: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        company_name: string;
        location: string;
        contract_type: string;
        salary_range: string | null;
    }, {
        title: string;
        company_name: string;
        location: string;
        contract_type: string;
        salary_range: string | null;
    }>;
}, "strip", z.ZodTypeAny, {
    offer_id: string;
    match_score: number;
    explanation: {
        semantic_similarity: number;
        location_match: number;
        skills_coverage: number;
        seniority_compatibility: number;
        preferences_alignment: number;
        reasons: string[];
        skill_gaps: string[];
    };
    offer_summary: {
        title: string;
        company_name: string;
        location: string;
        contract_type: string;
        salary_range: string | null;
    };
}, {
    offer_id: string;
    match_score: number;
    explanation: {
        semantic_similarity: number;
        location_match: number;
        skills_coverage: number;
        seniority_compatibility: number;
        preferences_alignment: number;
        reasons: string[];
        skill_gaps: string[];
    };
    offer_summary: {
        title: string;
        company_name: string;
        location: string;
        contract_type: string;
        salary_range: string | null;
    };
}>;
type CVJobMatch = z.infer<typeof CVJobMatchSchema>;
declare const CVProcessingErrorSchema: z.ZodObject<{
    error_code: z.ZodString;
    error_message: z.ZodString;
    error_details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    session_id: z.ZodOptional<z.ZodString>;
    recovery_suggestions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    error_message: string;
    error_code: string;
    session_id?: string | undefined;
    error_details?: Record<string, unknown> | undefined;
    recovery_suggestions?: string[] | undefined;
}, {
    error_message: string;
    error_code: string;
    session_id?: string | undefined;
    error_details?: Record<string, unknown> | undefined;
    recovery_suggestions?: string[] | undefined;
}>;
type CVProcessingError = z.infer<typeof CVProcessingErrorSchema>;
declare const CV_UPLOAD_STATUS: {
    readonly INITIATED: "initiated";
    readonly UPLOADING: "uploading";
    readonly UPLOADED: "uploaded";
    readonly PROCESSING: "processing";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
};
declare const CV_PROCESSING_STAGES: {
    readonly FILE_VALIDATION: "file_validation";
    readonly TEXT_EXTRACTION: "text_extraction";
    readonly AI_PARSING: "ai_parsing";
    readonly DATA_VALIDATION: "data_validation";
    readonly EMBEDDING_GENERATION: "embedding_generation";
    readonly PROFILE_CREATION: "profile_creation";
    readonly MATCHING_PREPARATION: "matching_preparation";
};
declare const CV_VALIDATION_TYPES: {
    readonly FORMAT: "format";
    readonly CONTENT: "content";
    readonly SECURITY: "security";
    readonly QUALITY: "quality";
};
declare const CV_PROCESSING_PRIORITIES: {
    readonly HIGH: 1;
    readonly NORMAL: 5;
    readonly LOW: 10;
};
declare const CV_CONSTRAINTS: {
    readonly MAX_FILE_SIZE_BYTES: number;
    readonly SUPPORTED_FORMATS: readonly ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    readonly MAX_FILENAME_LENGTH: 500;
    readonly MIN_CONFIDENCE_THRESHOLD: 0.8;
    readonly MAX_PROCESSING_TIME_SECONDS: 300;
};
declare const AnonymousCVResultSchema: z.ZodObject<{
    id: z.ZodString;
    anonymous_session_id: z.ZodString;
    upload_session_id: z.ZodString;
    skills_count: z.ZodDefault<z.ZodNumber>;
    experience_level: z.ZodNullable<z.ZodString>;
    job_matches_count: z.ZodDefault<z.ZodNumber>;
    confidence_score: z.ZodNullable<z.ZodNumber>;
    skills_preview: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        normalized_name: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: number;
        normalized_name: string;
    }, {
        name: string;
        confidence: number;
        normalized_name: string;
    }>, "many">>;
    additional_skills_available: z.ZodDefault<z.ZodNumber>;
    detailed_matches_available: z.ZodDefault<z.ZodNumber>;
    ai_insights_available: z.ZodDefault<z.ZodBoolean>;
    viewed_count: z.ZodDefault<z.ZodNumber>;
    last_viewed_at: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    expires_at: z.ZodString;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    expires_at: string;
    skills_count: number;
    anonymous_session_id: string;
    metadata: Record<string, unknown>;
    upload_session_id: string;
    experience_level: string | null;
    job_matches_count: number;
    confidence_score: number | null;
    skills_preview: {
        name: string;
        confidence: number;
        normalized_name: string;
    }[];
    additional_skills_available: number;
    detailed_matches_available: number;
    ai_insights_available: boolean;
    viewed_count: number;
    last_viewed_at: string | null;
}, {
    id: string;
    created_at: string;
    expires_at: string;
    anonymous_session_id: string;
    upload_session_id: string;
    experience_level: string | null;
    confidence_score: number | null;
    last_viewed_at: string | null;
    skills_count?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    job_matches_count?: number | undefined;
    skills_preview?: {
        name: string;
        confidence: number;
        normalized_name: string;
    }[] | undefined;
    additional_skills_available?: number | undefined;
    detailed_matches_available?: number | undefined;
    ai_insights_available?: boolean | undefined;
    viewed_count?: number | undefined;
}>;
type AnonymousCVResult = z.infer<typeof AnonymousCVResultSchema>;
declare const AnonymousCVMigrationSchema: z.ZodObject<{
    id: z.ZodString;
    anonymous_session_id: z.ZodString;
    original_upload_session_id: z.ZodString;
    new_user_id: z.ZodString;
    new_upload_session_id: z.ZodString;
    new_cv_profile_id: z.ZodNullable<z.ZodString>;
    migration_status: z.ZodDefault<z.ZodEnum<["pending", "completed", "failed"]>>;
    migrated_data_types: z.ZodDefault<z.ZodArray<z.ZodEnum<["upload_session", "cv_profile", "cv_embeddings", "results"]>, "many">>;
    migration_started_at: z.ZodString;
    migration_completed_at: z.ZodNullable<z.ZodString>;
    error_message: z.ZodNullable<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    error_message: string | null;
    anonymous_session_id: string;
    metadata: Record<string, unknown>;
    original_upload_session_id: string;
    new_user_id: string;
    new_upload_session_id: string;
    new_cv_profile_id: string | null;
    migration_status: "pending" | "completed" | "failed";
    migrated_data_types: ("upload_session" | "cv_profile" | "cv_embeddings" | "results")[];
    migration_started_at: string;
    migration_completed_at: string | null;
}, {
    id: string;
    error_message: string | null;
    anonymous_session_id: string;
    original_upload_session_id: string;
    new_user_id: string;
    new_upload_session_id: string;
    new_cv_profile_id: string | null;
    migration_started_at: string;
    migration_completed_at: string | null;
    metadata?: Record<string, unknown> | undefined;
    migration_status?: "pending" | "completed" | "failed" | undefined;
    migrated_data_types?: ("upload_session" | "cv_profile" | "cv_embeddings" | "results")[] | undefined;
}>;
type AnonymousCVMigration = z.infer<typeof AnonymousCVMigrationSchema>;
declare const SessionDetectionResponseSchema: z.ZodObject<{
    session_type: z.ZodEnum<["authenticated", "anonymous", "invalid"]>;
    user_id: z.ZodNullable<z.ZodString>;
    anonymous_session_id: z.ZodNullable<z.ZodString>;
    session_token: z.ZodNullable<z.ZodString>;
    requires_auth: z.ZodBoolean;
    can_access_cv_processing: z.ZodBoolean;
    upload_attempts_remaining: z.ZodNullable<z.ZodNumber>;
    session_expires_at: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    user_id: string | null;
    anonymous_session_id: string | null;
    session_type: "authenticated" | "anonymous" | "invalid";
    session_token: string | null;
    requires_auth: boolean;
    can_access_cv_processing: boolean;
    upload_attempts_remaining: number | null;
    session_expires_at: string | null;
}, {
    user_id: string | null;
    anonymous_session_id: string | null;
    session_type: "authenticated" | "anonymous" | "invalid";
    session_token: string | null;
    requires_auth: boolean;
    can_access_cv_processing: boolean;
    upload_attempts_remaining: number | null;
    session_expires_at: string | null;
}>;
type SessionDetectionResponse = z.infer<typeof SessionDetectionResponseSchema>;
declare const PartialCVResultsResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session_id: z.ZodString;
    access_level: z.ZodEnum<["partial", "full"]>;
    summary: z.ZodObject<{
        skills_found: z.ZodNumber;
        experience_level: z.ZodString;
        job_opportunities_estimated: z.ZodNumber;
        analysis_confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        experience_level: string;
        skills_found: number;
        job_opportunities_estimated: number;
        analysis_confidence: number;
    }, {
        experience_level: string;
        skills_found: number;
        job_opportunities_estimated: number;
        analysis_confidence: number;
    }>;
    skills_preview: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        confidence: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        confidence: "low" | "high" | "medium";
    }, {
        name: string;
        confidence: "low" | "high" | "medium";
    }>, "many">;
    location_detected: z.ZodNullable<z.ZodObject<{
        city: z.ZodNullable<z.ZodString>;
        region: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city: string | null;
        region: string | null;
    }, {
        city: string | null;
        region: string | null;
    }>>;
    full_results_available: z.ZodObject<{
        complete_skills_analysis: z.ZodNumber;
        detailed_job_matches: z.ZodNumber;
        ai_powered_insights: z.ZodBoolean;
        personalized_recommendations: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        complete_skills_analysis: number;
        detailed_job_matches: number;
        ai_powered_insights: boolean;
        personalized_recommendations: boolean;
    }, {
        complete_skills_analysis: number;
        detailed_job_matches: number;
        ai_powered_insights: boolean;
        personalized_recommendations: boolean;
    }>;
    call_to_action: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        action_url: z.ZodString;
        expires_at: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        title: string;
        description: string;
        expires_at: string;
        action_url: string;
    }, {
        title: string;
        description: string;
        expires_at: string;
        action_url: string;
    }>;
    processed_at: z.ZodString;
    expires_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    processed_at: string;
    expires_at: string;
    success: boolean;
    session_id: string;
    skills_preview: {
        name: string;
        confidence: "low" | "high" | "medium";
    }[];
    access_level: "partial" | "full";
    summary: {
        experience_level: string;
        skills_found: number;
        job_opportunities_estimated: number;
        analysis_confidence: number;
    };
    location_detected: {
        city: string | null;
        region: string | null;
    } | null;
    full_results_available: {
        complete_skills_analysis: number;
        detailed_job_matches: number;
        ai_powered_insights: boolean;
        personalized_recommendations: boolean;
    };
    call_to_action: {
        title: string;
        description: string;
        expires_at: string;
        action_url: string;
    };
}, {
    processed_at: string;
    expires_at: string;
    success: boolean;
    session_id: string;
    skills_preview: {
        name: string;
        confidence: "low" | "high" | "medium";
    }[];
    access_level: "partial" | "full";
    summary: {
        experience_level: string;
        skills_found: number;
        job_opportunities_estimated: number;
        analysis_confidence: number;
    };
    location_detected: {
        city: string | null;
        region: string | null;
    } | null;
    full_results_available: {
        complete_skills_analysis: number;
        detailed_job_matches: number;
        ai_powered_insights: boolean;
        personalized_recommendations: boolean;
    };
    call_to_action: {
        title: string;
        description: string;
        expires_at: string;
        action_url: string;
    };
}>;
type PartialCVResultsResponse = z.infer<typeof PartialCVResultsResponseSchema>;
declare const AnonymousCVProcessingRequestSchema: z.ZodObject<{
    session_token: z.ZodString;
    session_id: z.ZodString;
    generate_partial_results: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    session_id: string;
    session_token: string;
    generate_partial_results: boolean;
}, {
    session_id: string;
    session_token: string;
    generate_partial_results?: boolean | undefined;
}>;
type AnonymousCVProcessingRequest = z.infer<typeof AnonymousCVProcessingRequestSchema>;
declare const CVMigrationRequestSchema: z.ZodObject<{
    anonymous_session_token: z.ZodString;
    new_user_id: z.ZodString;
    migrate_all_data: z.ZodDefault<z.ZodBoolean>;
    migrate_data_types: z.ZodOptional<z.ZodArray<z.ZodEnum<["upload_session", "cv_profile", "cv_embeddings", "results"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    new_user_id: string;
    anonymous_session_token: string;
    migrate_all_data: boolean;
    migrate_data_types?: ("upload_session" | "cv_profile" | "cv_embeddings" | "results")[] | undefined;
}, {
    new_user_id: string;
    anonymous_session_token: string;
    migrate_all_data?: boolean | undefined;
    migrate_data_types?: ("upload_session" | "cv_profile" | "cv_embeddings" | "results")[] | undefined;
}>;
type CVMigrationRequest = z.infer<typeof CVMigrationRequestSchema>;
declare const ANONYMOUS_CV_CONSTRAINTS: {
    readonly MAX_SKILLS_PREVIEW: 5;
    readonly SESSION_DURATION_MINUTES: 60;
    readonly PARTIAL_RESULTS_EXPIRY_MINUTES: 60;
    readonly MAX_ANONYMOUS_UPLOADS_PER_SESSION: 3;
    readonly MIN_CONFIDENCE_FOR_PARTIAL_RESULTS: 0.6;
    readonly PARTIAL_RESULTS_REFRESH_INTERVAL_MS: 30000;
};

/**
 * Anonymous Session Foundation System Types
 *
 * Types and schemas for anonymous user sessions, CV processing,
 * and partial results display for the "try before you buy" experience.
 */

/**
 * Anonymous Session Schema
 * Secure cookie-based session tracking for anonymous users
 */
declare const AnonymousSessionSchema: z.ZodObject<{
    id: z.ZodString;
    session_token: z.ZodString;
    client_ip: z.ZodString;
    user_agent_hash: z.ZodString;
    browser_fingerprint: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
    last_accessed_at: z.ZodString;
    expires_at: z.ZodString;
    is_active: z.ZodBoolean;
    upload_attempts: z.ZodNumber;
    max_upload_attempts: z.ZodNumber;
    converted_to_user_id: z.ZodNullable<z.ZodString>;
    converted_at: z.ZodNullable<z.ZodString>;
    security_flags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    is_active: boolean;
    expires_at: string;
    session_token: string;
    client_ip: string;
    user_agent_hash: string;
    last_accessed_at: string;
    upload_attempts: number;
    max_upload_attempts: number;
    converted_to_user_id: string | null;
    converted_at: string | null;
    metadata?: Record<string, unknown> | undefined;
    browser_fingerprint?: string | undefined;
    security_flags?: Record<string, unknown> | undefined;
}, {
    id: string;
    created_at: string;
    is_active: boolean;
    expires_at: string;
    session_token: string;
    client_ip: string;
    user_agent_hash: string;
    last_accessed_at: string;
    upload_attempts: number;
    max_upload_attempts: number;
    converted_to_user_id: string | null;
    converted_at: string | null;
    metadata?: Record<string, unknown> | undefined;
    browser_fingerprint?: string | undefined;
    security_flags?: Record<string, unknown> | undefined;
}>;
type AnonymousSession = z.infer<typeof AnonymousSessionSchema>;
/**
 * Anonymous CV Session Schema
 * Links anonymous sessions to CV processing pipeline
 */
declare const AnonymousCVSessionSchema: z.ZodObject<{
    id: z.ZodString;
    anonymous_session_id: z.ZodString;
    filename: z.ZodString;
    file_size_bytes: z.ZodNumber;
    file_hash: z.ZodString;
    storage_path: z.ZodString;
    upload_status: z.ZodEnum<["initiated", "uploading", "uploaded", "processing", "completed", "failed"]>;
    processing_status: z.ZodNullable<z.ZodEnum<["pending", "processing", "completed", "failed"]>>;
    processing_started_at: z.ZodNullable<z.ZodString>;
    processing_completed_at: z.ZodNullable<z.ZodString>;
    partial_results: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    full_results_available: z.ZodBoolean;
    error_message: z.ZodNullable<z.ZodString>;
    retry_count: z.ZodNumber;
    max_retries: z.ZodNumber;
    created_at: z.ZodString;
    updated_at: z.ZodString;
    expires_at: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    error_message: string | null;
    retry_count: number;
    expires_at: string;
    anonymous_session_id: string;
    filename: string;
    file_size_bytes: number;
    file_hash: string;
    upload_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    storage_path: string;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    max_retries: number;
    full_results_available: boolean;
    processing_status: "pending" | "processing" | "completed" | "failed" | null;
    partial_results: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    error_message: string | null;
    retry_count: number;
    expires_at: string;
    anonymous_session_id: string;
    filename: string;
    file_size_bytes: number;
    file_hash: string;
    upload_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    storage_path: string;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    max_retries: number;
    full_results_available: boolean;
    processing_status: "pending" | "processing" | "completed" | "failed" | null;
    partial_results: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | undefined;
}>;
type AnonymousCVSession = z.infer<typeof AnonymousCVSessionSchema>;
/**
 * Anonymous Session Rate Limits Schema
 * Rate limiting and abuse prevention
 */
declare const AnonymousSessionRateLimitSchema: z.ZodObject<{
    id: z.ZodString;
    anonymous_session_id: z.ZodString;
    window_start: z.ZodString;
    window_duration: z.ZodString;
    api_calls_count: z.ZodNumber;
    upload_attempts: z.ZodNumber;
    max_api_calls: z.ZodNumber;
    max_uploads: z.ZodNumber;
    is_blocked: z.ZodBoolean;
    blocked_until: z.ZodNullable<z.ZodString>;
    block_reason: z.ZodNullable<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    created_at: string;
    updated_at: string;
    anonymous_session_id: string;
    upload_attempts: number;
    window_start: string;
    window_duration: string;
    api_calls_count: number;
    max_api_calls: number;
    max_uploads: number;
    is_blocked: boolean;
    blocked_until: string | null;
    block_reason: string | null;
}, {
    id: string;
    created_at: string;
    updated_at: string;
    anonymous_session_id: string;
    upload_attempts: number;
    window_start: string;
    window_duration: string;
    api_calls_count: number;
    max_api_calls: number;
    max_uploads: number;
    is_blocked: boolean;
    blocked_until: string | null;
    block_reason: string | null;
}>;
type AnonymousSessionRateLimit = z.infer<typeof AnonymousSessionRateLimitSchema>;
/**
 * Anonymous Session Creation Request
 */
declare const CreateAnonymousSessionRequestSchema: z.ZodObject<{
    browser_fingerprint: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    browser_fingerprint?: string | undefined;
}, {
    browser_fingerprint?: string | undefined;
}>;
type CreateAnonymousSessionRequest = z.infer<typeof CreateAnonymousSessionRequestSchema>;
/**
 * Anonymous Session Creation Response
 */
declare const CreateAnonymousSessionResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session_token: z.ZodString;
    session_id: z.ZodString;
    expires_at: z.ZodString;
    remaining_uploads: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expires_at: string;
    success: boolean;
    session_id: string;
    session_token: string;
    remaining_uploads: number;
    message?: string | undefined;
}, {
    expires_at: string;
    success: boolean;
    session_id: string;
    session_token: string;
    remaining_uploads: number;
    message?: string | undefined;
}>;
type CreateAnonymousSessionResponse = z.infer<typeof CreateAnonymousSessionResponseSchema>;
/**
 * Anonymous Session Validation Response
 */
declare const ValidateAnonymousSessionResponseSchema: z.ZodObject<{
    session_id: z.ZodString;
    is_valid: z.ZodBoolean;
    remaining_uploads: z.ZodNumber;
    rate_limited: z.ZodBoolean;
    session_expires_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    session_id: string;
    session_expires_at: string;
    remaining_uploads: number;
    is_valid: boolean;
    rate_limited: boolean;
}, {
    session_id: string;
    session_expires_at: string;
    remaining_uploads: number;
    is_valid: boolean;
    rate_limited: boolean;
}>;
type ValidateAnonymousSessionResponse = z.infer<typeof ValidateAnonymousSessionResponseSchema>;
/**
 * Anonymous CV Upload Init Request
 */
declare const AnonymousCVUploadInitRequestSchema: z.ZodObject<{
    filename: z.ZodString;
    file_size: z.ZodNumber;
    content_type: z.ZodEnum<["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]>;
    file_hash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file_size: number;
    filename: string;
    file_hash: string;
    content_type: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}, {
    file_size: number;
    filename: string;
    file_hash: string;
    content_type: "application/pdf" | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
}>;
type AnonymousCVUploadInitRequest = z.infer<typeof AnonymousCVUploadInitRequestSchema>;
/**
 * Anonymous CV Upload Init Response
 */
declare const AnonymousCVUploadInitResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session_id: z.ZodString;
    cv_session_id: z.ZodString;
    upload_url: z.ZodString;
    expires_at: z.ZodString;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    expires_at: string;
    success: boolean;
    session_id: string;
    upload_url: string;
    cv_session_id: string;
    message?: string | undefined;
}, {
    expires_at: string;
    success: boolean;
    session_id: string;
    upload_url: string;
    cv_session_id: string;
    message?: string | undefined;
}>;
type AnonymousCVUploadInitResponse = z.infer<typeof AnonymousCVUploadInitResponseSchema>;
/**
 * Anonymous CV Processing Status Response
 */
declare const AnonymousCVProcessingStatusSchema: z.ZodObject<{
    cv_session_id: z.ZodString;
    upload_status: z.ZodEnum<["initiated", "uploading", "uploaded", "processing", "completed", "failed"]>;
    processing_status: z.ZodNullable<z.ZodEnum<["pending", "processing", "completed", "failed"]>>;
    progress_percentage: z.ZodNumber;
    current_stage: z.ZodString;
    estimated_time_remaining: z.ZodNullable<z.ZodNumber>;
    partial_results: z.ZodNullable<z.ZodObject<{
        job_title: z.ZodOptional<z.ZodString>;
        experience_level: z.ZodOptional<z.ZodEnum<["intern", "junior", "mid", "senior", "lead", "manager"]>>;
        key_skills: z.ZodArray<z.ZodString, "many">;
        location_preference: z.ZodOptional<z.ZodString>;
        education_level: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        key_skills: string[];
        job_title?: string | undefined;
        experience_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
        location_preference?: string | undefined;
        education_level?: string | undefined;
    }, {
        key_skills: string[];
        job_title?: string | undefined;
        experience_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
        location_preference?: string | undefined;
        education_level?: string | undefined;
    }>>;
    full_results_available: z.ZodBoolean;
    registration_required: z.ZodBoolean;
    error_message: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    error_message: string | null;
    upload_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    progress_percentage: number;
    current_stage: string;
    estimated_time_remaining: number | null;
    full_results_available: boolean;
    processing_status: "pending" | "processing" | "completed" | "failed" | null;
    partial_results: {
        key_skills: string[];
        job_title?: string | undefined;
        experience_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
        location_preference?: string | undefined;
        education_level?: string | undefined;
    } | null;
    cv_session_id: string;
    registration_required: boolean;
}, {
    error_message: string | null;
    upload_status: "processing" | "completed" | "failed" | "initiated" | "uploading" | "uploaded";
    progress_percentage: number;
    current_stage: string;
    estimated_time_remaining: number | null;
    full_results_available: boolean;
    processing_status: "pending" | "processing" | "completed" | "failed" | null;
    partial_results: {
        key_skills: string[];
        job_title?: string | undefined;
        experience_level?: "intern" | "junior" | "mid" | "senior" | "lead" | "manager" | undefined;
        location_preference?: string | undefined;
        education_level?: string | undefined;
    } | null;
    cv_session_id: string;
    registration_required: boolean;
}>;
type AnonymousCVProcessingStatus = z.infer<typeof AnonymousCVProcessingStatusSchema>;
/**
 * Session Cookie Configuration
 */
declare const SessionCookieConfigSchema: z.ZodObject<{
    name: z.ZodString;
    maxAge: z.ZodNumber;
    httpOnly: z.ZodBoolean;
    secure: z.ZodBoolean;
    sameSite: z.ZodEnum<["strict", "lax", "none"]>;
    domain: z.ZodOptional<z.ZodString>;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    name: string;
    maxAge: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    domain?: string | undefined;
}, {
    path: string;
    name: string;
    maxAge: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    domain?: string | undefined;
}>;
type SessionCookieConfig = z.infer<typeof SessionCookieConfigSchema>;
/**
 * Rate Limiting Configuration
 */
declare const RateLimitConfigSchema: z.ZodObject<{
    max_uploads_per_session: z.ZodNumber;
    max_api_calls_per_hour: z.ZodNumber;
    upload_window_minutes: z.ZodNumber;
    block_duration_minutes: z.ZodNumber;
    cleanup_interval_minutes: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    max_uploads_per_session: number;
    max_api_calls_per_hour: number;
    upload_window_minutes: number;
    block_duration_minutes: number;
    cleanup_interval_minutes: number;
}, {
    max_uploads_per_session: number;
    max_api_calls_per_hour: number;
    upload_window_minutes: number;
    block_duration_minutes: number;
    cleanup_interval_minutes: number;
}>;
type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
/**
 * Security Configuration
 */
declare const SecurityConfigSchema: z.ZodObject<{
    require_ip_consistency: z.ZodBoolean;
    require_user_agent_consistency: z.ZodBoolean;
    enable_browser_fingerprinting: z.ZodBoolean;
    max_session_lifetime_minutes: z.ZodNumber;
    enable_cleanup_job: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    require_ip_consistency: boolean;
    require_user_agent_consistency: boolean;
    enable_browser_fingerprinting: boolean;
    max_session_lifetime_minutes: number;
    enable_cleanup_job: boolean;
}, {
    require_ip_consistency: boolean;
    require_user_agent_consistency: boolean;
    enable_browser_fingerprinting: boolean;
    max_session_lifetime_minutes: number;
    enable_cleanup_job: boolean;
}>;
type SecurityConfig = z.infer<typeof SecurityConfigSchema>;
/**
 * Anonymous Session Error Codes
 */
declare const AnonymousSessionErrorCodes: {
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly SESSION_NOT_FOUND: "SESSION_NOT_FOUND";
    readonly SESSION_RATE_LIMITED: "SESSION_RATE_LIMITED";
    readonly SESSION_BLOCKED: "SESSION_BLOCKED";
    readonly INVALID_SESSION_TOKEN: "INVALID_SESSION_TOKEN";
    readonly SECURITY_VIOLATION: "SECURITY_VIOLATION";
    readonly UPLOAD_LIMIT_EXCEEDED: "UPLOAD_LIMIT_EXCEEDED";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly INVALID_FILE_TYPE: "INVALID_FILE_TYPE";
    readonly PROCESSING_FAILED: "PROCESSING_FAILED";
};
type AnonymousSessionErrorCode = typeof AnonymousSessionErrorCodes[keyof typeof AnonymousSessionErrorCodes];
/**
 * Anonymous Session Error Schema
 */
declare const AnonymousSessionErrorSchema: z.ZodObject<{
    code: z.ZodEnum<["SESSION_EXPIRED", "SESSION_NOT_FOUND", "SESSION_RATE_LIMITED", "SESSION_BLOCKED", "INVALID_SESSION_TOKEN", "SECURITY_VIOLATION", "UPLOAD_LIMIT_EXCEEDED", "FILE_TOO_LARGE", "INVALID_FILE_TYPE", "PROCESSING_FAILED"]>;
    message: z.ZodString;
    details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    retry_after: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    code: "SESSION_EXPIRED" | "SESSION_NOT_FOUND" | "SESSION_RATE_LIMITED" | "SESSION_BLOCKED" | "INVALID_SESSION_TOKEN" | "SECURITY_VIOLATION" | "UPLOAD_LIMIT_EXCEEDED" | "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "PROCESSING_FAILED";
    message: string;
    details?: Record<string, unknown> | undefined;
    retry_after?: number | undefined;
}, {
    code: "SESSION_EXPIRED" | "SESSION_NOT_FOUND" | "SESSION_RATE_LIMITED" | "SESSION_BLOCKED" | "INVALID_SESSION_TOKEN" | "SECURITY_VIOLATION" | "UPLOAD_LIMIT_EXCEEDED" | "FILE_TOO_LARGE" | "INVALID_FILE_TYPE" | "PROCESSING_FAILED";
    message: string;
    details?: Record<string, unknown> | undefined;
    retry_after?: number | undefined;
}>;
type AnonymousSessionError = z.infer<typeof AnonymousSessionErrorSchema>;
declare const ANONYMOUS_SESSION_CONSTANTS: {
    readonly SESSION_LIFETIME_MINUTES: 60;
    readonly CV_SESSION_LIFETIME_HOURS: 2;
    readonly SESSION_COOKIE_NAME: "cledger_anonymous_session";
    readonly MAX_UPLOADS_PER_SESSION: 3;
    readonly MAX_API_CALLS_PER_HOUR: 100;
    readonly RATE_LIMIT_WINDOW_MINUTES: 60;
    readonly BLOCK_DURATION_MINUTES: 30;
    readonly MAX_FILE_SIZE_BYTES: number;
    readonly ALLOWED_MIME_TYPES: readonly ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    readonly SESSION_TOKEN_LENGTH: 32;
    readonly CLEANUP_INTERVAL_MINUTES: 15;
    readonly MAX_SKILLS_SHOWN: 5;
    readonly MAX_EXPERIENCE_DETAIL: "basic";
};
type AnonymousSessionConstants = typeof ANONYMOUS_SESSION_CONSTANTS;

export { ANONYMOUS_CV_CONSTRAINTS, ANONYMOUS_SESSION_CONSTANTS, type AdminBatchEnrichmentRequest, AdminBatchEnrichmentRequestSchema, type AdminEnrichmentStats, AdminEnrichmentStatsSchema, Agent, AgentCapability, type AgentCapabilityType, AgentConversation, type AgentConversationType, AgentResponse, type AgentResponseType, type AgentType, type AnonymousCVMigration, AnonymousCVMigrationSchema, type AnonymousCVProcessingRequest, AnonymousCVProcessingRequestSchema, type AnonymousCVProcessingStatus, AnonymousCVProcessingStatusSchema, type AnonymousCVResult, AnonymousCVResultSchema, type AnonymousCVSession, AnonymousCVSessionSchema, type AnonymousCVUploadInitRequest, AnonymousCVUploadInitRequestSchema, type AnonymousCVUploadInitResponse, AnonymousCVUploadInitResponseSchema, type AnonymousSession, type AnonymousSessionConstants, type AnonymousSessionError, type AnonymousSessionErrorCode, AnonymousSessionErrorCodes, AnonymousSessionErrorSchema, type AnonymousSessionRateLimit, AnonymousSessionRateLimitSchema, AnonymousSessionSchema, type AppRole, AppRoleEnum, type AppUser, AppUserSchema, type Batch, type BatchCreateRequest, BatchCreateRequestSchema, BatchSchema, type BatchStatus, BatchStatusEnum, type CEFRLevel, CEFRLevelEnum, type CVAIExtraction, CVAIExtractionSchema, type CVDegree, CVDegreeSchema, type CVDocument, CVDocumentSchema, type CVEmbedding, type CVEmbeddingContext, CVEmbeddingContextSchema, CVEmbeddingSchema, type CVEnrichment, CVEnrichmentSchema, type CVExperience, CVExperienceSchema, type CVJobMatch, CVJobMatchSchema, type CVLanguage, CVLanguageSchema, type CVMigrationRequest, CVMigrationRequestSchema, type CVParseStatus, CVParseStatusEnum, type CVProcessStatusResponse, CVProcessStatusResponseSchema, type CVProcessingError, CVProcessingErrorSchema, type CVProcessingMetric, CVProcessingMetricSchema, type CVProcessingProgress, CVProcessingProgressSchema, type CVProcessingQueue, CVProcessingQueueSchema, type CVProcessingStage, CVProcessingStageSchema, type CVSkill, CVSkillSchema, type CVUploadInitRequest, CVUploadInitRequestSchema, type CVUploadInitResponse, CVUploadInitResponseSchema, type CVUploadRequest, CVUploadRequestSchema, type CVUploadSession, CVUploadSessionSchema, type CVValidationResult, CVValidationResultSchema, CV_CONSTRAINTS, CV_PROCESSING_PRIORITIES, CV_PROCESSING_STAGES, CV_UPLOAD_STATUS, CV_VALIDATION_TYPES, type CandidateProfile, CandidateProfileSchema, CapabilitiesResponse, type CapabilitiesResponseType, type Company, CompanySchema, type ConfidenceScore, ConfidenceScoreSchema, type ConfidenceScores, ConfidenceScoresSchema, type ContractType, ContractTypeEnum, ConversationStatus, type ConversationStatusType, type CreateAnonymousSessionRequest, CreateAnonymousSessionRequestSchema, type CreateAnonymousSessionResponse, CreateAnonymousSessionResponseSchema, type Database, type DegreeClassification, DegreeClassificationSchema, type DegreeRequirement, DegreeRequirementSchema, DelegateTaskRequest, type DelegateTaskRequestType, type EnrichedLanguage, EnrichedLanguageSchema, type EnrichedSkill, EnrichedSkillSchema, type EnrichmentHistoryItem, EnrichmentHistoryItemSchema, type EnrichmentHistoryResponse, EnrichmentHistoryResponseSchema, type EnrichmentRequest, EnrichmentRequestSchema, type EnrichmentResponse, EnrichmentResponseSchema, type ErrorResponse, ErrorResponseSchema, type IngestOffersRequest, IngestOffersRequestSchema, InvokeAgentRequest, type InvokeAgentRequestType, type LanguageDetection, LanguageDetectionSchema, type LanguageRequirement, LanguageRequirementSchema, type Location, LocationSchema, type LoginCredentials, LoginSchema, type MatchRequest, MatchRequestSchema, type MatchResult, MatchResultSchema, type Offer, type OfferEmbedding, OfferEmbeddingSchema, type OfferEnrichment, OfferEnrichmentSchema, OfferSchema, type OfferSource, OfferSourceEnum, type OfferStatus, OfferStatusEnum, type Pagination, PaginationSchema, type PartialCVResultsResponse, PartialCVResultsResponseSchema, type PasswordReset, type PasswordResetRequest, PasswordResetRequestSchema, PasswordResetSchema, Priority, type RateLimitConfig, RateLimitConfigSchema, type Registration, RegistrationSchema, type SSEEvent, SSEEventSchema, type SSEEventType, SSEEventTypeEnum, type SearchOffersRequest, SearchOffersRequestSchema, type SecurityConfig, SecurityConfigSchema, type SeniorityLevel, SeniorityLevelEnum, type Session, type SessionCookieConfig, SessionCookieConfigSchema, type SessionDetectionResponse, SessionDetectionResponseSchema, SessionSchema, type Skill, type SkillCategory, SkillCategoryEnum, type SkillExtraction, SkillExtractionSchema, SkillSchema, type SortOrder, SortOrderEnum, type SuccessResponse, SuccessResponseSchema, TaskType, type TaskTypeType, type ValidateAnonymousSessionResponse, ValidateAnonymousSessionResponseSchema, type WorkMode, WorkModeEnum, canAgentInvoke, getAgentByCapability, getAgentsByTaskType };
