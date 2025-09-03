// Test script pour vérifier l'ingestion LBA avec la nouvelle approche
const testLBAIngestion = async () => {
  const BASE_URL = 'http://localhost:3006';
  
  console.log('🧪 Test d\'ingestion LBA...');
  
  try {
    // Démarrer l'ingestion
    console.log('▶️ Démarrage de l\'ingestion LBA...');
    const ingestionResponse = await fetch(`${BASE_URL}/api/admin/ingest/lba`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        limit: 50,
        dryRun: false
      })
    });
    
    if (!ingestionResponse.ok) {
      console.log('❌ Ingestion failed:', ingestionResponse.status, await ingestionResponse.text());
      return;
    }

    const ingestionData = await ingestionResponse.json();
    console.log('✅ Ingestion démarrée:', ingestionData);
    
    if (!ingestionData.success || !ingestionData.data?.batchId) {
      console.log('❌ Pas de batchId reçu');
      return;
    }
    
    const batchId = ingestionData.data.batchId;
    console.log(`📦 Batch ID: ${batchId}`);
    
    // Maintenant connecter au stream SSE pour surveiller la progression
    console.log('\n📡 Connexion au stream SSE...');
    
    const eventSource = new EventSource(`${BASE_URL}/api/admin/ingest/${batchId}/stream`);
    
    eventSource.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        console.log(`📊 ${data.type}:`, {
          stage: data.data.stage,
          progress: data.data.progress,
          status: data.data.status,
          metrics: data.data.metrics
        });
        
        if (data.type === 'ingestion_finished') {
          console.log('🎉 Ingestion terminée !');
          eventSource.close();
        }
      } catch (err) {
        console.log('📨 Raw message:', event.data);
      }
    };
    
    eventSource.onerror = function(event) {
      console.log('❌ SSE Error:', event);
      eventSource.close();
    };
    
    // Fermer après 30 secondes max
    setTimeout(() => {
      console.log('⏰ Timeout - fermeture de la connexion SSE');
      eventSource.close();
    }, 30000);
    
  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
  }
};

// Support basique d'EventSource pour Node.js
if (typeof EventSource === 'undefined') {
  console.log('⚠️ EventSource non supporté dans ce environment. Exécutez ce test dans un navigateur ou utilisez un polyfill.');
} else {
  testLBAIngestion();
}

// Si exécuté directement dans Node.js, faire un test simple sans SSE
if (typeof window === 'undefined') {
  testLBAIngestion().catch(console.error);
}