// Test script pour vérifier que les endpoints de progression fonctionnent
const testProgressEndpoints = async () => {
  const BASE_URL = 'http://localhost:3006';
  const batchId = crypto.randomUUID();
  
  console.log('🧪 Test des endpoints de progression...');
  console.log(`📦 Batch ID: ${batchId}`);
  
  try {
    // Test 0: Vérifier que l'API fonctionne avec un endpoint simple
    console.log('\n0️⃣ Test de l\'endpoint debug simple...');
    const debugResponse = await fetch(`${BASE_URL}/api/debug`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'ping' })
    });
    
    if (debugResponse.ok) {
      const data = await debugResponse.json();
      console.log('✅ Debug endpoint OK:', data.message);
    } else {
      console.log('❌ Debug endpoint failed:', debugResponse.status, await debugResponse.text());
    }

    // Test 1: Vérifier que l'endpoint update-progress existe et répond
    console.log('\n1️⃣ Test de l\'endpoint update-progress...');
    const updateResponse = await fetch(`${BASE_URL}/api/admin/ingest/update-progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': process.env.ADMIN_SECRET || 'test-secret'
      },
      body: JSON.stringify({
        batchId,
        status: 'running',
        progress: 25,
        stage: 'Test en cours...',
        metrics: {
          totalFetched: 100,
          totalProcessed: 25,
          totalInserted: 20,
          totalUpdated: 5,
          totalDeduplicated: 0,
          totalErrors: 0,
          errors: []
        }
      })
    });
    
    if (updateResponse.ok) {
      const data = await updateResponse.json();
      console.log('✅ Update endpoint OK:', data);
    } else {
      console.log('❌ Update endpoint failed:', updateResponse.status, await updateResponse.text());
    }
    
    // Test 2: Vérifier que l'endpoint SSE existe
    console.log('\n2️⃣ Test de l\'endpoint SSE...');
    const sseResponse = await fetch(`${BASE_URL}/api/admin/ingest/${batchId}/stream`, {
      headers: {
        'Accept': 'text/event-stream'
      }
    });
    
    if (sseResponse.ok) {
      console.log('✅ SSE endpoint accessible');
      // Ne pas consommer le stream complet pour éviter de bloquer
      sseResponse.body?.cancel();
    } else {
      console.log('❌ SSE endpoint failed:', sseResponse.status, await sseResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Erreur durant les tests:', error);
  }
};

// Fonction utilitaire pour UUID (simple)
const crypto = {
  randomUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

testProgressEndpoints();