"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  Download,
  Loader2,
  TrendingUp,
  X,
  Zap,
  Clock,
  FileText,
  RefreshCw,
  Minimize2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types pour les données de progression
interface IngestionMetrics {
  totalFetched: number;
  totalProcessed: number;
  totalInserted: number;
  totalUpdated: number;
  totalDeduplicated: number;
  totalErrors: number;
  errors: string[];
  dryRun?: boolean;
  startTime?: string;
  endTime?: string;
}

interface ProgressUpdate {
  type: 'ingestion_start' | 'ingestion_progress' | 'ingestion_finished' | 'error';
  data: {
    batchId: string;
    status: 'running' | 'completed' | 'error';
    progress: number;
    stage: string;
    metrics: IngestionMetrics;
  };
  timestamp: string;
}

interface RealTimeTrackerProps {
  title: string;
  source: 'lba' | 'ft';
  batchId: string;
  onClose?: () => void;
  onComplete?: (metrics: IngestionMetrics) => void;
}

export function RealTimeTracker({
  title,
  source,
  batchId,
  onClose,
  onComplete
}: RealTimeTrackerProps) {
  // États de progression
  const [status, setStatus] = useState<'connecting' | 'running' | 'completed' | 'error'>('connecting');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Connexion au stream...');
  const [metrics, setMetrics] = useState<IngestionMetrics>({
    totalFetched: 0,
    totalProcessed: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalDeduplicated: 0,
    totalErrors: 0,
    errors: [],
    dryRun: false,
  });

  // États UI
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Références
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date>(new Date());

  // Calculer les statistiques dérivées
  const stats = useCallback(() => {
    const successRate = metrics.totalProcessed > 0 
      ? ((metrics.totalProcessed - metrics.totalErrors) / metrics.totalProcessed) * 100 
      : 0;
    
    const elapsedTime = (Date.now() - startTimeRef.current.getTime()) / 1000;
    const rate = elapsedTime > 0 ? metrics.totalProcessed / elapsedTime : 0;
    
    return { successRate, elapsedTime, rate };
  }, [metrics]);

  // Connecter au stream SSE avec reconnexion automatique
  const connectToStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const streamUrl = `/api/admin/ingest/${batchId}/stream`;
    console.log(`[RealTimeTracker] Connecting to SSE stream: ${streamUrl}`);
    
    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`[RealTimeTracker] SSE connection established for batch ${batchId}`);
      setStatus('running');
      setConnectionAttempts(0);
      setStage('Connexion établie, en attente des données...');
    };

    eventSource.onmessage = (event) => {
      try {
        const update: ProgressUpdate = JSON.parse(event.data);
        console.log(`[RealTimeTracker] Received update:`, update.type, update.data);
        
        setLastUpdate(new Date());
        
        switch (update.type) {
          case 'ingestion_start':
            setStatus('running');
            setStage(update.data.stage || 'Ingestion démarrée');
            setProgress(update.data.progress || 0);
            if (update.data.metrics) {
              setMetrics(update.data.metrics);
            }
            break;

          case 'ingestion_progress':
            setProgress(update.data.progress);
            setStage(update.data.stage);
            if (update.data.metrics) {
              setMetrics(update.data.metrics);
            }
            break;

          case 'ingestion_finished':
            setStatus(update.data.status === 'error' ? 'error' : 'completed');
            setProgress(100);
            setStage(update.data.status === 'error' ? 'Terminée avec erreurs' : 'Ingestion terminée avec succès');
            if (update.data.metrics) {
              setMetrics(update.data.metrics);
              onComplete?.(update.data.metrics);
            }
            eventSource.close();
            break;

          case 'error':
            setStatus('error');
            setStage(update.data.stage || 'Erreur lors de l\'ingestion');
            if (update.data.metrics) {
              setMetrics(update.data.metrics);
            }
            eventSource.close();
            break;
        }
      } catch (error) {
        console.error('[RealTimeTracker] Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('[RealTimeTracker] SSE connection error:', error);
      setConnectionAttempts(prev => prev + 1);
      
      // Tentative de reconnexion automatique
      if (connectionAttempts < 5) {
        setStage(`Reconnexion... (tentative ${connectionAttempts + 1}/5)`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToStream();
        }, 2000 * Math.pow(2, connectionAttempts)); // Backoff exponentiel
      } else {
        setStatus('error');
        setStage('Impossible de maintenir la connexion');
      }
    };
  }, [batchId, connectionAttempts, onComplete]);

  // Initialiser la connexion dès le montage
  useEffect(() => {
    connectToStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectToStream]);

  // Fonction pour retry la connexion manuellement
  const handleRetryConnection = () => {
    setConnectionAttempts(0);
    setStatus('connecting');
    setStage('Reconnexion...');
    connectToStream();
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return 'bg-gray-100 text-gray-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connexion...';
      case 'running':
        return 'En cours';
      case 'completed':
        return metrics.totalErrors > 0 ? 'Terminée avec erreurs' : 'Terminée';
      case 'error':
        return 'Erreur';
    }
  };

  const currentStats = stats();

  return (
    <Card className="w-full shadow-md border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {source === 'lba' ? (
              <Download className="h-5 w-5 text-blue-500" />
            ) : (
              <Database className="h-5 w-5 text-orange-500" />
            )}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getStatusColor()}>
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            {lastUpdate && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="space-y-4">
          {/* Barre de progression principale */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{stage}</span>
              <span className="text-muted-foreground">{progress.toFixed(1)}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Temps écoulé: {Math.floor(currentStats.elapsedTime / 60)}m {Math.floor(currentStats.elapsedTime % 60)}s</span>
              {currentStats.rate > 0 && (
                <span>Vitesse: {currentStats.rate.toFixed(1)} offres/s</span>
              )}
            </div>
          </div>

          <Separator />

          {/* Métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.totalFetched.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Récupérées</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {metrics.totalProcessed.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Traitées</div>
            </div>
            <div className="text-center p-3 bg-cyan-50 rounded-lg">
              <div className="text-2xl font-bold text-cyan-600">
                {metrics.totalInserted.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Insérées</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {metrics.totalErrors.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Erreurs</div>
            </div>
          </div>

          {/* Statistiques avancées */}
          <div className="grid grid-cols-3 gap-4 text-sm bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Réussite: {currentStats.successRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span>Dédup: {metrics.totalDeduplicated}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>{currentStats.rate.toFixed(1)}/s</span>
            </div>
          </div>

          {/* Contrôles et actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-2">
              {status === 'error' && (
                <Button size="sm" onClick={handleRetryConnection}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {metrics.dryRun && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Mode Simulation
                </Badge>
              )}
              <div className="text-xs text-muted-foreground font-mono">
                ID: {batchId.slice(0, 8)}...
              </div>
            </div>
          </div>

          {/* Erreurs */}
          {metrics.errors.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">
                  {metrics.errors.length} erreur(s) détectée(s):
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {metrics.errors.slice(0, 3).map((error, index) => (
                    <div key={index} className="text-xs font-mono bg-gray-50 p-1 rounded">
                      {error}
                    </div>
                  ))}
                  {metrics.errors.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      ... et {metrics.errors.length - 3} autres erreurs
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}