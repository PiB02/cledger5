# Anonymous Session Foundation System - Integration Guide

## Overview

The Anonymous Session Foundation System enables anonymous users to upload CVs and receive partial results before registration. This creates a "try before you buy" experience that increases conversion rates while maintaining security and preventing abuse.

## Architecture

### Database Tables
- `anonymous_sessions` - Core session tracking with security features
- `anonymous_cv_sessions` - CV processing sessions linked to anonymous users  
- `anonymous_session_rate_limits` - Rate limiting and abuse prevention

### Key Components
- **Session Management**: Secure cookie-based tracking (60-minute expiration)
- **Rate Limiting**: 3 uploads per session, 100 API calls per hour
- **Security**: IP/User-Agent validation, abuse detection, automatic cleanup
- **Partial Results**: Limited CV preview to encourage registration

## API Endpoints

### 1. Create Anonymous Session
**POST** `/api/anonymous/session/create`

Creates a new anonymous session and sets secure HTTP-only cookie.

```typescript
// Request (optional)
{
  browser_fingerprint?: string
}

// Response
{
  success: true,
  session_token: string,
  session_id: string,
  expires_at: string,
  remaining_uploads: number,
  message: string
}
```

### 2. Validate Session
**GET** `/api/anonymous/session/validate`

Validates current session and returns rate limiting info.

```typescript
// Response
{
  success: true,
  session: {
    session_id: string,
    is_valid: boolean,
    expires_at: string,
    remaining_uploads: number,
    rate_limited: boolean
  },
  rate_limits: {
    api_calls: { current: number, limit: number, remaining: number },
    uploads: { current: number, limit: number, remaining: number },
    blocked: boolean,
    retry_after: number | null
  }
}
```

### 3. Initialize CV Upload (Anonymous)
**POST** `/api/anonymous/cv/upload/init`

Initialize CV upload for anonymous users.

```typescript
// Request
{
  filename: string,
  file_size: number,        // max 10MB
  content_type: string,     // 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  file_hash: string         // SHA-256 hash
}

// Response
{
  success: true,
  session_id: string,
  cv_session_id: string,
  upload_url: string,       // Signed URL for direct upload
  expires_at: string,
  upload_limits: {
    remaining_uploads: number,
    max_file_size_mb: number,
    allowed_types: string[]
  },
  preview_info: {
    full_results_after_registration: boolean,
    partial_results_available: boolean,
    max_skills_shown: number
  }
}
```

### 4. Check CV Processing Status
**GET** `/api/anonymous/cv/status/{cvSessionId}`

Get processing status and partial results.

```typescript
// Response
{
  success: true,
  data: {
    cv_session_id: string,
    upload_status: 'initiated' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed',
    processing_status: 'pending' | 'processing' | 'completed' | 'failed' | null,
    progress_percentage: number,
    current_stage: string,
    estimated_time_remaining: number | null,
    partial_results: {
      job_title?: string,
      experience_level?: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager',
      key_skills: string[],      // Limited to 5 for anonymous
      location_preference?: string,
      education_level?: string
    } | null,
    full_results_available: boolean,
    registration_required: boolean,
    error_message: string | null,
    anonymous_limits: {
      max_skills_shown: number,
      upgrade_message?: string
    }
  }
}
```

### 5. Session Cleanup (Admin)
**POST** `/api/anonymous/cleanup`

Automated cleanup job (requires admin authorization).

## Frontend Integration

### 1. Session Initialization

```typescript
// Create anonymous session when user first visits CV upload page
async function initializeAnonymousSession() {
  try {
    const response = await fetch('/api/anonymous/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important: include cookies
      body: JSON.stringify({
        browser_fingerprint: generateBrowserFingerprint() // optional
      })
    });
    
    const data = await response.json();
    if (data.success) {
      console.log('Anonymous session created:', data.session_id);
      return data;
    }
  } catch (error) {
    console.error('Failed to create anonymous session:', error);
  }
}
```

### 2. Session Validation

```typescript
// Validate session before showing upload form
async function validateSession() {
  try {
    const response = await fetch('/api/anonymous/session/validate', {
      credentials: 'include'
    });
    
    const data = await response.json();
    if (data.success) {
      return {
        isValid: data.session.is_valid,
        remainingUploads: data.session.remaining_uploads,
        rateLimited: data.rate_limits.blocked
      };
    }
  } catch (error) {
    console.error('Session validation failed:', error);
  }
}
```

### 3. CV Upload Flow

```typescript
async function uploadCV(file: File) {
  // 1. Calculate file hash
  const fileHash = await calculateSHA256(file);
  
  // 2. Initialize upload
  const initResponse = await fetch('/api/anonymous/cv/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      filename: file.name,
      file_size: file.size,
      content_type: file.type,
      file_hash: fileHash
    })
  });
  
  const initData = await initResponse.json();
  if (!initData.success) throw new Error(initData.message);
  
  // 3. Upload file to signed URL
  await fetch(initData.upload_url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  // 4. Poll for processing status
  return pollProcessingStatus(initData.cv_session_id);
}

async function pollProcessingStatus(cvSessionId: string) {
  const poll = async (): Promise<any> => {
    const response = await fetch(`/api/anonymous/cv/status/${cvSessionId}`, {
      credentials: 'include'
    });
    
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    
    const status = data.data;
    
    // Update UI with progress
    updateProgressUI(status.progress_percentage, status.current_stage);
    
    // Show partial results when completed
    if (status.upload_status === 'completed' && status.partial_results) {
      showPartialResults(status.partial_results, status.anonymous_limits);
      return status;
    }
    
    // Continue polling if still processing
    if (status.upload_status === 'processing' || status.upload_status === 'uploaded') {
      setTimeout(poll, 2000); // Poll every 2 seconds
    }
    
    return status;
  };
  
  return poll();
}
```

### 4. Partial Results Display

```typescript
function showPartialResults(results: PartialResults, limits: AnonymousLimits) {
  const resultsHtml = `
    <div class="partial-results">
      <h3>CV Analysis Preview</h3>
      
      ${results.job_title ? `<p><strong>Job Title:</strong> ${results.job_title}</p>` : ''}
      ${results.experience_level ? `<p><strong>Experience:</strong> ${results.experience_level}</p>` : ''}
      ${results.location_preference ? `<p><strong>Location:</strong> ${results.location_preference}</p>` : ''}
      
      ${results.key_skills.length > 0 ? `
        <div class="skills">
          <strong>Key Skills (showing ${results.key_skills.length} of many):</strong>
          <ul>
            ${results.key_skills.map(skill => `<li>${skill}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div class="upgrade-cta">
        <h4>Want to see your complete CV analysis?</h4>
        <p>${limits.upgrade_message}</p>
        <button onclick="redirectToRegistration()">Sign Up for Full Results</button>
      </div>
    </div>
  `;
  
  document.getElementById('results-container').innerHTML = resultsHtml;
}
```

### 5. Error Handling

```typescript
const ERROR_HANDLERS = {
  SESSION_EXPIRED: () => {
    // Redirect to create new session
    window.location.reload();
  },
  
  SESSION_NOT_FOUND: () => {
    // Create new session
    initializeAnonymousSession();
  },
  
  UPLOAD_LIMIT_EXCEEDED: (details: any) => {
    showMessage(`Upload limit exceeded. Try again in ${Math.ceil(details.retry_after / 60)} minutes.`);
  },
  
  SESSION_RATE_LIMITED: () => {
    showMessage('Too many requests. Please wait before trying again.');
  },
  
  FILE_TOO_LARGE: () => {
    showMessage('File is too large. Maximum size is 10MB.');
  },
  
  INVALID_FILE_TYPE: () => {
    showMessage('Only PDF and Word documents are supported.');
  }
};

async function handleApiCall(apiCall: () => Promise<Response>) {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!data.success && data.error && ERROR_HANDLERS[data.error]) {
      ERROR_HANDLERS[data.error](data.details);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    showMessage('Something went wrong. Please try again.');
    return null;
  }
}
```

### 6. Utility Functions

```typescript
// Generate browser fingerprint for additional security
function generateBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  return btoa(fingerprint).substring(0, 32);
}

// Calculate SHA-256 hash of file
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

## Security Considerations

1. **Session Cookies**: Always use `credentials: 'include'` in fetch requests
2. **File Validation**: Client-side validation should match server-side rules
3. **Rate Limiting**: Handle 429 responses gracefully with retry-after headers
4. **Error Messages**: Don't expose sensitive information in error messages
5. **HTTPS**: Ensure all requests are made over HTTPS in production

## Testing

Use the test page at `/test-anonymous-sessions.html` to validate the complete flow:

1. Open `http://localhost:3000/test-anonymous-sessions.html`
2. Run tests in order: Create Session → Validate → CV Upload → Status → Rate Limiting
3. Check browser DevTools Network tab for proper cookie handling
4. Verify partial results show limited information with registration CTA

## Configuration

Environment variables for anonymous session system:

```env
# Optional overrides (defaults shown)
ANONYMOUS_MAX_UPLOADS_PER_SESSION=3
ANONYMOUS_MAX_API_CALLS_PER_HOUR=100
ANONYMOUS_UPLOAD_WINDOW_MINUTES=60
ANONYMOUS_BLOCK_DURATION_MINUTES=30
ANONYMOUS_CLEANUP_INTERVAL_MINUTES=15

# Required for cleanup job
CRON_SECRET=your-cron-secret
```

## Monitoring

The system provides comprehensive logging and metrics:

- Session creation/expiration rates
- Upload attempt patterns
- Rate limiting effectiveness
- Abuse detection alerts
- Conversion tracking (anonymous → registered)

Monitor these endpoints:
- `GET /api/anonymous/cleanup` (stats without cleanup)
- Database tables for session analytics
- Application logs for security events

## Next Steps

After Phase 1 implementation:

1. **Phase 2**: Partial results UI with registration incentives
2. **Phase 3**: A/B testing for conversion optimization
3. **Phase 4**: Advanced fraud detection and security hardening
4. **Phase 5**: Analytics and conversion funnel analysis

## Support

For technical issues or questions about the anonymous session system:

1. Check the test page for basic functionality
2. Review browser DevTools for API errors
3. Check database logs for session-related issues
4. Monitor rate limiting and abuse detection alerts