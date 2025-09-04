// Standalone FT offers enrichment script - bypassing API compilation issues
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
require('dotenv').config({ path: '.env.local' });

// Initialize clients
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function enrichFTOffers() {
    try {
        console.log('🤖 Starting FT offers AI enrichment...');
        
        // Get pending FT offers for enrichment (limit 10 for initial batch)
        const { data: pendingOffers, error: fetchError } = await supabase
            .from('offer_enrichment')
            .select(`
                offer_id,
                offers!inner(
                    id,
                    title,
                    description,
                    rome_codes,
                    career_level,
                    source_primary,
                    created_at
                )
            `)
            .eq('enrichment_status', 'pending')
            .eq('offers.source_primary', 'FT')
            .order('created_at', { ascending: true })
            .limit(10);
        
        if (fetchError) {
            console.error('❌ Fetch error:', fetchError);
            return;
        }

        if (!pendingOffers || pendingOffers.length === 0) {
            console.log('✅ No pending FT offers to process');
            return;
        }

        console.log(`📊 Found ${pendingOffers.length} FT offers to enrich`);
        
        let processed = 0;
        let successful = 0;
        let failed = 0;

        // Process each offer
        for (const pending of pendingOffers) {
            try {
                const offer = pending.offers;
                console.log(`🔄 Processing offer ${offer.id.slice(0, 8)}... "${offer.title.slice(0, 50)}..."`);
                
                // Mark as processing
                await supabase
                    .from('offer_enrichment')
                    .update({
                        enrichment_status: 'processing',
                        updated_at: new Date().toISOString()
                    })
                    .eq('offer_id', offer.id);

                // Call GPT-4o-mini for enrichment
                const prompt = `Analyze this French job offer and extract structured information:

Title: ${offer.title}
Description: ${offer.description || 'No description'}
ROME codes: ${offer.rome_codes?.join(', ') || 'None'}

Extract:
1. Required skills (with confidence 0-1)
2. Seniority level (intern, junior, mid, senior, lead, manager)  
3. Languages detected (with CEFR levels)
4. Degree requirements (with EQF levels)

Return JSON format:
{
  "skills_required": [{"name": "skill", "category": "technical", "confidence": 0.9}],
  "seniority_level": "mid", 
  "languages_detected": [{"language": "French", "level": "C1", "confidence": 0.8}],
  "degree_requirements": [{"level": "Bachelor", "eqf_level": 6, "confidence": 0.7}],
  "confidence_scores": {"skills": 0.85, "seniority": 0.90, "languages": 0.75, "degrees": 0.70, "global": 0.80}
}`;

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.3,
                    max_tokens: 1000
                });

                const aiResponse = completion.choices[0]?.message?.content;
                const tokensUsed = completion.usage?.total_tokens || 0;
                
                if (!aiResponse) {
                    throw new Error('No AI response received');
                }

                // Parse AI response (handle markdown code blocks)
                let cleanResponse = aiResponse.trim();
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
                } else if (cleanResponse.startsWith('```')) {
                    cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
                }
                
                const enrichment = JSON.parse(cleanResponse);
                const globalConfidence = enrichment.confidence_scores?.global || 0;
                
                // Determine status based on confidence
                const status = globalConfidence >= 0.80 ? 'completed' : 'low_confidence';
                
                // Save enrichment
                const { error: updateError } = await supabase
                    .from('offer_enrichment')
                    .update({
                        enrichment_status: status,
                        seniority_level: enrichment.seniority_level,
                        confidence_scores: enrichment.confidence_scores,
                        skills_required: enrichment.skills_required || [],
                        languages_detected: enrichment.languages_detected || [],
                        degree_requirements: enrichment.degree_requirements || [],
                        tokens_used: tokensUsed,
                        processing_time_ms: 1000,
                        processed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('offer_id', offer.id);

                if (updateError) {
                    throw new Error(`Failed to save enrichment: ${updateError.message}`);
                }

                console.log(`✅ Enriched offer ${offer.id.slice(0, 8)} - Confidence: ${globalConfidence.toFixed(2)} - Status: ${status}`);
                successful++;
                
            } catch (error) {
                console.error(`❌ Failed to enrich offer ${pending.offer_id.slice(0, 8)}:`, error.message);
                
                // Mark as failed
                await supabase
                    .from('offer_enrichment')
                    .update({
                        enrichment_status: 'failed',
                        error_msg: error instanceof Error ? error.message : 'Unknown error',
                        updated_at: new Date().toISOString()
                    })
                    .eq('offer_id', pending.offer_id);
                
                failed++;
            }
            
            processed++;
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`\n🎉 Processing completed:`);
        console.log(`📊 Total processed: ${processed}`);
        console.log(`✅ Successful: ${successful}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success rate: ${((successful / processed) * 100).toFixed(1)}%`);
        
        // Show next steps
        if (successful > 0) {
            console.log(`\n🚀 Next steps:`);
            console.log(`1. Run this script again to process more batches`);
            console.log(`2. Generate embeddings for enriched offers`);
            console.log(`3. Test semantic search with FT offers`);
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the enrichment
enrichFTOffers();