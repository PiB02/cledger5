// Generate embeddings for enriched FT offers
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

// Import embedding text builder logic (simplified version)
function buildEmbeddingText(offer, enrichment) {
    const parts = [];
    
    // Title (required)
    if (offer.title) {
        parts.push(`TITLE: ${offer.title}`);
    }
    
    // ROME codes
    if (offer.rome_codes?.length > 0) {
        parts.push(`ROME: ${offer.rome_codes.join('|')}`);
    }
    
    // Location (if available)
    if (offer.location_info) {
        parts.push(`LOCATION: ${offer.location_info}|FR`);
    }
    
    // Seniority from enrichment
    if (enrichment?.seniority_level) {
        parts.push(`SENIORITY: ${enrichment.seniority_level}`);
    }
    
    // Contract type
    if (offer.contract_type) {
        parts.push(`CONTRACT: ${offer.contract_type}`);
    }
    
    // Work mode
    if (offer.work_mode) {
        parts.push(`WORK_MODE: ${offer.work_mode}`);
    }
    
    // Languages from enrichment
    if (enrichment?.languages_detected?.length > 0) {
        const langs = enrichment.languages_detected
            .map(lang => `${lang.language}=${lang.level}`)
            .join('|');
        parts.push(`LANGUAGES: ${langs}`);
    }
    
    // Degree requirements from enrichment
    if (enrichment?.degree_requirements?.length > 0) {
        const minEqf = Math.min(...enrichment.degree_requirements.map(d => d.eqf_level || 1));
        parts.push(`DEGREE_EQF_MIN: ${minEqf}`);
    }
    
    // Skills from enrichment
    if (enrichment?.skills_required?.length > 0) {
        const requiredSkills = enrichment.skills_required
            .filter(skill => skill.confidence >= 0.7)
            .map(skill => skill.name.toLowerCase())
            .slice(0, 10) // Limit to 10 skills
            .join('|');
        if (requiredSkills) {
            parts.push(`SKILLS_REQUIRED: ${requiredSkills}`);
        }
    }
    
    // Salary (if available)
    if (offer.salary_min && offer.salary_max) {
        parts.push(`SALARY: ${offer.salary_min}-${offer.salary_max} EUR annual`);
    } else {
        parts.push(`SALARY: unknown`);
    }
    
    // Availability
    parts.push(`AVAILABILITY: ASAP`);
    
    const embeddingText = parts.join('\n');
    
    // Ensure it's under 1500 characters (OpenAI embedding limit recommendation)
    if (embeddingText.length > 1500) {
        return embeddingText.slice(0, 1497) + '...';
    }
    
    return embeddingText;
}

async function generateFTEmbeddings() {
    try {
        console.log('🔮 Starting FT offers embedding generation...');
        
        // Get enriched FT offers without embeddings
        const { data: enrichedOffers, error: fetchError } = await supabase
            .from('offers')
            .select(`
                id,
                title,
                rome_codes,
                contract_type,
                work_mode,
                salary_min,
                salary_max,
                source_primary,
                offer_enrichment!inner(
                    enrichment_status,
                    confidence_scores,
                    seniority_level,
                    skills_required,
                    languages_detected,
                    degree_requirements
                )
            `)
            .eq('source_primary', 'FT')
            .eq('offer_enrichment.enrichment_status', 'completed')
            .gte('offer_enrichment.confidence_scores->global', 0.80);
            
        if (fetchError) {
            console.error('❌ Fetch error:', fetchError);
            return;
        }

        if (!enrichedOffers || enrichedOffers.length === 0) {
            console.log('✅ No enriched FT offers found for embedding generation');
            return;
        }

        // Filter out offers that already have embeddings
        const { data: existingEmbeddings } = await supabase
            .from('offer_embeddings')
            .select('offer_id')
            .eq('kind', 'semantic')
            .in('offer_id', enrichedOffers.map(o => o.id));

        const existingOfferIds = new Set(existingEmbeddings?.map(e => e.offer_id) || []);
        const offersNeedingEmbeddings = enrichedOffers.filter(offer => !existingOfferIds.has(offer.id));

        if (offersNeedingEmbeddings.length === 0) {
            console.log('✅ All enriched FT offers already have embeddings');
            return;
        }

        console.log(`📊 Found ${offersNeedingEmbeddings.length} enriched FT offers needing embeddings`);
        console.log(`🎯 Processing batch of ${Math.min(20, offersNeedingEmbeddings.length)} offers`);
        
        let processed = 0;
        let successful = 0;
        let failed = 0;
        let totalTokens = 0;
        
        // Process in batches of 20
        const batchSize = 20;
        const batch = offersNeedingEmbeddings.slice(0, batchSize);

        for (const offer of batch) {
            try {
                const enrichment = offer.offer_enrichment[0];
                
                console.log(`🔄 Processing embedding for ${offer.id.slice(0, 8)}... "${offer.title.slice(0, 40)}..."`);
                
                // Build embedding text using standardized format
                const embeddingText = buildEmbeddingText(offer, enrichment);
                
                console.log(`📝 Embedding text (${embeddingText.length} chars): ${embeddingText.slice(0, 100)}...`);
                
                // Generate embedding using OpenAI text-embedding-3-small
                const embeddingResponse = await openai.embeddings.create({
                    model: 'text-embedding-3-small',
                    input: embeddingText,
                    encoding_format: 'float'
                });

                const embedding = embeddingResponse.data[0]?.embedding;
                const tokensUsed = embeddingResponse.usage?.total_tokens || 0;
                totalTokens += tokensUsed;

                if (!embedding) {
                    throw new Error('No embedding returned from OpenAI');
                }

                // Create hash of embedding text for deduplication
                const crypto = require('crypto');
                const textHash = crypto.createHash('sha256').update(embeddingText).digest();
                
                // Store embedding in Supabase
                const { error: insertError } = await supabase
                    .from('offer_embeddings')
                    .insert({
                        offer_id: offer.id,
                        kind: 'semantic',
                        model: 'text-embedding-3-small',
                        dim: embedding.length,
                        embedding: embedding,
                        text_used_hash: textHash,
                        created_at: new Date().toISOString()
                    });

                if (insertError) {
                    throw new Error(`Failed to store embedding: ${insertError.message}`);
                }

                console.log(`✅ Generated embedding ${offer.id.slice(0, 8)} - Dim: ${embedding.length} - Tokens: ${tokensUsed}`);
                successful++;
                
            } catch (error) {
                console.error(`❌ Failed to generate embedding for ${offer.id.slice(0, 8)}:`, error.message);
                failed++;
            }
            
            processed++;
            
            // Rate limiting (embedding API is faster than chat)
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Calculate performance metrics
        const cost = (totalTokens / 1000000) * 0.02; // text-embedding-3-small pricing

        console.log(`\n🎉 FT embedding generation completed:`);
        console.log(`📊 Total processed: ${processed}`);
        console.log(`✅ Successful: ${successful} (${((successful/processed)*100).toFixed(1)}%)`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`🪙 Total tokens: ${totalTokens.toLocaleString()}`);
        console.log(`💰 Total cost: $${cost.toFixed(4)}`);
        
        // Check total embedding status
        const { count: totalEmbeddings } = await supabase
            .from('offer_embeddings')
            .select('*', { count: 'exact', head: true })
            .eq('kind', 'semantic')
            .in('offer_id', enrichedOffers.map(o => o.id));

        console.log(`\n📊 FT Embeddings Summary:`);
        console.log(`🎯 Total enriched FT offers: ${enrichedOffers.length}`);
        console.log(`✅ With embeddings: ${totalEmbeddings || 0}`);
        console.log(`⏳ Still needed: ${enrichedOffers.length - (totalEmbeddings || 0)}`);
        console.log(`📈 Completion rate: ${((totalEmbeddings || 0) / enrichedOffers.length * 100).toFixed(1)}%`);
        
        // Next steps
        if (successful > 0) {
            console.log(`\n🚀 Next steps:`);
            console.log(`1. Run script again if more embeddings needed`);
            console.log(`2. Test semantic search with FT offers`);
            console.log(`3. Verify search integration works correctly`);
            console.log(`4. Update admin interface to monitor pipeline`);
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the embedding generation
generateFTEmbeddings();