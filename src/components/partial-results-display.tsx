"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, MapPin, Briefcase, Star, Lock, Users, TrendingUp, Clock } from "lucide-react";
import { RegistrationPrompt } from "@/components/registration-prompt";

/**
 * Partial Results Display Component
 * Phase 3: Limited results with compelling conversion CTA
 */
export interface PartialResultsDisplayProps {
  sessionToken: string;
  cvSessionId: string;
  filename: string;
  onBack: () => void;
}

interface PartialResults {
  success: boolean;
  session_id: string;
  access_level: 'partial';
  summary: {
    skills_found: number;
    experience_level: string;
    job_opportunities_estimated: number;
    analysis_confidence: number;
  };
  skills_preview: Array<{
    name: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  location_detected: {
    city: string;
    region: string;
  } | null;
  full_results_available: {
    complete_skills_analysis: number;
    detailed_job_matches: number;
    ai_powered_insights: boolean;
    personalized_recommendations: boolean;
  };
  call_to_action: {
    title: string;
    description: string;
    action_url: string;
    expires_at: string;
  };
  processed_at: string;
  expires_at: string;
}

export function PartialResultsDisplay({ sessionToken, cvSessionId, filename, onBack }: PartialResultsDisplayProps) {
  const [results, setResults] = useState<PartialResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Fetch partial results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(
          `/api/cv/results/anonymous?session_token=${encodeURIComponent(sessionToken)}&include_teaser_data=true`,
          { method: 'GET' }
        );

        if (response.status === 202) {
          // Still processing, wait and retry
          setTimeout(fetchResults, 3000);
          return;
        }

        if (!response.ok) {
          throw new Error('Impossible de récupérer les résultats');
        }

        const data = await response.json();
        setResults(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching results:', err);
        setError(err.message || 'Une erreur s\'est produite');
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionToken]);

  // Update countdown timer
  useEffect(() => {
    if (!results) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(results.expires_at);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expiré');
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [results]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C2A8] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Finalisation de votre analyse...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFB]">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">Une erreur s'est produite</div>
          <p className="text-[#6B7280] mb-6">{error}</p>
          <Button onClick={onBack}>Retour</Button>
        </div>
      </main>
    );
  }

  if (!results) return null;

  if (showRegistration) {
    return (
      <RegistrationPrompt
        sessionToken={sessionToken}
        cvSessionId={cvSessionId}
        previewData={{
          skills_found: results.summary.skills_found,
          opportunities: results.summary.job_opportunities_estimated,
          experience_level: results.summary.experience_level
        }}
        onBack={() => setShowRegistration(false)}
      />
    );
  }

  const confidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20';
      case 'medium': return 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20';
      default: return 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20';
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-[#00C2A8]">cledger</h1>
              <span className="text-[#6B7280]">•</span>
              <span className="text-[#6B7280]">Aperçu de vos résultats</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-[#6B7280]">
            <Clock className="h-4 w-4" />
            <span>Expire dans {timeRemaining}</span>
          </div>
        </div>
      </header>

      {/* Results Section */}
      <section className="flex-1 bg-[#F8FAFB] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-between text-sm text-[#6B7280] mb-2">
                <span>Étape 3 sur 3</span>
                <span>Analyse terminée</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>

            {/* Success Header */}
            <Card className="border-0 shadow-lg mb-8 bg-gradient-to-r from-[#16A34A]/5 to-[#00C2A8]/5 border-l-4 border-l-[#16A34A]">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-[#16A34A] rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[#111111] mb-2">
                      Excellent ! Nous avons identifié {results.summary.skills_found} compétences clés
                    </h2>
                    <p className="text-[#6B7280] mb-4">
                      Votre profil a été analysé avec succès. Voici un aperçu de ce que nous avons découvert dans <strong>{filename}</strong>.
                    </p>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
                        <span className="text-[#6B7280]">Niveau : {results.summary.experience_level}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#00C2A8] rounded-full"></div>
                        <span className="text-[#6B7280]">{results.summary.job_opportunities_estimated} opportunités disponibles</span>
                      </div>
                      {results.location_detected && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-[#6B7280]" />
                          <span className="text-[#6B7280]">{results.location_detected.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Column: Partial Results */}
              <div className="lg:col-span-2 space-y-6">
                {/* Skills Preview */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-[#111111]">Compétences identifiées</span>
                      <Badge variant="secondary" className="bg-[#00C2A8]/10 text-[#00C2A8]">
                        {results.skills_preview.length} affichées
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {results.skills_preview.map((skill, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-[#F8FAFB] rounded-lg border"
                        >
                          <span className="font-medium text-[#111111]">{skill.name}</span>
                          <Badge variant="outline" className={confidenceColor(skill.confidence)}>
                            {skill.confidence === 'high' ? 'Confirmé' : skill.confidence === 'medium' ? 'Moyen' : 'Détecté'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    
                    {/* Teaser for more skills */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-[#00C2A8]/5 to-[#00A693]/5 rounded-lg border border-[#00C2A8]/20">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-[#00C2A8]" />
                        <div>
                          <p className="font-medium text-[#111111]">
                            +{results.full_results_available.complete_skills_analysis - results.skills_preview.length} compétences supplémentaires détectées
                          </p>
                          <p className="text-sm text-[#6B7280]">
                            Créez votre compte gratuit pour voir l'analyse complète
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Summary */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#111111]">Aperçu de votre profil</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#00C2A8]/10 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-[#00C2A8]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#111111]">Niveau d'expérience</p>
                          <p className="text-[#6B7280]">{results.summary.experience_level}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#16A34A]/10 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-[#16A34A]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#111111]">Confiance IA</p>
                          <p className="text-[#6B7280]">{Math.round(results.summary.analysis_confidence * 100)}% de précision</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#EAB308]/10 rounded-lg flex items-center justify-center">
                          <Star className="h-5 w-5 text-[#EAB308]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#111111]">Opportunités</p>
                          <p className="text-[#6B7280]">{results.summary.job_opportunities_estimated} offres compatibles</p>
                        </div>
                      </div>

                      {results.location_detected && (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-[#DC2626]/10 rounded-lg flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-[#DC2626]" />
                          </div>
                          <div>
                            <p className="font-medium text-[#111111]">Localisation</p>
                            <p className="text-[#6B7280]">{results.location_detected.city}, {results.location_detected.region}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Conversion CTA */}
              <div className="space-y-6">
                {/* Main CTA Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-br from-[#00C2A8] to-[#00A693] text-white">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {results.call_to_action.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-teal-100 mb-6 leading-relaxed">
                      {results.call_to_action.description}
                    </p>
                    
                    <Button 
                      size="lg" 
                      className="w-full bg-white text-[#00C2A8] hover:bg-gray-100 font-semibold shadow-lg"
                      onClick={() => setShowRegistration(true)}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Créer mon compte gratuit
                    </Button>
                    
                    <p className="text-xs text-teal-200 mt-3 text-center">
                      Inscription en 30 secondes • Aucune carte requise
                    </p>
                  </CardContent>
                </Card>

                {/* What you'll get */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#111111]">Avec votre compte gratuit :</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-[#16A34A] mt-0.5" />
                        <span className="text-[#6B7280]">
                          <strong className="text-[#111111]">{results.full_results_available.complete_skills_analysis}</strong> compétences détaillées
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-[#16A34A] mt-0.5" />
                        <span className="text-[#6B7280]">
                          <strong className="text-[#111111]">{results.full_results_available.detailed_job_matches}</strong> offres d'emploi personnalisées
                        </span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-[#16A34A] mt-0.5" />
                        <span className="text-[#6B7280]">Recommandations IA personnalisées</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-[#16A34A] mt-0.5" />
                        <span className="text-[#6B7280]">Alertes automatiques nouvelles offres</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-[#16A34A] mt-0.5" />
                        <span className="text-[#6B7280]">Candidature en 1 clic</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Proof */}
                <Card className="border-0 shadow-lg bg-[#F8FAFB]">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="flex justify-center space-x-1">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className="h-4 w-4 fill-[#EAB308] text-[#EAB308]" />
                        ))}
                      </div>
                      <p className="text-sm text-[#6B7280]">
                        <strong className="text-[#111111]">95%</strong> des utilisateurs recommandent cledger
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        "Interface intuitive, résultats précis"
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}