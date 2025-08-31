# PowerShell script to test GPT-4o-mini enrichment API
# Usage: powershell -File scripts/test-enrichment.ps1

param(
    [string]$ApiUrl = "http://localhost:3000",
    [string]$AdminSecret = $env:ADMIN_SECRET,
    [int]$BatchSize = 3,
    [switch]$Verbose
)

# Configuration
$ErrorActionPreference = "Stop"

Write-Host "=== GPT-4o-mini Enrichment API Test ===" -ForegroundColor Magenta

# Validation des paramètres
if (-not $AdminSecret) {
    Write-Host "Error: ADMIN_SECRET environment variable is required" -ForegroundColor Red
    exit 1
}

if ($Verbose) {
    Write-Host "Configuration:" -ForegroundColor Gray
    Write-Host "  API URL: $ApiUrl" -ForegroundColor Gray
    Write-Host "  Batch Size: $BatchSize" -ForegroundColor Gray
    Write-Host "  Admin Secret: [HIDDEN]" -ForegroundColor Gray
    Write-Host ""
}

# Headers
$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = $AdminSecret
}

# Test 1: Health check
Write-Host "1. Testing API health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/api/health" -Method GET -Headers @{"Content-Type"="application/json"}
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "   Database: $($healthResponse.database)" -ForegroundColor Green
} catch {
    Write-Host "   Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Get some offers for enrichment
Write-Host "`n2. Fetching offers for enrichment..." -ForegroundColor Yellow
try {
    $offersResponse = Invoke-RestMethod -Uri "$ApiUrl/api/search/offers?limit=$BatchSize" -Method GET -Headers @{"Content-Type"="application/json"}
    $offers = $offersResponse.data
    
    if (-not $offers -or $offers.Count -eq 0) {
        Write-Host "   No offers found for testing. Please ingest some offers first." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "   Found $($offers.Count) offers:" -ForegroundColor Green
    foreach ($offer in $offers) {
        Write-Host "   - $($offer.id): $($offer.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Failed to fetch offers: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Run enrichment
Write-Host "`n3. Running GPT-4o-mini enrichment..." -ForegroundColor Yellow

$enrichmentPayload = @{
    offer_ids = $offers | ForEach-Object { $_.id }
    force_reprocess = $true
    confidence_threshold = 0.80
} | ConvertTo-Json

if ($Verbose) {
    Write-Host "   Payload: $enrichmentPayload" -ForegroundColor Gray
}

try {
    $enrichmentResponse = Invoke-RestMethod -Uri "$ApiUrl/api/enrich/offers" -Method POST -Headers $headers -Body $enrichmentPayload
    
    Write-Host "   Enrichment completed!" -ForegroundColor Green
    Write-Host "   Total processed: $($enrichmentResponse.total_processed)" -ForegroundColor Cyan
    Write-Host "   Successful: $($enrichmentResponse.successful)" -ForegroundColor Green
    Write-Host "   Failed: $($enrichmentResponse.failed)" -ForegroundColor Red
    Write-Host "   Low confidence: $($enrichmentResponse.low_confidence)" -ForegroundColor Yellow
    
    # Cost tracking
    if ($enrichmentResponse.cost_tracking) {
        $cost = $enrichmentResponse.cost_tracking
        Write-Host "   Total tokens used: $($cost.total_tokens_used)" -ForegroundColor Cyan
        Write-Host "   Total cost: $([math]::Round($cost.total_cost_usd, 6)) USD" -ForegroundColor Cyan
        Write-Host "   Average cost per offer: $([math]::Round($cost.avg_cost_per_offer, 6)) USD" -ForegroundColor Cyan
    }
    
    # Performance metrics
    if ($enrichmentResponse.performance) {
        $perf = $enrichmentResponse.performance
        Write-Host "   Average processing time: $($perf.avg_processing_time_ms)ms" -ForegroundColor Cyan
        Write-Host "   Total processing time: $($perf.total_processing_time_ms)ms" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "   Enrichment failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
    }
    exit 1
}

# Test 4: Verify stored results
Write-Host "`n4. Verifying stored enrichment results..." -ForegroundColor Yellow

# Afficher les enrichissements réussis
if ($enrichmentResponse.enrichments -and $enrichmentResponse.enrichments.Count -gt 0) {
    Write-Host "   Successful enrichments:" -ForegroundColor Green
    
    foreach ($enrichment in $enrichmentResponse.enrichments) {
        Write-Host "   Offer ID: $($enrichment.offer_id)" -ForegroundColor Cyan
        
        # Skills required
        if ($enrichment.skills_required) {
            $skillsRequired = $enrichment.skills_required | ConvertFrom-Json -ErrorAction SilentlyContinue
        }
        
        # Confidence scores
        if ($enrichment.confidence_scores) {
            $conf = $enrichment.confidence_scores
            Write-Host "   Global Confidence: $([math]::Round($conf.global, 3))" -ForegroundColor Cyan
            Write-Host "   Skills: $([math]::Round($conf.skills, 3)) | Seniority: $([math]::Round($conf.seniority, 3)) | Languages: $([math]::Round($conf.languages, 3)) | Degrees: $([math]::Round($conf.degrees, 3))" -ForegroundColor Gray
        }
        
        if ($enrichment.seniority_level) {
            Write-Host "   Seniority: $($enrichment.seniority_level)" -ForegroundColor Green
        }
        
        if ($skillsRequired -and $skillsRequired.Count -gt 0) {
            $skillNames = $skillsRequired | ForEach-Object { $_.name }
            Write-Host "   Skills Required: $($skillNames -join ', ')" -ForegroundColor Green
        }
        
        Write-Host "" # Ligne vide
    }
}

# Erreurs
if ($enrichmentResponse.errors.Count -gt 0) {
    Write-Host "`nErrors:" -ForegroundColor Red
    foreach ($error in $enrichmentResponse.errors) {
        Write-Host "   Offer $($error.offer_id): $($error.error)" -ForegroundColor Red
        if ($error.retryable) {
            Write-Host "   (Retryable: $($error.retryable))" -ForegroundColor Yellow
        }
    }
}

Write-Host "`nTest completed successfully!" -ForegroundColor Green
Write-Host "Check Supabase Dashboard > offer_enrichment table for stored results" -ForegroundColor Yellow