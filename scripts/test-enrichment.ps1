# Script de test pour l'API d'enrichissement GPT-4o-mini
# Usage: .\scripts\test-enrichment.ps1

param(
    [string]$BaseUrl = "http://localhost:3003",
    [string]$AdminSecret = $env:ADMIN_SECRET,
    [int]$MaxOffers = 3
)

Write-Host "🚀 Testing cledger5 AI Enrichment API" -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan

# Vérifier que ADMIN_SECRET est disponible  
if (-not $AdminSecret) {
    Write-Host "❌ ADMIN_SECRET environment variable not set" -ForegroundColor Red
    Write-Host "Please set: `$env:ADMIN_SECRET = 'your-admin-secret'" -ForegroundColor Yellow
    exit 1
}

# Étape 1: Health check
Write-Host "`n🔍 Step 1: Health Check" -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method GET
    if ($healthResponse.status -eq "healthy") {
        Write-Host "✅ API is healthy" -ForegroundColor Green
        Write-Host "   Supabase: $($healthResponse.supabase.connected)" -ForegroundColor Gray
    } else {
        throw "API not healthy"
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 2: Récupérer des offres à enrichir
Write-Host "`n📋 Step 2: Fetching offers to enrich" -ForegroundColor Blue
try {
    $offersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/search/offers?limit=$MaxOffers" -Method GET
    $offers = $offersResponse.data.offers
    
    if ($offers.Count -eq 0) {
        Write-Host "❌ No offers found in database" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Found $($offers.Count) offers to test:" -ForegroundColor Green
    foreach ($offer in $offers) {
        Write-Host "   - $($offer.id): $($offer.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Failed to fetch offers: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Étape 3: Préparer la requête d'enrichissement
$offerIds = $offers | ForEach-Object { $_.id }
$enrichmentRequest = @{
    offer_ids = $offerIds
    confidence_threshold = 0.80
    force_reprocess = $true
    include_low_confidence = $true
} | ConvertTo-Json

Write-Host "`n🤖 Step 3: Testing AI Enrichment" -ForegroundColor Blue
Write-Host "Request payload:" -ForegroundColor Gray
Write-Host $enrichmentRequest -ForegroundColor DarkGray

# Étape 4: Appeler l'API d'enrichissement
try {
    $headers = @{
        "Content-Type" = "application/json"
        "x-admin-secret" = $AdminSecret
    }
    
    Write-Host "`n⏳ Calling GPT-4o-mini enrichment API..." -ForegroundColor Yellow
    $startTime = Get-Date
    
    $enrichmentResponse = Invoke-RestMethod -Uri "$BaseUrl/api/enrich/offers" -Method POST -Body $enrichmentRequest -Headers $headers
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "✅ Enrichment completed in $([math]::Round($duration))ms" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Enrichment failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "   💡 Check your ADMIN_SECRET value" -ForegroundColor Yellow
        }
    }
    exit 1
}

# Étape 5: Analyser les résultats
Write-Host "`n📊 Step 4: Analyzing Results" -ForegroundColor Blue

Write-Host "Success: $($enrichmentResponse.success)" -ForegroundColor $(if ($enrichmentResponse.success) { "Green" } else { "Red" })
Write-Host "Processed Count: $($enrichmentResponse.processed_count)" -ForegroundColor Cyan
Write-Host "Errors Count: $($enrichmentResponse.errors.Count)" -ForegroundColor $(if ($enrichmentResponse.errors.Count -eq 0) { "Green" } else { "Red" })

# Coûts et performance
if ($enrichmentResponse.cost_estimate) {
    $cost = $enrichmentResponse.cost_estimate
    Write-Host "`n💰 Cost Estimate:" -ForegroundColor Magenta
    Write-Host "   Tokens Used: $($cost.tokens_used)" -ForegroundColor Gray
    Write-Host "   Estimated Cost: $([math]::Round($cost.estimated_cost_usd, 4)) USD" -ForegroundColor Gray
}

if ($enrichmentResponse.processing_stats) {
    $stats = $enrichmentResponse.processing_stats
    Write-Host "`n⚡ Performance Stats:" -ForegroundColor Magenta
    Write-Host "   Total Time: $($stats.total_time_ms)ms" -ForegroundColor Gray
    Write-Host "   Avg Confidence: $([math]::Round($stats.avg_confidence, 3))" -ForegroundColor Gray
    Write-Host "   Success Rate: $([math]::Round($stats.success_rate * 100, 1))%" -ForegroundColor Gray
}

# Détails des enrichissements
Write-Host "`n🎯 Enrichment Details:" -ForegroundColor Blue
foreach ($enrichment in $enrichmentResponse.enrichments) {
    Write-Host "   Offer: $($enrichment.offer_id)" -ForegroundColor White
    Write-Host "   Status: $($enrichment.enrichment_status)" -ForegroundColor $(if ($enrichment.enrichment_status -eq "completed") { "Green" } else { "Yellow" })
    
    if ($enrichment.confidence_scores) {
        $conf = $enrichment.confidence_scores
        Write-Host "   Global Confidence: $([math]::Round($conf.global, 3))" -ForegroundColor Cyan
        Write-Host "   Skills: $([math]::Round($conf.skills, 3)) | Seniority: $([math]::Round($conf.seniority, 3)) | Languages: $([math]::Round($conf.languages, 3)) | Degrees: $([math]::Round($conf.degrees, 3))" -ForegroundColor Gray
    }
    
    if ($enrichment.seniority_level) {
        Write-Host "   Seniority: $($enrichment.seniority_level)" -ForegroundColor Green
    }
    
    $skillsRequired = $enrichment.skills_required
    if ($skillsRequired -and $skillsRequired.Count -gt 0) {
        $skillNames = $skillsRequired | ForEach-Object { $_.name }
        Write-Host "   Skills Required: $($skillNames -join ', ')" -ForegroundColor Green
    }
    
    Write-Host "" # Ligne vide
}

# Erreurs
if ($enrichmentResponse.errors.Count -gt 0) {
    Write-Host "`n❌ Errors:" -ForegroundColor Red
    foreach ($error in $enrichmentResponse.errors) {
        Write-Host "   Offer $($error.offer_id): $($error.error)" -ForegroundColor Red
        if ($error.retryable) {
            Write-Host "   (Retryable: $($error.retryable))" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ Test completed successfully!" -ForegroundColor Green
Write-Host "💡 Check Supabase Dashboard > offer_enrichment table for stored results" -ForegroundColor Yellow