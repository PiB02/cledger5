import { z } from 'zod';

// Base upload session schema
export const CVUploadSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string(),
  filename: z.string().max(500),
  file_size_bytes: z.number().int().min(0),
  file_hash: z.string().length(64), // SHA256 hash
  upload_status: z.enum(['initiated', 'uploading', 'uploaded', 'processing', 'completed', 'failed']),
  storage_path: z.string().nullable(),
  processing_started_at: z.string().datetime().nullable(),
  processing_completed_at: z.string().datetime().nullable(),
  error_message: z.string().nullable(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CVUploadSession = z.infer<typeof CVUploadSessionSchema>;

// Processing queue schema
export const CVProcessingQueueSchema = z.object({
  id: z.string().uuid(),
  upload_session_id: z.string().uuid(),
  queue_status: z.enum(['pending', 'processing', 'completed', 'failed', 'retry']),
  priority: z.number().int().min(1).max(10).default(5),
  retry_count: z.number().int().min(0).default(0),
  max_retries: z.number().int().min(0).default(3),
  processing_started_at: z.string().datetime().nullable(),
  processing_completed_at: z.string().datetime().nullable(),
  worker_id: z.string().max(100).nullable(),
  error_message: z.string().nullable(),
  stage_details: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type CVProcessingQueue = z.infer<typeof CVProcessingQueueSchema>;

// Validation results schema
export const CVValidationResultSchema = z.object({
  id: z.string().uuid(),
  upload_session_id: z.string().uuid(),
  validation_type: z.enum(['format', 'content', 'security', 'quality']),
  validation_status: z.enum(['passed', 'failed', 'warning']),
  validation_score: z.number().min(0).max(1).nullable(),
  validation_details: z.record(z.unknown()).default({}),
  validation_errors: z.array(z.string()).default([]),
  created_at: z.string().datetime(),
});

export type CVValidationResult = z.infer<typeof CVValidationResultSchema>;

// Processing metrics schema
export const CVProcessingMetricSchema = z.object({
  id: z.string().uuid(),
  upload_session_id: z.string().uuid(),
  metric_type: z.enum(['processing_time', 'api_cost', 'extraction_accuracy', 'tokens_used']),
  metric_value: z.number(),
  metric_unit: z.enum(['seconds', 'dollars', 'percentage', 'tokens']).nullable(),
  processing_stage: z.enum(['text_extraction', 'ai_parsing', 'embedding_generation', 'total']).nullable(),
  metadata: z.record(z.unknown()).default({}),
  created_at: z.string().datetime(),
});

export type CVProcessingMetric = z.infer<typeof CVProcessingMetricSchema>;

// CV-specific embedding context (extends existing embedding format)
export const CVEmbeddingContextSchema = z.object({
  profile_title: z.string(),
  rome_codes: z.array(z.string()),
  location: z.object({
    city: z.string(),
    department_code: z.string(),
    region_code: z.string(),
    country: z.string().default('FR'),
  }),
  seniority_level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager']),
  contract_preferences: z.array(z.enum(['CDI', 'CDD', 'APP', 'PRO', 'INTERIM', 'STAGE', 'FLEXIBLE'])),
  work_mode_preferences: z.array(z.enum(['onsite', 'remote', 'hybrid', 'flexible'])),
  languages: z.array(z.object({
    code: z.string().length(2),
    cefr_level: z.number().int().min(1).max(6),
    confidence: z.number().min(0).max(1),
  })),
  degree_eqf_top: z.number().int().min(1).max(8).nullable(),
  skills_mastered: z.array(z.object({
    name: z.string(),
    normalized_name: z.string(),
    years_experience: z.number().min(0).nullable(),
    confidence: z.number().min(0).max(1),
  })),
  skills_learning: z.array(z.object({
    name: z.string(),
    normalized_name: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  salary_expectation: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
    period: z.enum(['annual', 'monthly', 'daily']),
    currency: z.string().default('EUR'),
  }).nullable(),
  availability: z.string().nullable(), // Format: 'YYYY-MM' or 'ASAP'
});

export type CVEmbeddingContext = z.infer<typeof CVEmbeddingContextSchema>;

// AI extraction result schema (from GPT-4o-mini)
export const CVAIExtractionSchema = z.object({
  profile: z.object({
    title_canonical: z.string(),
    location_preferred: z.object({
      city: z.string(),
      department_code: z.string(),
      region_code: z.string(),
    }),
    availability: z.string().nullable(),
    seniority_level: z.enum(['intern', 'junior', 'mid', 'senior', 'lead', 'manager']),
  }),
  skills_mastered: z.array(z.object({
    name: z.string(),
    normalized_name: z.string(),
    years_experience: z.number().min(0).nullable(),
    confidence: z.number().min(0).max(1),
  })),
  skills_learning: z.array(z.object({
    name: z.string(),
    normalized_name: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  experience: z.object({
    total_years: z.number().min(0),
    rome_codes_detected: z.array(z.string()),
    previous_roles: z.array(z.object({
      title: z.string(),
      duration_months: z.number().int().min(0),
      company: z.string(),
      responsibilities: z.array(z.string()).optional(),
    })),
  }),
  education: z.object({
    highest_degree: z.object({
      level_eqf: z.number().int().min(1).max(8),
      degree_type: z.string(),
      confidence: z.number().min(0).max(1),
    }).nullable(),
  }),
  languages: z.array(z.object({
    code: z.string().length(2),
    cefr_level: z.number().int().min(1).max(6),
    confidence: z.number().min(0).max(1),
  })),
  preferences: z.object({
    contract_types: z.array(z.enum(['CDI', 'CDD', 'APP', 'PRO', 'INTERIM', 'STAGE'])),
    work_modes: z.array(z.enum(['onsite', 'remote', 'hybrid'])),
    salary_expectation: z.object({
      min: z.number().int().min(0),
      max: z.number().int().min(0),
      period: z.enum(['annual', 'monthly']),
    }).nullable(),
  }),
  confidence_scores: z.object({
    profile: z.number().min(0).max(1),
    skills: z.number().min(0).max(1),
    experience: z.number().min(0).max(1),
    education: z.number().min(0).max(1),
    global: z.number().min(0).max(1),
  }),
});

export type CVAIExtraction = z.infer<typeof CVAIExtractionSchema>;

// API request/response schemas
export const CVUploadInitRequestSchema = z.object({
  filename: z.string().min(1).max(500),
  file_size: z.number().int().min(1).max(10 * 1024 * 1024), // 10MB max
  file_hash: z.string().length(64), // SHA256
  content_type: z.enum(['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
});

export type CVUploadInitRequest = z.infer<typeof CVUploadInitRequestSchema>;

export const CVUploadInitResponseSchema = z.object({
  session_id: z.string().uuid(),
  upload_url: z.string().url(),
  success: z.boolean(),
  message: z.string().optional(),
});

export type CVUploadInitResponse = z.infer<typeof CVUploadInitResponseSchema>;

export const CVProcessStatusResponseSchema = z.object({
  session_id: z.string().uuid(),
  status: z.enum(['initiated', 'uploading', 'uploaded', 'processing', 'completed', 'failed']),
  progress_percentage: z.number().min(0).max(100),
  current_stage: z.string().optional(),
  estimated_time_remaining: z.number().nullable(), // seconds
  error_message: z.string().nullable(),
  validation_results: z.array(CVValidationResultSchema).optional(),
  processing_metrics: z.array(CVProcessingMetricSchema).optional(),
});

export type CVProcessStatusResponse = z.infer<typeof CVProcessStatusResponseSchema>;

// CV processing pipeline stages
export const CVProcessingStageSchema = z.object({
  stage_name: z.string(),
  stage_order: z.number().int().min(1),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'skipped']),
  progress_percentage: z.number().min(0).max(100),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  duration_ms: z.number().int().min(0).nullable(),
  error_message: z.string().nullable(),
  stage_data: z.record(z.unknown()).default({}),
});

export type CVProcessingStage = z.infer<typeof CVProcessingStageSchema>;

// Complete CV processing progress
export const CVProcessingProgressSchema = z.object({
  session_id: z.string().uuid(),
  overall_status: z.enum(['initiated', 'uploading', 'uploaded', 'processing', 'completed', 'failed']),
  overall_progress: z.number().min(0).max(100),
  estimated_completion: z.string().datetime().nullable(),
  stages: z.array(CVProcessingStageSchema),
  quality_score: z.number().min(0).max(1).nullable(),
  cost_estimate: z.number().min(0).nullable(), // in dollars
});

export type CVProcessingProgress = z.infer<typeof CVProcessingProgressSchema>;

// CV matching result schema (for job recommendations)
export const CVJobMatchSchema = z.object({
  offer_id: z.string(),
  match_score: z.number().min(0).max(1),
  explanation: z.object({
    semantic_similarity: z.number().min(0).max(1),
    skills_coverage: z.number().min(0).max(1),
    seniority_compatibility: z.number().min(0).max(1),
    location_match: z.number().min(0).max(1),
    preferences_alignment: z.number().min(0).max(1),
    reasons: z.array(z.string()),
    skill_gaps: z.array(z.string()),
  }),
  offer_summary: z.object({
    title: z.string(),
    company_name: z.string(),
    location: z.string(),
    contract_type: z.string(),
    salary_range: z.string().nullable(),
  }),
});

export type CVJobMatch = z.infer<typeof CVJobMatchSchema>;

// Error schemas for API responses
export const CVProcessingErrorSchema = z.object({
  error_code: z.string(),
  error_message: z.string(),
  error_details: z.record(z.unknown()).optional(),
  session_id: z.string().uuid().optional(),
  recovery_suggestions: z.array(z.string()).optional(),
});

export type CVProcessingError = z.infer<typeof CVProcessingErrorSchema>;

// Constants and enums
export const CV_UPLOAD_STATUS = {
  INITIATED: 'initiated',
  UPLOADING: 'uploading',
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const CV_PROCESSING_STAGES = {
  FILE_VALIDATION: 'file_validation',
  TEXT_EXTRACTION: 'text_extraction',
  AI_PARSING: 'ai_parsing',
  DATA_VALIDATION: 'data_validation',
  EMBEDDING_GENERATION: 'embedding_generation',
  PROFILE_CREATION: 'profile_creation',
  MATCHING_PREPARATION: 'matching_preparation',
} as const;

export const CV_VALIDATION_TYPES = {
  FORMAT: 'format',
  CONTENT: 'content',
  SECURITY: 'security',
  QUALITY: 'quality',
} as const;

export const CV_PROCESSING_PRIORITIES = {
  HIGH: 1,
  NORMAL: 5,
  LOW: 10,
} as const;

// File size and format constants
export const CV_CONSTRAINTS = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FORMATS: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_FILENAME_LENGTH: 500,
  MIN_CONFIDENCE_THRESHOLD: 0.80,
  MAX_PROCESSING_TIME_SECONDS: 300, // 5 minutes
} as const;

export default {
  CVUploadSessionSchema,
  CVProcessingQueueSchema,
  CVValidationResultSchema,
  CVProcessingMetricSchema,
  CVEmbeddingContextSchema,
  CVAIExtractionSchema,
  CVUploadInitRequestSchema,
  CVUploadInitResponseSchema,
  CVProcessStatusResponseSchema,
  CVProcessingStageSchema,
  CVProcessingProgressSchema,
  CVJobMatchSchema,
  CVProcessingErrorSchema,
  CV_UPLOAD_STATUS,
  CV_PROCESSING_STAGES,
  CV_VALIDATION_TYPES,
  CV_PROCESSING_PRIORITIES,
  CV_CONSTRAINTS,
};