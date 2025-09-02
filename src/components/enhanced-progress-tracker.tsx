"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, FileText, Brain, Target, Zap, CheckCircle, Loader2 } from "lucide-react";

/**
 * Enhanced Progress Tracker Component
 * Phase 3: Educational content during 30-60s CV processing
 */
export interface EnhancedProgressTrackerProps {
  filename: string;
  progress: number;
  onBack: () => void;
}

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: number; // seconds
  completed: boolean;
}

export function EnhancedProgressTracker({ filename, progress, onBack }: EnhancedProgressTrackerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'upload',
      title: 'Téléchargement sécurisé',
      description: 'Votre CV est téléchargé de manière sécurisée sur nos serveurs européens conformes RGPD.',
      icon: <FileText className="h-5 w-5" />,
      duration: 3,
      completed: true
    },
    {
      id: 'extraction',
      title: 'Extraction intelligente',
      description: 'Notre IA analyse votre CV et extrait automatiquement vos compétences, expériences et qualifications.',
      icon: <Brain className="h-5 w-5" />,
      duration: 15,
      completed: false
    },
    {
      id: 'rome-mapping',
      title: 'Classification ROME',
      description: 'Vos compétences sont mappées selon le référentiel ROME français pour un matching optimal.',
      icon: <Target className="h-5 w-5" />,
      duration: 12,
      completed: false
    },
    {
      id: 'semantic-analysis',
      title: 'Analyse sémantique',
      description: 'Génération d\'embeddings vectoriels pour une recherche d\'emploi ultra-précise et personnalisée.',
      icon: <Zap className="h-5 w-5" />,
      duration: 10,
      completed: false
    }
  ]);

  // Educational tips that rotate during processing
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const educationalTips = [
    {
      title: "Le référentiel ROME",
      content: "ROME (Répertoire Opérationnel des Métiers et des Emplois) est la classification officielle française des métiers. Il nous permet de matcher précisément vos compétences avec les opportunités du marché."
    },
    {
      title: "IA & Matching sémantique",
      content: "Notre technologie utilise des embeddings vectoriels pour comprendre le sens de vos compétences, pas seulement les mots-clés. Cela permet un matching plus intelligent et pertinent."
    },
    {
      title: "Données temps réel",
      content: "Nous analysons en continu les offres de La Bonne Alternance et France Travail pour vous proposer les opportunités les plus récentes et pertinentes."
    },
    {
      title: "Confidentialité garantie",
      content: "Vos données sont chiffrées et stockées sur des serveurs européens. Conformément au RGPD, vous gardez le contrôle total sur vos informations personnelles."
    }
  ];

  // Timer effect for progression
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update steps based on elapsed time
  useEffect(() => {
    let cumulativeDuration = 0;
    const updatedSteps = steps.map((step, index) => {
      cumulativeDuration += step.duration;
      const isCompleted = elapsedTime >= cumulativeDuration;
      return { ...step, completed: isCompleted };
    });

    setSteps(updatedSteps);

    // Update current step index
    const currentIndex = updatedSteps.findIndex(step => !step.completed);
    setCurrentStepIndex(currentIndex === -1 ? updatedSteps.length - 1 : currentIndex);
  }, [elapsedTime]);

  // Rotate educational tips
  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % educationalTips.length);
    }, 8000); // Change tip every 8 seconds

    return () => clearInterval(tipTimer);
  }, []);

  const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
  const progressPercentage = Math.min((elapsedTime / totalDuration) * 100, 100);

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-[#00C2A8]">cledger</h1>
            <span className="text-[#6B7280]">•</span>
            <span className="text-[#6B7280]">Analyse en cours...</span>
          </div>
        </div>
      </header>

      {/* Processing Section */}
      <section className="flex-1 bg-[#F8FAFB] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-[#6B7280] mb-2">
                <span>Étape 2 sur 3</span>
                <span>{Math.round(progressPercentage)}% • {elapsedTime}s</span>
              </div>
              <Progress value={33 + (progressPercentage * 0.33)} className="h-2" />
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {/* Processing Steps */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#00C2A8] rounded-full flex items-center justify-center text-white">
                      <Brain className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[#111111]">Analyse de</span>
                      <span className="text-[#6B7280] text-sm block">{filename}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {steps.map((step, index) => (
                      <div
                        key={step.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                          step.completed
                            ? 'bg-[#16A34A]/10'
                            : index === currentStepIndex
                            ? 'bg-[#00C2A8]/10 border border-[#00C2A8]/20'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? 'bg-[#16A34A] text-white' 
                            : index === currentStepIndex
                            ? 'bg-[#00C2A8] text-white'
                            : 'bg-[#E5E7EB] text-[#6B7280]'
                        }`}>
                          {step.completed ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : index === currentStepIndex ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium ${
                            step.completed || index === currentStepIndex 
                              ? 'text-[#111111]' 
                              : 'text-[#6B7280]'
                          }`}>
                            {step.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            step.completed || index === currentStepIndex 
                              ? 'text-[#6B7280]' 
                              : 'text-[#9CA3AF]'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Educational Content */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#111111]">
                    Le saviez-vous ?
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-[#00C2A8]/5 to-[#00A693]/5 rounded-lg border border-[#00C2A8]/10">
                      <h3 className="font-semibold text-[#111111] mb-2">
                        {educationalTips[currentTipIndex].title}
                      </h3>
                      <p className="text-sm text-[#6B7280] leading-relaxed">
                        {educationalTips[currentTipIndex].content}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-[#111111]">Technologie utilisée :</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#00C2A8] rounded-full"></div>
                          <span className="text-[#6B7280]">OpenAI GPT-4o</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#00C2A8] rounded-full"></div>
                          <span className="text-[#6B7280]">Embeddings vectoriels</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#00C2A8] rounded-full"></div>
                          <span className="text-[#6B7280]">ROME 4.0</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#00C2A8] rounded-full"></div>
                          <span className="text-[#6B7280]">Sécurité EU</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E5E7EB]">
                      <p className="text-xs text-[#9CA3AF]">
                        Temps d'analyse moyen : 45-60 secondes • Votre CV ne sera pas stocké sans votre autorisation
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* What's next preview */}
            <Card className="mt-8 border-0 bg-white/70">
              <CardContent className="pt-6">
                <h3 className="font-medium text-[#111111] mb-4">Prochaine étape : Vos résultats personnalisés</h3>
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#00C2A8]/10 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 text-[#00C2A8]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#111111]">Compétences identifiées</p>
                      <p className="text-[#6B7280]">Liste de vos compétences clés détectées</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#00C2A8]/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-[#00C2A8]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#111111]">Niveau d'expérience</p>
                      <p className="text-[#6B7280]">Évaluation automatique de votre séniorité</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-[#16A34A]/10 rounded-lg flex items-center justify-center">
                      <Zap className="h-4 w-4 text-[#16A34A]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#111111]">Opportunités</p>
                      <p className="text-[#6B7280]">Aperçu des postes correspondants</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}