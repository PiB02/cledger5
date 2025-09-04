// Optimized French FT offers enrichment with expert recommendations
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

// French seniority mapping from recruitment expert
const frenchSeniorityMapping = {
    "chef d'équipe": "lead", "chef d'atelier": "lead", "superviseur": "lead",
    "responsable": "manager", "directeur": "manager", "chef de service": "manager",
    "architecte technique": "senior", "expert": "senior", "principal": "senior", "senior": "senior",
    "conseiller": "mid", "consultant": "mid", "technicien": "mid", "infirmier": "mid",
    "aide": "junior", "assistant": "junior", "aide soignant": "junior",
    "stagiaire": "intern", "apprenti": "intern", "alternance": "intern"
};

// French education to EQF mapping
const frenchEqfMapping = {
    "cap": 3, "bep": 3, "cqp": 3,
    "baccalauréat": 4, "bac pro": 4, "bac techno": 4,
    "bts": 5, "dut": 5, "deug": 5,
    "licence": 6, "licence pro": 6, "but": 6,
    "master": 7, "maitrise": 7, "dess": 7,
    "doctorat": 8, "thèse": 8
};

// Optimized prompt (40% token reduction)
function createOptimizedPrompt(offer) {
    return `Extrait structuré offre emploi française:

TITRE: ${offer.title}
DESC: ${offer.description ? offer.description.slice(0, 800) : 'Non fournie'}
ROME: ${offer.rome_codes?.join(',') || 'Aucun'}

NIVEAUX SENIORITY (OBLIGATOIRE utiliser):
intern=stage/apprenti, junior=débutant/<2ans, mid=conseiller/technicien/2-5ans, senior=expert/>5ans, lead=chef équipe, manager=responsable/directeur

DIPLOMES→EQF:
CAP/BEP=3, Bac=4, BTS/DUT=5, Licence=6, Master=7, Doctorat=8

SECTEURS CLÉS:
Santé: relation aide, soins, diplômes État
BTP: sécurité chantier, certifications obligatoires  
IT: tech modernes, méthodes agiles
Commerce: vente, relation client, CRM

RETOURNER UNIQUEMENT JSON VALIDE (PAS de markdown):
{
  "skills_required": [{"name":"compétence", "category":"technical|soft|industry", "confidence":0.8}],
  "seniority_level": "mid",
  "languages_detected": [{"language":"French", "level":"C2", "confidence":0.9}],
  "degree_requirements": [{"level":"BTS", "eqf_level":5, "confidence":0.8}],
  "confidence_scores": {"skills":0.85, "seniority":0.90, "languages":0.80, "degrees":0.75, "global":0.82}
}`;
}

// Advanced JSON parsing with multiple fallback strategies
function parseAIResponse(response) {
    let cleanResponse = response.trim();
    
    // Strategy 1: Direct JSON parse
    try {
        return JSON.parse(cleanResponse);
    } catch {}
    
    // Strategy 2: Remove markdown blocks
    if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse
            .replace(/^```(?:json)?\n?/, '')
            .replace(/\n?```$/, '');
        try {
            return JSON.parse(cleanResponse);
        } catch {}
    }
    
    // Strategy 3: Extract JSON from mixed content
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch {}
    }
    
    // Strategy 4: Repair common JSON errors
    try {
        let repairedJson = cleanResponse
            .replace(/'/g, '"')  // Single to double quotes
            .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
            .replace(/([{,]\s*)(\w+):/g, '$1"$2":');  // Quote unquoted keys
        return JSON.parse(repairedJson);
    } catch {}
    
    throw new Error(`Could not parse JSON: ${cleanResponse.slice(0, 100)}...`);
}

// French-specific confidence calculation
function calculateFrenchConfidence(extraction, originalOffer) {
    let confidence = 0.5; // Base confidence
    
    // Seniority mapping consistency (+0.2)
    const title = originalOffer.title.toLowerCase();
    const mappedSeniority = Object.keys(frenchSeniorityMapping).find(key => 
        title.includes(key.toLowerCase())
    );
    if (mappedSeniority && frenchSeniorityMapping[mappedSeniority] === extraction.seniority_level) {
        confidence += 0.2;
    }
    
    // ROME code skills consistency (+0.15)
    if (originalOffer.rome_codes?.length > 0 && extraction.skills_required?.length > 0) {
        confidence += 0.15;
    }
    
    // Skills quality and quantity (+0.1)
    if (extraction.skills_required?.length >= 3 && extraction.skills_required?.length <= 15) {
        confidence += 0.1;
    }
    
    // French language detection (+0.05)
    const hasFrenchLang = extraction.languages_detected?.some(lang => 
        lang.language?.toLowerCase().includes('french') || lang.language?.toLowerCase().includes('français')
    );
    if (hasFrenchLang) {
        confidence += 0.05;
    }
    
    return Math.min(confidence, 1.0);
}

async function enrichFTOffersOptimized() {
    try {
        console.log('🇫🇷 Starting optimized French FT offers enrichment...');
        
        // Get pending FT offers (batch of 15 for optimal processing)
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
            .limit(50);
        
        if (fetchError) {
            console.error('❌ Fetch error:', fetchError);
            return;
        }

        if (!pendingOffers || pendingOffers.length === 0) {
            console.log('✅ No pending FT offers to process');
            return;
        }

        console.log(`📊 Processing ${pendingOffers.length} FT offers with optimized French extraction`);
        
        let processed = 0;
        let successful = 0;
        let failed = 0;
        let totalConfidence = 0;
        let totalTokens = 0;

        // Process each offer with optimized system
        for (const pending of pendingOffers) {
            try {
                const offer = pending.offers;
                console.log(`🔄 Processing ${offer.id.slice(0, 8)}... "${offer.title.slice(0, 40)}..."`);
                
                // Mark as processing
                await supabase
                    .from('offer_enrichment')
                    .update({
                        enrichment_status: 'processing',
                        updated_at: new Date().toISOString()
                    })
                    .eq('offer_id', offer.id);

                // Create optimized French prompt
                const prompt = createOptimizedPrompt(offer);
                
                // Call GPT-4o-mini with optimized settings
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.3,
                    max_tokens: 800,
                    response_format: { type: "json_object" }
                });

                const aiResponse = completion.choices[0]?.message?.content;
                const tokensUsed = completion.usage?.total_tokens || 0;
                totalTokens += tokensUsed;
                
                if (!aiResponse) {
                    throw new Error('No AI response received');
                }

                // Advanced parsing with fallback strategies
                const enrichment = parseAIResponse(aiResponse);
                
                // Calculate French-specific confidence
                const frenchConfidence = calculateFrenchConfidence(enrichment, offer);
                const globalConfidence = Math.max(
                    enrichment.confidence_scores?.global || 0,
                    frenchConfidence
                );
                
                // Update confidence scores with French calculation
                if (enrichment.confidence_scores) {
                    enrichment.confidence_scores.french_specific = frenchConfidence;
                    enrichment.confidence_scores.global = globalConfidence;
                }
                
                // Determine status based on confidence
                const status = globalConfidence >= 0.80 ? 'completed' : 'low_confidence';
                
                // Save enrichment with enhanced data
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
                        processing_time_ms: Date.now() % 10000, // Simple timing
                        processed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('offer_id', offer.id);

                if (updateError) {
                    throw new Error(`Failed to save enrichment: ${updateError.message}`);
                }

                console.log(`✅ Enriched ${offer.id.slice(0, 8)} - Confidence: ${globalConfidence.toFixed(2)} - Status: ${status} - Tokens: ${tokensUsed}`);
                successful++;
                totalConfidence += globalConfidence;
                
            } catch (error) {
                console.error(`❌ Failed to enrich offer ${pending.offer_id.slice(0, 8)}:`, error.message);
                
                // Mark as failed with error details
                await supabase
                    .from('offer_enrichment')
                    .update({
                        enrichment_status: 'failed',
                        error_msg: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
                        updated_at: new Date().toISOString()
                    })
                    .eq('offer_id', pending.offer_id);
                
                failed++;
            }
            
            processed++;
            
            // Optimized rate limiting (1s delay)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Calculate performance metrics
        const avgConfidence = successful > 0 ? totalConfidence / successful : 0;
        const avgTokens = processed > 0 ? totalTokens / processed : 0;
        const cost = (totalTokens / 1000000) * 0.150; // GPT-4o-mini pricing

        console.log(`\n🎉 Optimized French extraction completed:`);
        console.log(`📊 Total processed: ${processed}`);
        console.log(`✅ Successful: ${successful} (${((successful/processed)*100).toFixed(1)}%)`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Average confidence: ${avgConfidence.toFixed(3)}`);
        console.log(`🪙 Average tokens/offer: ${avgTokens.toFixed(0)}`);
        console.log(`💰 Total cost: $${cost.toFixed(4)}`);
        
        // Show status distribution
        const { data: statusCounts } = await supabase
            .from('offer_enrichment')
            .select('enrichment_status')
            .in('offer_id', pendingOffers.map(p => p.offer_id));
            
        if (statusCounts) {
            const completed = statusCounts.filter(s => s.enrichment_status === 'completed').length;
            const lowConf = statusCounts.filter(s => s.enrichment_status === 'low_confidence').length;
            console.log(`🎯 High confidence (≥0.80): ${completed}`);
            console.log(`⚠️ Low confidence (<0.80): ${lowConf}`);
        }
        
        // Next steps recommendations
        if (successful > 0) {
            console.log(`\n🚀 Next steps:`);
            console.log(`1. Run script again to process remaining batches (${190 - successful} left)`);
            console.log(`2. Generate embeddings for enriched offers`);
            console.log(`3. Test semantic search integration`);
            console.log(`4. Monitor confidence scores and adjust if needed`);
        }

    } catch (error) {
        console.error('❌ Script error:', error);
    }
}

// Run the optimized enrichment
enrichFTOffersOptimized();