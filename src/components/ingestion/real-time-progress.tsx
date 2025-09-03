"use client";

import { useState, useEffect, useRef } from "react";
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
  Eye,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  TrendingUp,
  X,
  Zap
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
  dryRun: boolean;
  startTime?: string;
  endTime?: string;
  batchId?: string;
}

interface IngestionProgress {
  status: 'idle' | 'starting' | 'running' | 'completed' | 'error' | 'paused';
  stage: string;
  progress: number; // 0-100
  metrics: IngestionMetrics;
  estimatedTimeRemaining?: number;
  ratePerSecond?: number;
}

interface RealTimeProgressProps {
  title: string;
  source: 'lba' | 'ft';
  onClose?: () => void;
  batchId?: string;
  initialProgress?: Partial<IngestionProgress>;
}

export function RealTimeProgress({
  title,
  source,
  onClose,
  batchId,
  initialProgress
}: RealTimeProgressProps) {
  const [progress, setProgress] = useState<IngestionProgress>({
    status: 'idle',
    stage: 'Initialisation...',
    progress: 0,
    metrics: {
      totalFetched: 0,
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalDeduplicated: 0,
      totalErrors: 0,
      errors: [],
      dryRun: false,
    },
    ...initialProgress
  });

  const [isExpanded, setIsExpanded] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Connecter au stream SSE si un batchId est fourni
  useEffect(() => {
    if (batchId && progress.status === 'running') {
      connectToEventStream(batchId);
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [batchId, progress.status]);

  const connectToEventStream = (id: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/admin/ingest/${id}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'batch_info':
            setProgress(prev => ({
              ...prev,
              status: 'running',
              stage: 'Connexion établie...'
            }));
            startTimeRef.current = new Date();
            break;

          case 'batch_progress':
            setProgress(prev => ({
              ...prev,
              progress: data.data.progress,
              stage: data.data.message || 'Traitement en cours...',
            }));
            break;

          case 'batch_completed':
          case 'batch_finished':
            setProgress(prev => ({
              ...prev,
              status: 'completed',
              progress: 100,
              stage: 'Ingestion terminée avec succès',
            }));
            eventSource.close();
            break;

          case 'batch_error':
            setProgress(prev => ({
              ...prev,
              status: 'error',
              stage: data.data.message || 'Erreur lors du traitement',
              metrics: {
                ...prev.metrics,
                errors: [...prev.metrics.errors, data.data.error || 'Erreur inconnue']
              }
            }));
            eventSource.close();
            break;

          case 'metrics_update':
            if (data.data.metrics) {
              setProgress(prev => ({
                ...prev,
                metrics: {
                  ...prev.metrics,
                  ...data.data.metrics
                }
              }));
            }
            break;
        }
      } catch (error) {
        console.error('Erreur parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setProgress(prev => ({
        ...prev,
        status: 'error',
        stage: 'Connexion perdue'
      }));
      eventSource.close();
    };
  };

  // Calculer les statistiques dérivées
  const getStats = () => {
    const { metrics } = progress;
    const successRate = metrics.totalProcessed > 0 
      ? ((metrics.totalProcessed - metrics.totalErrors) / metrics.totalProcessed) * 100 
      : 0;
    
    const elapsedTime = startTimeRef.current 
      ? (Date.now() - startTimeRef.current.getTime()) / 1000 
      : 0;
    
    const rate = elapsedTime > 0 ? metrics.totalProcessed / elapsedTime : 0;
    
    return { successRate, elapsedTime, rate };
  };

  const stats = getStats();

  // Démarrer/reprendre le processus
  const handleStart = () => {
    setProgress(prev => ({
      ...prev,
      status: 'starting',
      stage: 'Démarrage de l\'ingestion...'
    }));
    setIsPaused(false);
    startTimeRef.current = new Date();
    
    // Simulation du démarrage (à remplacer par l'appel API réel)
    setTimeout(() => {
      setProgress(prev => ({
        ...prev,
        status: 'running',
        stage: 'Récupération des données...'
      }));
    }, 1000);
  };

  // Mettre en pause
  const handlePause = () => {
    setIsPaused(true);
    setProgress(prev => ({
      ...prev,
      status: 'paused',
      stage: 'Ingestion en pause'
    }));
  };

  // Arrêter
  const handleStop = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setProgress(prev => ({
      ...prev,
      status: 'idle',
      stage: 'Arrêtée',
      progress: 0
    }));
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'running':
      case 'starting':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'running':
      case 'starting':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
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
              {progress.status === 'starting' ? 'Démarrage' :
               progress.status === 'running' ? 'En cours' :
               progress.status === 'completed' ? 'Terminée' :
               progress.status === 'error' ? 'Erreur' :
               progress.status === 'paused' ? 'En pause' : 'Prête'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Barre de progression principale */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{progress.stage}</span>
              <span className="text-muted-foreground">{progress.progress.toFixed(1)}%</span>
            </div>
            <Progress 
              value={progress.progress} 
              className="h-2"
            />
            {progress.estimatedTimeRemaining && (
              <p className="text-xs text-muted-foreground">
                Temps restant estimé: {Math.round(progress.estimatedTimeRemaining / 60)}min
              </p>
            )}
          </div>

          <Separator />

          {/* Métriques principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress.metrics.totalFetched.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Extraites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress.metrics.totalProcessed.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Traitées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600">
                {progress.metrics.totalInserted.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Insérées</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {progress.metrics.totalErrors.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Erreurs</div>
            </div>
          </div>

          {/* Statistiques secondaires */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span>Taux réussite: {stats.successRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              <span>Dédup: {progress.metrics.totalDeduplicated}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Vitesse: {stats.rate.toFixed(1)}/s</span>
            </div>
          </div>

          {/* Contrôles */}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(progress.status === 'idle' || progress.status === 'paused') && (
                <Button size="sm" onClick={handleStart}>
                  <Play className="h-4 w-4 mr-2" />
                  {progress.status === 'paused' ? 'Reprendre' : 'Démarrer'}
                </Button>
              )}
              {progress.status === 'running' && (
                <Button size="sm" variant="outline" onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              {progress.status !== 'idle' && (
                <Button size="sm" variant="outline" onClick={handleStop}>
                  <X className="h-4 w-4 mr-2" />
                  Arrêter
                </Button>
              )}
            </div>
            
            {progress.metrics.dryRun && (
              <Badge variant="outline" className="text-xs">
                Mode Simulation
              </Badge>
            )}
          </div>

          {/* Erreurs */}
          {progress.metrics.errors.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">
                  {progress.metrics.errors.length} erreur(s) détectée(s):
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {progress.metrics.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-xs font-mono bg-gray-50 p-1 rounded">
                      {error}
                    </div>
                  ))}
                  {progress.metrics.errors.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      ... et {progress.metrics.errors.length - 5} autres erreurs
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Debug info (batchId) */}
          {batchId && (
            <div className="text-xs text-muted-foreground font-mono">
              Batch ID: {batchId}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}