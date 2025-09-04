// Test semantic search integration with FT offers
const http = require('http');

async function testFTSearch() {
    console.log('🔍 Testing France Travail search integration...\n');
    
    const tests = [
        {
            name: 'Basic text search - "cuisinier"',
            query: 'cuisinier',
            semantic_search: false
        },
        {
            name: 'Semantic search - "chef cuisine"',
            query: 'chef cuisine',
            semantic_search: true,
            similarity_threshold: 0.6
        },
        {
            name: 'Hybrid search - "technicien maintenance"',
            query: 'technicien maintenance',
            hybrid_search: true,
            semantic_boost: 1.2,
            text_boost: 0.8
        },
        {
            name: 'ROME code search - G1609 (cuisinier)',
            rome_codes: 'G1609',
            semantic_search: false
        },
        {
            name: 'Multi-source search - FT + LBA',
            query: 'aide soignant',
            semantic_search: true,
            similarity_threshold: 0.7
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`\n🧪 Test: ${test.name}`);
            console.log(`🔧 Parameters: ${JSON.stringify(test, null, 2)}`);
            
            // Build query parameters
            const params = new URLSearchParams();
            Object.keys(test).forEach(key => {
                if (key !== 'name' && test[key] !== undefined) {
                    params.append(key, test[key].toString());
                }
            });
            params.append('limit', '10'); // Limit results for testing
            
            const url = `http://localhost:3000/api/search/offers?${params.toString()}`;
            console.log(`🌐 URL: ${url}`);
            
            const result = await makeRequest(url);
            
            if (result.success) {
                const offers = result.data.offers;
                const ftOffers = offers.filter(offer => offer.source_primary === 'FT');
                const lbaOffers = offers.filter(offer => offer.source_primary === 'LBA');
                
                console.log(`✅ Results found: ${offers.length} total`);
                console.log(`🇫🇷 FT offers: ${ftOffers.length}`);
                console.log(`🔗 LBA offers: ${lbaOffers.length}`);
                
                // Show some FT offers details
                if (ftOffers.length > 0) {
                    console.log(`📋 Sample FT offers:`);
                    ftOffers.slice(0, 3).forEach((offer, i) => {
                        console.log(`   ${i+1}. "${offer.title.slice(0, 50)}..." (${offer.rome_codes?.join(', ') || 'No ROME'})`);
                        if (offer.similarity_score) {
                            console.log(`      Similarity: ${offer.similarity_score.toFixed(3)}`);
                        }
                    });
                }
                
                // Check if search is working correctly
                if (test.query && offers.length > 0) {
                    const hasRelevantResults = offers.some(offer => 
                        offer.title.toLowerCase().includes(test.query.toLowerCase()) ||
                        (offer.rome_codes && offer.rome_codes.some(rome => rome.includes('G16'))) // Food service codes
                    );
                    console.log(`🎯 Relevance check: ${hasRelevantResults ? 'PASS' : 'REVIEW'}`);
                }
                
            } else {
                console.log(`❌ Search failed: ${result.error}`);
            }
            
            // Add delay between tests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            console.error(`❌ Test "${test.name}" failed:`, error.message);
        }
    }
    
    // Final integration check
    console.log(`\n🏁 Running final integration check...`);
    try {
        const totalResult = await makeRequest('http://localhost:3000/api/search/offers?limit=100');
        if (totalResult.success) {
            const allOffers = totalResult.data.offers;
            const ftCount = allOffers.filter(o => o.source_primary === 'FT').length;
            const lbaCount = allOffers.filter(o => o.source_primary === 'LBA').length;
            
            console.log(`📊 Integration Summary:`);
            console.log(`   Total offers in search: ${allOffers.length}`);
            console.log(`   FT offers: ${ftCount}`);
            console.log(`   LBA offers: ${lbaCount}`);
            console.log(`   Multi-source integration: ${ftCount > 0 && lbaCount > 0 ? '✅ SUCCESS' : '⚠️ PARTIAL'}`);
            
            if (ftCount === 0) {
                console.log(`❌ WARNING: No FT offers found in search results!`);
                console.log(`   This could indicate:`);
                console.log(`   - Embeddings not properly indexed`);
                console.log(`   - Search query not including FT offers`);
                console.log(`   - Database connectivity issues`);
            }
        }
    } catch (error) {
        console.error(`❌ Integration check failed:`, error.message);
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const request = http.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error(`Failed to parse response: ${parseError.message}`));
                }
            });
        });
        
        request.on('error', (error) => {
            reject(error);
        });
        
        request.setTimeout(10000, () => {
            request.abort();
            reject(new Error('Request timeout'));
        });
    });
}

// Run the test
testFTSearch().then(() => {
    console.log('\n🎉 FT search integration testing completed!');
}).catch(error => {
    console.error('\n❌ Test suite failed:', error);
});