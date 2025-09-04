// Script to trigger FT offers AI enrichment
const http = require('http');

async function triggerEnrichment() {
    try {
        console.log('🚀 Triggering AI enrichment for FT offers...');
        
        const postData = JSON.stringify({});
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/enrich/queue',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-secret': 'Iletait1x',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        console.log('📊 Response:', JSON.stringify(result, null, 2));
                        
                        if (result.success) {
                            console.log(`✅ Success: ${result.message}`);
                            console.log(`📈 Processed: ${result.processed}, Successful: ${result.successful}, Failed: ${result.failed}`);
                        } else {
                            console.log(`❌ Error: ${result.error}`);
                        }
                        resolve(result);
                    } catch (parseError) {
                        console.error('❌ Parse error:', parseError.message);
                        console.error('❌ Raw response:', data);
                        reject(parseError);
                    }
                });
            });
            
            req.on('error', (error) => {
                console.error('❌ Request error:', error.message);
                reject(error);
            });
            
            req.write(postData);
            req.end();
        });
        
    } catch (error) {
        console.error('❌ Script error:', error.message);
    }
}

triggerEnrichment();