"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, 
  Pause, 
  Square, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Activity,
  Loader2,
  X,
  RotateCcw,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface BatchInfo {
  id: string;
  source_type: 'lba' | 'france_travail';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  batch_params: any;
  progress_data: any;
  total_fetched: number;
  total_processed: number;
  total_inserted: number;
  total_duplicates: number;
  total_errors: number;
  error_messages: string[];
  retry_count: number;
  started_at: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface SSEEvent {
  type: 'batch_init' | 'batch_update' | 'batch_complete' | 'heartbeat' | 'connection_status';
  batch?: BatchInfo;
  changes?: Partial<BatchInfo>;
  timestamp: string;
  final_status?: string;
  status?: string;
}

interface BatchMonitorProps {
  initialBatches?: BatchInfo[];
  autoRefresh?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'running': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'cancelled': return <X className="h-4 w-4 text-gray-500" />;
    default: return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'failed': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'lba': return 'bg-blue-100 text-blue-800';
    case 'france_travail': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function BatchMonitor({ initialBatches = [], autoRefresh = true }: BatchMonitorProps) {
  const [batches, setBatches] = useState<BatchInfo[]>(initialBatches);
  const [activeBatch, setActiveBatch] = useState<BatchInfo | null>(null);
  const [sseConnections, setSSEConnections] = useState<Map<string, EventSource>>(new Map());
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const logsRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    setLogs(prev => [...prev.slice(-99), `${timestamp}: ${message}`]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (logsRef.current) {
        logsRef.current.scrollTop = logsRef.current.scrollHeight;
      }
    }, 100);
  };

  const fetchBatches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/batches?active_only=false&limit=50');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setBatches(data.data.batches);
        addLog(`Batches rechargés: ${data.data.batches.length} trouvés`);
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Erreur rechargement batches:', error);
      addLog(`❌ Erreur rechargement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const connectSSE = (batchId: string) => {
    // Close existing connection for this batch
    const existingConnection = sseConnections.get(batchId);
    if (existingConnection) {
      existingConnection.close();
    }

    addLog(`🔌 Connexion SSE au batch ${batchId.slice(0, 8)}...`);

    const eventSource = new EventSource(`/api/admin/batches/${batchId}/stream`);

    eventSource.onopen = () => {
      addLog(`✅ SSE connecté au batch ${batchId.slice(0, 8)}`);
    };

    eventSource.addEventListener('batch_init', (event) => {
      const data: SSEEvent = JSON.parse(event.data);
      addLog(`📊 Données initiales batch ${batchId.slice(0, 8)}: ${data.batch?.status}`);
      
      if (data.batch) {
        setActiveBatch(data.batch);
        setBatches(prev => prev.map(b => b.id === data.batch!.id ? data.batch! : b));
      }
    });

    eventSource.addEventListener('batch_update', (event) => {
      const data: SSEEvent = JSON.parse(event.data);
      addLog(`🔄 Mise à jour batch ${batchId.slice(0, 8)}: ${data.changes?.status || 'progression'}`);
      
      if (data.batch) {
        setBatches(prev => prev.map(b => b.id === data.batch!.id ? data.batch! : b));
        if (activeBatch?.id === data.batch.id) {
          setActiveBatch(data.batch);
        }
      }
    });

    eventSource.addEventListener('batch_complete', (event) => {
      const data: SSEEvent = JSON.parse(event.data);
      addLog(`🎯 Batch ${batchId.slice(0, 8)} terminé: ${data.final_status}`);
      
      if (data.batch) {
        setBatches(prev => prev.map(b => b.id === data.batch!.id ? data.batch! : b));
        if (activeBatch?.id === data.batch.id) {
          setActiveBatch(data.batch);
        }
      }

      // Auto-disconnect completed batches after 30s
      setTimeout(() => {
        disconnectSSE(batchId);
      }, 30000);
    });

    eventSource.addEventListener('heartbeat', () => {
      // Silent heartbeat - just keep connection alive
    });

    eventSource.onerror = (error) => {
      console.error('SSE error for batch', batchId, error);
      addLog(`❌ Erreur SSE batch ${batchId.slice(0, 8)}`);
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        if (sseConnections.has(batchId)) {
          addLog(`🔄 Reconnexion SSE batch ${batchId.slice(0, 8)}...`);
          connectSSE(batchId);
        }
      }, 5000);
    };

    setSSEConnections(prev => new Map(prev).set(batchId, eventSource));
  };

  const disconnectSSE = (batchId: string) => {
    const connection = sseConnections.get(batchId);
    if (connection) {
      connection.close();
      setSSEConnections(prev => {
        const newMap = new Map(prev);
        newMap.delete(batchId);
        return newMap;
      });
      addLog(`🔌 SSE déconnecté du batch ${batchId.slice(0, 8)}`);
    }
  };

  const handleBatchAction = async (batchId: string, action: 'cancel' | 'retry' | 'delete') => {
    try {
      addLog(`⚡ Action ${action} sur batch ${batchId.slice(0, 8)}...`);

      let response;
      if (action === 'delete') {
        response = await fetch(`/api/admin/batches/${batchId}`, {
          method: 'DELETE'
        });
      } else {
        response = await fetch(`/api/admin/batches/${batchId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ ${action} réussi pour batch ${batchId.slice(0, 8)}`);
        if (action === 'delete') {
          setBatches(prev => prev.filter(b => b.id !== batchId));
          if (activeBatch?.id === batchId) {
            setActiveBatch(null);
          }
          disconnectSSE(batchId);
        } else {
          await fetchBatches(); // Refresh all batches
        }
      } else {
        throw new Error(result.error || 'Action échouée');
      }
    } catch (error) {
      console.error(`Erreur action ${action}:`, error);
      addLog(`❌ Erreur ${action}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Auto-refresh batches
  useEffect(() => {
    if (autoRefresh) {
      fetchBatches();
      const interval = setInterval(fetchBatches, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Auto-connect SSE to active batches
  useEffect(() => {
    const activeBatchesToConnect = batches
      .filter(b => ['pending', 'running'].includes(b.status))
      .filter(b => !sseConnections.has(b.id));

    activeBatchesToConnect.forEach(batch => {
      connectSSE(batch.id);
    });

    // Cleanup on unmount
    return () => {
      sseConnections.forEach(connection => connection.close());
    };
  }, [batches]);

  const getProgressPercentage = (batch: BatchInfo): number => {
    if (batch.total_fetched === 0) return 0;
    return Math.round((batch.total_processed / batch.total_fetched) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Monitoring Batches</h2>
        <Button
          onClick={fetchBatches}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch List */}
        <Card>
          <CardHeader>
            <CardTitle>Batches Actifs & Récents ({batches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {batches.map((batch) => (
                  <div 
                    key={batch.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      activeBatch?.id === batch.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setActiveBatch(batch)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(batch.status)}
                        <Badge className={getSourceColor(batch.source_type)}>
                          {batch.source_type === 'lba' ? 'LBA' : 'FT'}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(batch.status)}>
                          {batch.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(batch.created_at), { 
                          addSuffix: true, 
                          locale: fr 
                        })}
                      </span>
                    </div>
                    
                    {batch.status === 'running' && batch.total_fetched > 0 && (
                      <div className="mb-2">
                        <Progress 
                          value={getProgressPercentage(batch)} 
                          className="h-2" 
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {batch.total_processed} / {batch.total_fetched} ({getProgressPercentage(batch)}%)
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {batch.total_inserted} insérés, {batch.total_errors} erreurs
                      </span>
                      <div className="flex gap-1">
                        {['pending', 'running'].includes(batch.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBatchAction(batch.id, 'cancel');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        {sseConnections.has(batch.id) && (
                          <Badge variant="outline" className="h-6 px-2 bg-green-50 text-green-700 border-green-200">
                            Live
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {batches.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Aucun batch trouvé
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Batch Details & Logs */}
        <div className="space-y-6">
          {/* Batch Details */}
          {activeBatch && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Détails Batch</span>
                  <div className="flex gap-2">
                    {activeBatch.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBatchAction(activeBatch.id, 'retry')}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    {['completed', 'failed', 'cancelled'].includes(activeBatch.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBatchAction(activeBatch.id, 'delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span>
                    <p className="text-gray-600 font-mono">{activeBatch.id.slice(0, 8)}...</p>
                  </div>
                  <div>
                    <span className="font-medium">Source:</span>
                    <p className="text-gray-600">{activeBatch.source_type}</p>
                  </div>
                  <div>
                    <span className="font-medium">Statut:</span>
                    <p className="flex items-center gap-2">
                      {getStatusIcon(activeBatch.status)}
                      {activeBatch.status}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Démarré:</span>
                    <p className="text-gray-600">
                      {formatDistanceToNow(new Date(activeBatch.started_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>

                {activeBatch.total_fetched > 0 && (
                  <div>
                    <span className="font-medium">Progression:</span>
                    <Progress value={getProgressPercentage(activeBatch)} className="mt-2" />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{activeBatch.total_processed} / {activeBatch.total_fetched} traités</span>
                      <span>{getProgressPercentage(activeBatch)}%</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold text-green-700">{activeBatch.total_inserted}</div>
                    <div className="text-green-600">Insérés</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-bold text-yellow-700">{activeBatch.total_duplicates}</div>
                    <div className="text-yellow-600">Doublons</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="font-bold text-red-700">{activeBatch.total_errors}</div>
                    <div className="text-red-600">Erreurs</div>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold text-blue-700">{activeBatch.retry_count}</div>
                    <div className="text-blue-600">Retries</div>
                  </div>
                </div>

                {activeBatch.error_messages && activeBatch.error_messages.length > 0 && (
                  <div>
                    <span className="font-medium text-red-600">Erreurs:</span>
                    <ScrollArea className="h-20 mt-1">
                      <div className="space-y-1">
                        {activeBatch.error_messages.map((error, i) => (
                          <p key={i} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            {error}
                          </p>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Logs Temps Réel</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLogs([])}
                >
                  Clear
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64" ref={logsRef}>
                <div className="space-y-1">
                  {logs.map((log, i) => (
                    <p key={i} className="text-xs font-mono text-gray-600 py-1 border-b">
                      {log}
                    </p>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      Aucun log à afficher
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}