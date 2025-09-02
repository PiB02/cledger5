"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { EnhancedProgressTracker } from "@/components/enhanced-progress-tracker";
import { PartialResultsDisplay } from "@/components/partial-results-display";

/**
 * Anonymous Upload Flow Component
 * Phase 3: Complete anonymous CV upload experience
 */
export interface AnonymousUploadFlowProps {
  onBack: () => void;
}

type FlowStep = 'upload' | 'processing' | 'results' | 'error';

interface UploadState {
  step: FlowStep;
  file: File | null;
  sessionToken: string | null;
  cvSessionId: string | null;
  error: string | null;
  uploadProgress: number;
}

export function AnonymousUploadFlow({ onBack }: AnonymousUploadFlowProps) {
  const [state, setState] = useState<UploadState>({
    step: 'upload',
    file: null,
    sessionToken: null,
    cvSessionId: null,
    error: null,
    uploadProgress: 0
  });

  // Handle file selection and upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      setState(prev => ({ ...prev, error: "Le fichier doit faire moins de 10MB" }));
      return;
    }

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setState(prev => ({ ...prev, error: "Format accepté : PDF, Word (.doc, .docx)" }));
      return;
    }

    setState(prev => ({ ...prev, file, error: null }));
    
    try {
      // Create anonymous session AND initialize upload in one call
      const browserFingerprint = `${navigator.userAgent}-${window.screen.width}x${window.screen.height}-${new Date().getTimezoneOffset()}`;
      
      const uploadInitResponse = await fetch('/api/cv/upload/init?create_anonymous_session=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          file_size: file.size,
          content_type: file.type,
          file_hash: 'auto-generated'
        })
      });

      if (!uploadInitResponse.ok) {
        throw new Error('Impossible d\'initialiser l\'upload');
      }

      const uploadInitData = await uploadInitResponse.json();
      const sessionToken = uploadInitData.session_token;
      const cvSessionId = uploadInitData.session_id; // Corrigé : l'API retourne session_id, pas cv_session_id

      setState(prev => ({ 
        ...prev, 
        sessionToken, 
        cvSessionId,
        step: 'processing',
        uploadProgress: 30
      }));

      // Upload file to Supabase storage using signed URL
      const uploadUrl = uploadInitData.upload_url;
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      setState(prev => ({ ...prev, uploadProgress: 70 }));

      // Trigger CV processing
      const processResponse = await fetch('/api/cv/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-anonymous-session-token': sessionToken
        },
        body: JSON.stringify({
          session_id: cvSessionId
        })
      });

      if (!processResponse.ok) {
        throw new Error('Erreur lors du traitement');
      }

      setState(prev => ({ ...prev, uploadProgress: 100, step: 'results' }));

    } catch (error: any) {
      console.error('Upload error:', error);
      setState(prev => ({ 
        ...prev, 
        step: 'error', 
        error: error.message || 'Une erreur s\'est produite'
      }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleRetry = () => {
    setState({
      step: 'upload',
      file: null,
      sessionToken: null,
      cvSessionId: null,
      error: null,
      uploadProgress: 0
    });
  };

  if (state.step === 'results' && state.sessionToken && state.cvSessionId) {
    return (
      <PartialResultsDisplay
        sessionToken={state.sessionToken}
        cvSessionId={state.cvSessionId}
        filename={state.file?.name || ''}
        onBack={() => setState(prev => ({ ...prev, step: 'upload' }))}
      />
    );
  }

  if (state.step === 'processing') {
    return (
      <EnhancedProgressTracker
        filename={state.file?.name || ''}
        progress={state.uploadProgress}
        onBack={onBack}
      />
    );
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-[#00C2A8]">cledger</h1>
            <span className="text-[#6B7280]">•</span>
            <span className="text-[#6B7280]">Analyse de CV gratuite</span>
          </div>
        </div>
      </header>

      {/* Upload Section */}
      <section className="flex-1 bg-[#F8FAFB] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-[#6B7280] mb-2">
                <span>Étape 1 sur 3</span>
                <span>Téléchargement</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>

            {/* Upload Card */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-[#111111]">
                  Téléchargez votre CV
                </CardTitle>
                <p className="text-[#6B7280] mt-2">
                  Notre IA va analyser votre profil en moins de 60 secondes
                </p>
              </CardHeader>
              
              <CardContent>
                {state.error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Erreur</p>
                      <p className="text-sm text-red-600">{state.error}</p>
                    </div>
                  </div>
                )}

                <div
                  {...getRootProps()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                    transition-all duration-200 hover:border-[#00C2A8] hover:bg-[#00C2A8]/5
                    ${isDragActive ? 'border-[#00C2A8] bg-[#00C2A8]/10' : 'border-[#E5E7EB]'}
                    ${state.file ? 'border-[#16A34A] bg-[#16A34A]/5' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  <div className="space-y-4">
                    {state.file ? (
                      <>
                        <div className="mx-auto w-16 h-16 bg-[#16A34A] rounded-full flex items-center justify-center text-white">
                          <CheckCircle className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-[#111111]">Fichier sélectionné</h3>
                          <p className="text-[#6B7280] mt-1">{state.file.name}</p>
                          <p className="text-sm text-[#6B7280]">
                            {(state.file.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto w-16 h-16 bg-[#00C2A8] rounded-full flex items-center justify-center text-white">
                          <Upload className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-[#111111]">
                            {isDragActive ? "Déposez votre CV ici" : "Glissez votre CV ou cliquez pour sélectionner"}
                          </h3>
                          <p className="text-[#6B7280] mt-2">
                            Formats acceptés : PDF, Word (.doc, .docx) • Max 10MB
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {state.file && (
                  <div className="mt-6">
                    <Button 
                      className="w-full bg-[#00C2A8] hover:bg-[#00A693] text-white py-3"
                      onClick={() => onDrop([state.file!])}
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      Lancer l'analyse
                    </Button>
                  </div>
                )}

                {/* Trust indicators */}
                <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-center space-x-8 text-sm text-[#6B7280]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
                      <span>Sécurisé</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
                      <span>RGPD compliant</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
                      <span>Aucune inscription</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What happens next */}
            <Card className="mt-6 border-0 bg-white/50">
              <CardContent className="pt-6">
                <h3 className="font-medium text-[#111111] mb-3">Après l'analyse :</h3>
                <ul className="space-y-2 text-sm text-[#6B7280]">
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-[#00C2A8] rounded-full mt-2"></div>
                    <span>Identification automatique de vos compétences clés</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-[#00C2A8] rounded-full mt-2"></div>
                    <span>Évaluation de votre niveau d'expérience</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 bg-[#00C2A8] rounded-full mt-2"></div>
                    <span>Aperçu des opportunités d'emploi correspondantes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}