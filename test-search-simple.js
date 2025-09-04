// Simple test to check if search API is responsive
const http = require('http');

async function simpleSearchTest() {
    console.log('🔍 Testing basic search API response...');
    
    try {
        // Test basic endpoint without complex queries
        const url = 'http://localhost:3000/api/search/offers?limit=5';
        console.log(`🌐 Testing: ${url}`);
        
        const result = await makeRequest(url, 15000); // 15 second timeout
        
        if (result.success) {
            const offers = result.data.offers;
            console.log(`✅ API responding: ${offers.length} offers found`);
            
            // Check source distribution
            const ftOffers = offers.filter(o => o.source_primary === 'FT');
            const lbaOffers = offers.filter(o => o.source_primary === 'LBA');
            
            console.log(`📊 Source breakdown:`);
            console.log(`   FT offers: ${ftOffers.length}`);
            console.log(`   LBA offers: ${lbaOffers.length}`);
            
            // Show sample offers
            if (offers.length > 0) {
                console.log(`📋 Sample offers:`);
                offers.forEach((offer, i) => {
                    console.log(`   ${i+1}. [${offer.source_primary}] "${offer.title.slice(0, 40)}..."`);
                    if (offer.rome_codes) {
                        console.log(`      ROME: ${offer.rome_codes.join(', ')}`);
                    }
                });
            }
            
            // Test with a simple query
            console.log(`\n🔍 Testing simple text search...`);
            const queryUrl = 'http://localhost:3000/api/search/offers?query=technicien&limit=5';
            const queryResult = await makeRequest(queryUrl, 15000);
            
            if (queryResult.success) {
                const queryOffers = queryResult.data.offers;
                const queryFT = queryOffers.filter(o => o.source_primary === 'FT');
                
                console.log(`✅ Query search: ${queryOffers.length} offers found`);
                console.log(`   FT offers in results: ${queryFT.length}`);
                
                if (queryFT.length > 0) {
                    console.log(`🎯 FT offers found in search - Integration SUCCESS!`);
                    console.log(`📋 FT offers:`);
                    queryFT.forEach((offer, i) => {
                        console.log(`   ${i+1}. "${offer.title.slice(0, 50)}..."`);
                    });
                } else {
                    console.log(`⚠️ No FT offers in "technicien" search - may need investigation`);
                }
                
            } else {
                console.log(`❌ Query search failed: ${queryResult.error}`);
            }
            
        } else {
            console.log(`❌ API error: ${result.error}`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

function makeRequest(url, timeout = 10000) {
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
        
        request.setTimeout(timeout, () => {
            request.abort();
            reject(new Error('Request timeout'));
        });
    });
}

// Run the test
simpleSearchTest();