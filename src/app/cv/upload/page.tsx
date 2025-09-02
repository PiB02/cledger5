'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Brain, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CVUploadInitRequest, CVUploadInitResponse, CVProcessingProgress } from "@cledger5/types/cv";

interface ProcessingStage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  details?: string;
}

export default function CVUploadPage() {
  const { user } = useUser();
  const router = useRouter();
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Processing state
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Processing stages
  const [stages, setStages] = useState<ProcessingStage[]>([
    {
      id: 'validation',
      title: 'Validation du fichier',
      description: 'Vérification du format et de la sécurité',
      icon: <CheckCircle className="h-5 w-5" />,
      status: 'pending',
      progress: 0
    },
    {
      id: 'extraction',
      title: 'Extraction du contenu',
      description: 'Lecture et analyse du PDF/Word',
      icon: <FileText className="h-5 w-5" />,
      status: 'pending',
      progress: 0
    },
    {
      id: 'ai_analysis',
      title: 'Analyse IA',
      description: 'GPT-4o-mini extrait votre profil professionnel',
      icon: <Brain className="h-5 w-5" />,
      status: 'pending',
      progress: 0,
      details: 'Détection des compétences, expérience, ROME codes...'
    },
    {
      id: 'skills_mapping',
      title: 'Mapping des compétences',
      description: 'Normalisation et classification ROME',
      icon: <Target className="h-5 w-5" />,
      status: 'pending',
      progress: 0,
      details: 'Correspondance avec le référentiel français'
    },
    {
      id: 'embedding',
      title: 'Génération des embeddings',
      description: 'Préparation du matching vectoriel',
      icon: <Zap className="h-5 w-5" />,
      status: 'pending',
      progress: 0,
      details: 'Compatible avec 183+ offres d\'emploi'
    },
    {
      id: 'profile_creation',
      title: 'Création du profil',
      description: 'Finalisation de votre profil candidat',
      icon: <CheckCircle className="h-5 w-5" />,
      status: 'pending',
      progress: 0
    }
  ]);

  // File drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && validateFile(file)) {
      setFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setFile(file);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (file.size > maxSize) {
      setError('Le fichier ne peut pas dépasser 10MB');
      return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
      setError('Seuls les fichiers PDF et Word (.docx) sont acceptés');
      return false;
    }
    
    setError(null);
    return true;
  };

  // Calculate file hash (SHA-256)
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Handle upload process
  const handleUpload = async () => {
    if (!file || !acceptedTerms || !user) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Calculate file hash and initialize upload
      const fileHash = await calculateFileHash(file);
      
      const initRequest: CVUploadInitRequest = {
        filename: file.name,
        file_size: file.size,
        file_hash: fileHash,
        content_type: file.type as any
      };

      const initResponse = await fetch('/api/cv/upload/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(initRequest),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.message || 'Erreur lors de l\'initialisation de l\'upload');
      }

      const initData: CVUploadInitResponse = await initResponse.json();
      setSessionId(initData.session_id);

      // Update first stage to processing
      setStages(prev => prev.map(stage => 
        stage.id === 'validation' 
          ? { ...stage, status: 'processing', progress: 50 }
          : stage
      ));

      // Step 2: Upload file to signed URL
      const uploadResponse = await fetch(initData.upload_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload du fichier');
      }

      // Complete validation stage
      setStages(prev => prev.map(stage => 
        stage.id === 'validation' 
          ? { ...stage, status: 'completed', progress: 100 }
          : stage
      ));

      // Step 3: Start SSE stream for processing updates
      startProcessingStream(initData.session_id);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
      setIsUploading(false);
    }
  };

  // Start Server-Sent Events stream for processing updates
  const startProcessingStream = (sessionId: string) => {
    const eventSource = new EventSource(`/api/cv/process/${sessionId}/stream`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (event.type === 'progress') {
        updateProcessingProgress(data);
      }
    };

    eventSource.addEventListener('completed', (event) => {
      const data = JSON.parse(event.data);
      
      // Mark all stages as completed
      setStages(prev => prev.map(stage => ({
        ...stage,
        status: 'completed',
        progress: 100
      })));
      
      setUploadProgress(100);
      eventSource.close();
      
      // Redirect to profile after short delay
      setTimeout(() => {
        router.push('/profile?newCV=true');
      }, 2000);
    });

    eventSource.addEventListener('failed', (event) => {
      const data = JSON.parse(event.data);
      setError(data.errorMessage || 'Erreur lors du traitement');
      setIsUploading(false);
      eventSource.close();
    });

    eventSource.onerror = () => {
      setError('Connexion perdue. Rechargez la page pour vérifier le statut.');
      setIsUploading(false);
      eventSource.close();
    };
  };

  const updateProcessingProgress = (progress: CVProcessingProgress) => {
    setUploadProgress(progress.overall_progress);
    
    // Update stages based on server progress
    setStages(prev => prev.map(stage => {
      const serverStage = progress.stages.find(s => s.stage_name.toLowerCase().includes(stage.id));
      
      if (serverStage) {
        return {
          ...stage,
          status: serverStage.status as any,
          progress: serverStage.progress_percentage
        };
      }
      
      return stage;
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Analysez votre CV</h1>
        <p className="text-xl text-muted-foreground">
          Notre IA va analyser votre profil en moins de 60 secondes
        </p>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <Badge variant="outline">PDF et Word supportés</Badge>
          <Badge variant="outline">Max 10MB</Badge>
          <Badge variant="outline">Sécurisé RGPD</Badge>
        </div>
      </div>

      {!isUploading && !sessionId && (
        <>
          {/* File Upload Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Téléchargement du CV
              </CardTitle>
              <CardDescription>
                Glissez-déposez votre CV ou cliquez pour sélectionner un fichier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300",
                  file ? "border-green-500 bg-green-50" : ""
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileSelect}
                />
                
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    <p className="text-lg font-medium text-green-700">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <Button variant="outline" onClick={() => setFile(null)}>
                      Changer de fichier
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-lg">Glissez votre CV ici ou cliquez pour sélectionner</p>
                    <p className="text-sm text-muted-foreground">
                      PDF ou Word • Maximum 10MB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Terms and Conditions */}
          {file && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      J'accepte les conditions générales d'utilisation
                    </label>
                    <p className="text-xs text-muted-foreground">
                      En cochant cette case, j'autorise le traitement de mes données personnelles conformément au RGPD.{' '}
                      <a href="/legal/cgu" className="underline hover:text-primary">
                        Lire les CGU
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload Button */}
          {file && acceptedTerms && (
            <div className="text-center">
              <Button size="lg" onClick={handleUpload} className="px-8 py-3">
                <Upload className="mr-2 h-5 w-5" />
                Analyser mon CV maintenant
              </Button>
            </div>
          )}
        </>
      )}

      {/* Processing View */}
      {isUploading && (
        <div className="space-y-6">
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyse en cours...
              </CardTitle>
              <CardDescription>
                Notre IA traite votre CV professionnel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression globale</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Temps estimé: {Math.max(5, 60 - Math.floor(uploadProgress * 0.6))} secondes restantes
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stages */}
          <div className="grid gap-4">
            {stages.map((stage, index) => (
              <Card key={stage.id} className={cn(
                "transition-all",
                stage.status === 'processing' && "ring-2 ring-blue-500",
                stage.status === 'completed' && "border-green-500"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full",
                      stage.status === 'pending' && "bg-gray-100 text-gray-400",
                      stage.status === 'processing' && "bg-blue-100 text-blue-600",
                      stage.status === 'completed' && "bg-green-100 text-green-600",
                      stage.status === 'failed' && "bg-red-100 text-red-600"
                    )}>
                      {stage.status === 'processing' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        stage.icon
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{stage.title}</h3>
                        <span className="text-sm text-muted-foreground">
                          {stage.progress}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                      {stage.details && stage.status === 'processing' && (
                        <p className="text-xs text-blue-600 mt-1">
                          {stage.details}
                        </p>
                      )}
                      
                      {stage.status !== 'pending' && (
                        <Progress 
                          value={stage.progress} 
                          className="h-1 mt-2" 
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Educational Content */}
          <Card className="bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                Que se passe-t-il pendant l'analyse ?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Extraction automatique des compétences et de l'expérience</li>
                <li>• Classification selon le référentiel ROME français</li>
                <li>• Génération d'un profil compatible avec 183+ offres d'emploi</li>
                <li>• Préparation du matching sémantique personnalisé</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}