# CV Management System - Technical Specifications
*Phase 10.T-100 - CV Management Implementation Specs - Created: 01/09/2025*

## 🎯 **System Overview**

The CV Management System enables candidates to upload, parse, store, and manage their CVs with AI-powered extraction and semantic matching integration.

### **Core Requirements**
- **File Upload**: PDF, DOC, DOCX support with size/security validation
- **AI Parsing**: Extract structured data using GPT-4o-mini
- **Embedding Generation**: Convert CV to standardized embedding format
- **Version Management**: Track CV updates and parsing iterations
- **Security**: PII encryption and GDPR compliance

## 🏗️ **Database Schema**

### **cv_documents Table**
```sql
CREATE TABLE cv_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- File Information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    content_hash VARCHAR(64) NOT NULL, -- SHA-256 for deduplication
    storage_path TEXT NOT NULL,
    
    -- Parsing Status
    parsing_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review')),
    parsed_at TIMESTAMP WITH TIME ZONE,
    parsing_error TEXT,
    parsing_confidence DECIMAL(3,3), -- 0.000 to 1.000
    
    -- Extracted Data (Encrypted JSON)
    extracted_data JSONB, -- Encrypted with APP_PII_KEY
    
    -- Metadata
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_user_primary_cv EXCLUDE (user_id WITH =) WHERE (is_primary = true AND is_active = true),
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- 10MB max
);

-- Indexes
CREATE INDEX cv_documents_user_id_active_idx ON cv_documents(user_id, is_active);
CREATE INDEX cv_documents_content_hash_idx ON cv_documents(content_hash);
CREATE INDEX cv_documents_parsing_status_idx ON cv_documents(parsing_status) WHERE parsing_status IN ('pending', 'processing');
```

### **cv_embeddings Table**
```sql
CREATE TABLE cv_embeddings (
    cv_id UUID PRIMARY KEY REFERENCES cv_documents(id) ON DELETE CASCADE,
    
    -- Embedding Data
    embedding_vector vector(1536), -- OpenAI text-embedding-3-small
    embedding_text TEXT NOT NULL, -- Standardized format for matching
    
    -- Generation Info
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    model_version VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    text_version_hash VARCHAR(64) NOT NULL, -- Track when re-embedding needed
    
    -- Metadata
    token_count INTEGER,
    generation_cost_usd DECIMAL(10,6),
    
    -- Performance Index (HNSW)
    CONSTRAINT valid_embedding_dimension CHECK (array_length(embedding_vector, 1) = 1536)
);

-- Vector similarity index
CREATE INDEX cv_embeddings_vector_cosine_idx ON cv_embeddings 
USING hnsw (embedding_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### **cv_parsing_log Table**
```sql
CREATE TABLE cv_parsing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id UUID NOT NULL REFERENCES cv_documents(id) ON DELETE CASCADE,
    
    -- Parsing Attempt
    attempt_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- AI Processing
    model_used VARCHAR(50) NOT NULL,
    prompt_version VARCHAR(20) NOT NULL,
    tokens_used INTEGER,
    cost_usd DECIMAL(8,6),
    
    -- Results
    status VARCHAR(20) NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    confidence_score DECIMAL(3,3),
    extracted_fields JSONB, -- Field-level confidence scores
    error_message TEXT,
    
    -- Constraints
    UNIQUE (cv_id, attempt_number)
);

CREATE INDEX cv_parsing_log_cv_status_idx ON cv_parsing_log(cv_id, status);
```

## 🔒 **Security Implementation**

### **File Upload Security**
```typescript
// File validation schema
const CVUploadSchema = z.object({
  file: z.custom<File>((file) => {
    if (!file || !(file instanceof File)) return false;
    
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }, "Invalid file type or size"),
  
  replaceExisting: z.boolean().optional().default(false)
});
```

### **PII Encryption**
```typescript
// Encryption utilities for CV data
import { encrypt, decrypt } from '@/lib/encryption';

interface CVExtractedData {
  personalInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
  }>;
}

// Encryption before database storage
const encryptedData = await encrypt(JSON.stringify(extractedData), process.env.APP_PII_KEY);
```

## 🤖 **AI Parsing Implementation**

### **GPT-4o-mini Integration**
```typescript
// CV parsing prompt template
const CV_PARSING_PROMPT = `
You are an expert CV/resume parser. Extract structured information from the provided CV text with high accuracy and confidence scoring.

IMPORTANT RULES:
1. Only extract information that is explicitly stated in the CV
2. Provide confidence scores (0.0-1.0) for each extracted field
3. Use standardized formats for dates (YYYY-MM) and skills (lowercase, normalized)
4. Mark uncertain information with lower confidence scores

Extract the following information:
- Personal Information (name, contact details)
- Work Experience (company, role, dates, responsibilities)
- Education (institution, degree, field, graduation date)
- Skills (technical and soft skills)
- Languages (language and proficiency level)
- Certifications (name, issuer, dates)

Respond in JSON format with confidence scores for each field.
CV Text:
{cv_text}
`;

export async function parseCVWithAI(cvText: string): Promise<CVParsingResult> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: CV_PARSING_PROMPT.replace('{cv_text}', cvText)
      }
    ],
    temperature: 0.1, // Low temperature for consistent extraction
    max_tokens: 2000,
  });

  const parsed = JSON.parse(response.choices[0].message.content);
  
  return {
    extractedData: parsed.data,
    confidenceScores: parsed.confidence,
    overallConfidence: calculateOverallConfidence(parsed.confidence),
    tokensUsed: response.usage?.total_tokens || 0,
    cost: calculateCost(response.usage?.total_tokens || 0, 'gpt-4o-mini')
  };
}
```

### **Embedding Text Generation**
```typescript
import { buildEmbeddingText } from '@cledger5/utils';

// Generate standardized embedding text for CV matching
export function generateCVEmbeddingText(extractedData: CVExtractedData): string {
  return buildEmbeddingText({
    type: 'CV',
    title: extractedData.personalInfo.firstName + ' ' + extractedData.personalInfo.lastName,
    location: normalizeLocation(extractedData.personalInfo.address),
    skills: extractedData.skills.map(normalizeSkill),
    experience: extractedData.experience,
    education: extractedData.education,
    languages: extractedData.languages,
    availability: 'ASAP' // Default for candidates
  });
}
```

## 🛠️ **API Endpoints**

### **POST /api/cv/upload**
```typescript
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    // Validate user authentication
    const user = await getCurrentUser();
    if (!user) {
      throw errorFactory.UNAUTHORIZED('Authentication required');
    }
    
    // Validate file
    const validatedFile = CVUploadSchema.parse({ file });
    
    // Check for duplicate content
    const contentHash = await calculateFileHash(file);
    const existingCV = await findCVByHash(user.id, contentHash);
    
    if (existingCV) {
      return NextResponse.json({
        success: false,
        error: 'CV_ALREADY_EXISTS',
        message: 'A CV with identical content already exists'
      }, { status: 409 });
    }
    
    // Store file securely
    const storagePath = await storeCV(file, user.id, contentHash);
    
    // Create database record
    const cvDocument = await createCVDocument({
      userId: user.id,
      filename: generateSecureFilename(),
      originalFilename: file.name,
      contentType: file.type,
      fileSize: file.size,
      contentHash,
      storagePath,
      parsingStatus: 'pending'
    });
    
    // Queue parsing job
    await queueCVParsing(cvDocument.id);
    
    return NextResponse.json({
      success: true,
      data: {
        cvId: cvDocument.id,
        status: 'uploaded',
        parsingStatus: 'pending'
      }
    });
    
  } catch (error) {
    console.error('CV upload error:', error);
    throw errorFactory.INTERNAL('Failed to upload CV');
  }
}
```

### **GET /api/cv/list**
```typescript
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    throw errorFactory.UNAUTHORIZED('Authentication required');
  }
  
  const cvDocuments = await supabase
    .from('cv_documents')
    .select(`
      id,
      filename,
      original_filename,
      content_type,
      file_size,
      parsing_status,
      parsed_at,
      parsing_confidence,
      is_primary,
      created_at,
      updated_at
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
    
  return NextResponse.json({
    success: true,
    data: cvDocuments.data || []
  });
}
```

### **POST /api/cv/[id]/reparse**
```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    throw errorFactory.UNAUTHORIZED('Authentication required');
  }
  
  const cvId = params.id;
  
  // Verify CV ownership
  const cvDocument = await verifyCVOwnership(cvId, user.id);
  
  // Update status and queue reparsing
  await updateCVParsingStatus(cvId, 'pending');
  await queueCVParsing(cvId, { force: true });
  
  return NextResponse.json({
    success: true,
    message: 'CV reparsing queued successfully'
  });
}
```

## 🎨 **UI Components**

### **CVUpload Component**
```tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';

interface CVUploadProps {
  onUploadSuccess?: (cvId: string) => void;
  onUploadError?: (error: string) => void;
}

export function CVUpload({ onUploadSuccess, onUploadError }: CVUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setStatus('uploading');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/cv/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }

      setStatus('success');
      setProgress(100);
      onUploadSuccess?.(result.data.cvId);

    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [onUploadSuccess, onUploadError, errorMessage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload CV
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {status === 'idle' && (
            <>
              <File className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-2">
                {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here, or click to browse'}
              </p>
              <p className="text-xs text-gray-400">
                Supports PDF, DOC, DOCX up to 10MB
              </p>
            </>
          )}
          
          {status === 'uploading' && (
            <>
              <div className="mb-4">
                <Progress value={progress} className="w-full" />
              </div>
              <p className="text-sm text-gray-600">Uploading and processing...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-sm text-green-600">CV uploaded successfully!</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-sm text-red-600 mb-2">Upload failed</p>
              <p className="text-xs text-red-400">{errorMessage}</p>
              <Button 
                onClick={() => setStatus('idle')} 
                variant="outline" 
                size="sm"
                className="mt-2"
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## 📊 **Monitoring & Analytics**

### **CV Processing Metrics**
```typescript
// Dashboard metrics for CV processing
export async function getCVProcessingStats(): Promise<CVProcessingStats> {
  const stats = await supabase
    .from('cv_documents')
    .select('parsing_status, parsing_confidence, created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
  return {
    totalCVs: stats.data?.length || 0,
    byStatus: groupBy(stats.data, 'parsing_status'),
    avgConfidence: calculateAverageConfidence(stats.data),
    dailyVolume: groupByDay(stats.data),
    processingSuccessRate: calculateSuccessRate(stats.data)
  };
}
```

## 🧪 **Testing Strategy**

### **Unit Tests**
- File validation logic
- PII encryption/decryption
- AI parsing result validation
- Embedding text generation
- Database operations

### **Integration Tests**
- Complete upload flow
- CV parsing pipeline
- Error handling scenarios
- Security validation
- Performance benchmarks

### **E2E Tests**
- User upload workflow
- CV management interface
- Parsing status updates
- File download/deletion

---

*This specification provides complete implementation guidance for the CV Management System component of Phase 10. All agents working on CV-related functionality should reference and contribute to this document.*