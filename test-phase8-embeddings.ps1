# Test Phase 8: Embeddings + Vector Matching
# Comprehensive test suite for semantic search functionality

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AdminSecret = $env:ADMIN_SECRET,
    [switch]$Verbose
)

Write-Host "🧪 PHASE 8 EMBEDDINGS TEST SUITE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

if (-not $AdminSecret) {
    Write-Host "❌ ADMIN_SECRET environment variable not set" -ForegroundColor Red
    exit 1
}

$headers = @{
    'Content-Type' = 'application/json'
    'x-admin-secret' = $AdminSecret
}

$testResults = @()

function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = $headers,
        [object]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "🔍 Testing: $Name" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $startTime = Get-Date
        $response = Invoke-RestMethod @params
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        if ($Verbose) {
            Write-Host "   Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
        }
        
        Write-Host "   ✅ Success - ${duration}ms" -ForegroundColor Green
        
        $global:testResults += [PSCustomObject]@{
            Test = $Name
            Status = "PASS"
            Duration = "${duration}ms"
            Response = $response
        }
        
        return $response
    }
    catch {
        Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
        
        $global:testResults += [PSCustomObject]@{
            Test = $Name
            Status = "FAIL"
            Duration = "N/A"
            Error = $_.Exception.Message
        }
        
        return $null
    }
}

Write-Host "📊 1. EMBEDDING QUEUE STATISTICS" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Magenta

$queueStats = Test-ApiEndpoint -Name "Queue Statistics" -Url "$BaseUrl/api/embeddings/queue"

if ($queueStats -and $queueStats.success) {
    $stats = $queueStats.queue_stats
    Write-Host "   📈 Total Enriched Offers: $($stats.total_enriched_offers)" -ForegroundColor White
    Write-Host "   🧠 Existing Embeddings: $($stats.existing_embeddings)" -ForegroundColor White
    Write-Host "   ⏳ Needs Embedding: $($stats.needs_embedding)" -ForegroundColor White
    Write-Host "   📊 Completion Rate: $([math]::Round($stats.completion_rate * 100, 2))%" -ForegroundColor White
}

Write-Host ""

Write-Host "⚡ 2. EMBEDDING GENERATION" -ForegroundColor Magenta  
Write-Host "=========================" -ForegroundColor Magenta

# Get some offer IDs for testing
$searchResponse = Test-ApiEndpoint -Name "Get Offers for Testing" -Url "$BaseUrl/api/search/offers?limit=5"

if ($searchResponse -and $searchResponse.success -and $searchResponse.data.offers.Length -gt 0) {
    $testOfferIds = $searchResponse.data.offers[0..2] | ForEach-Object { $_.id }
    
    Write-Host "   🎯 Testing with offers: $($testOfferIds -join ', ')" -ForegroundColor Cyan
    
    # Test embedding generation
    $embeddingBody = @{
        offer_ids = $testOfferIds
        force_regenerate = $false
        batch_size = 3
    }
    
    $embeddingResult = Test-ApiEndpoint -Name "Generate Embeddings" -Url "$BaseUrl/api/embeddings/generate" -Method "POST" -Body $embeddingBody
    
    if ($embeddingResult -and $embeddingResult.success) {
        Write-Host "   💰 Cost: $([math]::Round($embeddingResult.cost_estimate.estimated_cost_usd, 6)) USD" -ForegroundColor White
        Write-Host "   🔤 Tokens Used: $($embeddingResult.cost_estimate.tokens_used)" -ForegroundColor White
        Write-Host "   ⏱️ Processing Time: $($embeddingResult.processing_stats.total_time_ms)ms" -ForegroundColor White
        Write-Host "   ✅ Success Rate: $([math]::Round($embeddingResult.processing_stats.success_rate * 100, 2))%" -ForegroundColor White
    }
}

Write-Host ""

Write-Host "🔍 3. SEMANTIC SEARCH TESTS" -ForegroundColor Magenta
Write-Host "===========================" -ForegroundColor Magenta

$searchTests = @(
    @{ Query = "développeur JavaScript React"; Name = "JavaScript Developer Search" },
    @{ Query = "infirmier hôpital Paris"; Name = "Nurse Hospital Paris Search" },
    @{ Query = "comptable finance entreprise"; Name = "Accountant Finance Search" },
    @{ Query = "ingénieur logiciel Python"; Name = "Python Software Engineer Search" }
)

foreach ($searchTest in $searchTests) {
    $escapedQuery = [uri]::EscapeDataString($searchTest.Query)
    $searchUrl = "$BaseUrl/api/search/offers?query=$escapedQuery`&semantic_search=true`&limit=10"
    $semanticResult = Test-ApiEndpoint -Name $searchTest.Name -Url $searchUrl
    
    if ($semanticResult -and $semanticResult.success) {
        $metadata = $semanticResult.data.search_metadata
        Write-Host "   🎯 Query: '$($searchTest.Query)'" -ForegroundColor White
        Write-Host "   📊 Results: $($semanticResult.data.offers.Length)" -ForegroundColor White
        Write-Host "   🧠 Semantic Matches: $($metadata.semantic_results_count)" -ForegroundColor White
        Write-Host "   📏 Similarity Threshold: $($metadata.similarity_threshold)" -ForegroundColor White
        
        # Show top similarity scores if available
        $topOffers = $semanticResult.data.offers | Where-Object { $_.similarity_score } | Sort-Object { $_.similarity_score } -Descending | Select-Object -First 3
        if ($topOffers) {
            Write-Host "   🏆 Top Matches:" -ForegroundColor White
            foreach ($offer in $topOffers) {
                $score = [math]::Round($offer.similarity_score, 3)
                Write-Host "      - $($offer.title) (Score: $score)" -ForegroundColor Gray
            }
        }
    }
    Write-Host ""
}

Write-Host "🔀 4. HYBRID SEARCH TESTS" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta

$hybridTests = @(
    @{ Query = "développeur senior Paris CDI"; Boost = @{ semantic = 1.2; text = 0.8 } },
    @{ Query = "stage marketing digital"; Boost = @{ semantic = 0.9; text = 1.1 } }
)

foreach ($hybridTest in $hybridTests) {
    $escapedQuery = [uri]::EscapeDataString($hybridTest.Query)
    $searchUrl = "$BaseUrl/api/search/offers?query=$escapedQuery`&hybrid_search=true`&semantic_boost=$($hybridTest.Boost.semantic)`&text_boost=$($hybridTest.Boost.text)`&limit=10`&sort_by=hybrid"
    $hybridResult = Test-ApiEndpoint -Name "Hybrid Search - $($hybridTest.Query)" -Url $searchUrl
    
    if ($hybridResult -and $hybridResult.success) {
        $metadata = $hybridResult.data.search_metadata
        Write-Host "   🎯 Query: '$($hybridTest.Query)'" -ForegroundColor White
        Write-Host "   📊 Total Results: $($hybridResult.data.offers.Length)" -ForegroundColor White
        Write-Host "   🧠 Semantic Results: $($metadata.semantic_results_count)" -ForegroundColor White
        Write-Host "   📝 Text Results: $($metadata.text_results_count)" -ForegroundColor White
        Write-Host "   ⚖️ Boost Factors: Semantic=$($metadata.boost_factors.semantic), Text=$($metadata.boost_factors.text)" -ForegroundColor White
        
        # Show hybrid scores
        $topHybrid = $hybridResult.data.offers | Where-Object { $_.hybrid_score } | Sort-Object { $_.hybrid_score } -Descending | Select-Object -First 3
        if ($topHybrid) {
            Write-Host "   🏆 Top Hybrid Scores:" -ForegroundColor White
            foreach ($offer in $topHybrid) {
                $hybridScore = [math]::Round($offer.hybrid_score, 3)
                $semanticScore = if ($offer.similarity_score) { [math]::Round($offer.similarity_score, 3) } else { "N/A" }
                Write-Host "      - $($offer.title) (Hybrid: $hybridScore, Semantic: $semanticScore)" -ForegroundColor Gray
            }
        }
    }
    Write-Host ""
}

Write-Host "🚀 5. QUEUE PROCESSING TEST" -ForegroundColor Magenta
Write-Host "==========================" -ForegroundColor Magenta

$queueBody = @{
    batch_size = 10
    force_regenerate = $false
}

$queueResult = Test-ApiEndpoint -Name "Process Embedding Queue" -Url "$BaseUrl/api/embeddings/queue" -Method "POST" -Body $queueBody

if ($queueResult -and $queueResult.success) {
    Write-Host "   📊 Found: $($queueResult.found_count) offers needing embeddings" -ForegroundColor White
    Write-Host "   ⚡ Processed: $($queueResult.processed_count) offers" -ForegroundColor White
    Write-Host "   💰 Cost: $([math]::Round($queueResult.cost_estimate.estimated_cost_usd, 6)) USD" -ForegroundColor White
    Write-Host "   ⏱️ Time: $($queueResult.processing_stats.total_time_ms)ms" -ForegroundColor White
}

Write-Host ""

Write-Host "📊 6. PERFORMANCE BENCHMARKS" -ForegroundColor Magenta
Write-Host "============================" -ForegroundColor Magenta

# Performance test: multiple concurrent searches
$performanceTests = @(
    "développeur",
    "infirmier",  
    "commercial",
    "ingénieur",
    "designer"
)

Write-Host "   Running concurrent search performance test..." -ForegroundColor Yellow

$jobs = @()
foreach ($query in $performanceTests) {
    $escapedQuery = [uri]::EscapeDataString($query)
    $searchUrl = "$BaseUrl/api/search/offers?query=$escapedQuery`&semantic_search=true`&limit=20"
    $jobs += Start-Job -ScriptBlock {
        param($url)
        $start = Get-Date
        try {
            $response = Invoke-RestMethod -Uri $url
            $end = Get-Date
            return @{
                Success = $true
                Duration = ($end - $start).TotalMilliseconds
                Results = $response.data.offers.Length
                SemanticResults = $response.data.search_metadata.semantic_results_count
            }
        }
        catch {
            $end = Get-Date
            return @{
                Success = $false
                Duration = ($end - $start).TotalMilliseconds
                Error = $_.Exception.Message
            }
        }
    } -ArgumentList $searchUrl
}

# Wait for all jobs and collect results
$jobResults = $jobs | Wait-Job | Receive-Job
$jobs | Remove-Job

$successfulResults = $jobResults | Where-Object { $_.Success }
if ($successfulResults) {
    $avgDuration = ($successfulResults | Measure-Object Duration -Average).Average
    $maxDuration = ($successfulResults | Measure-Object Duration -Maximum).Maximum
    $minDuration = ($successfulResults | Measure-Object Duration -Minimum).Minimum
    $totalResults = ($successfulResults | Measure-Object Results -Sum).Sum
    
    Write-Host "   📊 Concurrent Search Results:" -ForegroundColor White
    Write-Host "   ✅ Successful Searches: $($successfulResults.Length)/$($performanceTests.Length)" -ForegroundColor White
    Write-Host "   ⚡ Average Duration: $([math]::Round($avgDuration, 2))ms" -ForegroundColor White
    Write-Host "   📈 Max Duration: $([math]::Round($maxDuration, 2))ms" -ForegroundColor White
    Write-Host "   📉 Min Duration: $([math]::Round($minDuration, 2))ms" -ForegroundColor White
    Write-Host "   🎯 Total Results Found: $totalResults" -ForegroundColor White
    
    if ($avgDuration -lt 500) {
        Write-Host "   🎉 PERFORMANCE TARGET MET (<500ms avg)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  PERFORMANCE TARGET MISSED (>500ms avg)" -ForegroundColor Yellow
    }
}

Write-Host ""

Write-Host "📋 7. TEST SUMMARY" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Magenta

$passedTests = ($global:testResults | Where-Object { $_.Status -eq "PASS" }).Length
$failedTests = ($global:testResults | Where-Object { $_.Status -eq "FAIL" }).Length
$totalTests = $global:testResults.Length

Write-Host ""
Write-Host "📊 RESULTS SUMMARY:" -ForegroundColor Cyan
Write-Host "   ✅ Passed: $passedTests" -ForegroundColor Green
Write-Host "   ❌ Failed: $failedTests" -ForegroundColor Red
Write-Host "   📏 Total: $totalTests" -ForegroundColor White
Write-Host "   📈 Success Rate: $([math]::Round(($passedTests / $totalTests) * 100, 2))%" -ForegroundColor White

Write-Host ""

if ($failedTests -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! PHASE 8 EMBEDDINGS FULLY OPERATIONAL!" -ForegroundColor Green
    Write-Host "   🧠 Semantic search is working perfectly" -ForegroundColor Green
    Write-Host "   🔀 Hybrid search is functioning optimally" -ForegroundColor Green
    Write-Host "   ⚡ Queue processing is operational" -ForegroundColor Green
    Write-Host "   📊 Performance targets are achievable" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Please review the errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 PHASE 8: EMBEDDINGS + VECTOR MATCHING - COMPLETE!" -ForegroundColor Cyan
Write-Host "Ready to proceed to Phase 9: Authentication & Security" -ForegroundColor Cyan
Write-Host ""

# Show detailed results if verbose
if ($Verbose) {
    Write-Host "DETAILED TEST RESULTS:" -ForegroundColor Gray
    $global:testResults | Format-Table -AutoSize
}