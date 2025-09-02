"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Users, Star, TrendingUp, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Registration Prompt Component
 * Phase 3: Compelling signup CTA that redirects to Clerk authentication
 */
export interface RegistrationPromptProps {
  sessionToken: string;
  cvSessionId: string;
  previewData: {
    skills_found: number;
    opportunities: number;
    experience_level: string;
  };
  onBack: () => void;
}

export function RegistrationPrompt({ sessionToken, cvSessionId, previewData, onBack }: RegistrationPromptProps) {
  const router = useRouter();
  
  // Store session data in localStorage for post-signup processing
  const handleSignup = () => {
    // Store the anonymous session info for migration after signup
    if (typeof window !== 'undefined') {
      localStorage.setItem('anonymous_session_data', JSON.stringify({
        sessionToken,
        cvSessionId,
        timestamp: Date.now(),
        previewData
      }));
    }
    
    // Redirect to Clerk signup
    router.push('/sign-up');
  };

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux résultats
          </Button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-[#00C2A8]">cledger</h1>
            <span className="text-[#6B7280]">•</span>
            <span className="text-[#6B7280]">Créer votre compte</span>
          </div>
        </div>
      </header>

      {/* Registration Section */}
      <section className="flex-1 bg-[#F8FAFB] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              {/* Left Column: Value Proposition */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-[#111111]">
                    Accédez à votre analyse complète
                  </h2>
                  <p className="text-xl text-[#6B7280] leading-relaxed">
                    Créez votre compte gratuit en 30 secondes et découvrez toute la puissance de votre profil professionnel analysé par notre IA.
                  </p>
                </div>

                {/* Summary of what they've discovered */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-[#16A34A]/5 to-[#00C2A8]/5 border-l-4 border-l-[#16A34A]">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-[#111111] mb-4">Votre profil analysé :</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                        <span className="text-[#6B7280]">
                          <strong className="text-[#111111]">{previewData.skills_found}</strong> compétences identifiées
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                        <span className="text-[#6B7280]">
                          Niveau d'expérience : <strong className="text-[#111111]">{previewData.experience_level}</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                        <span className="text-[#6B7280]">
                          <strong className="text-[#111111]">{previewData.opportunities}</strong> opportunités d'emploi disponibles
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* What they'll get with account */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#111111]">Avec votre compte gratuit :</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-[#00C2A8] rounded-full mt-2"></div>
                        <span className="text-[#6B7280]">Analyse complète de toutes vos compétences détectées</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-[#00C2A8] rounded-full mt-2"></div>
                        <span className="text-[#6B7280]">Recommandations personnalisées d'offres d'emploi</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-[#00C2A8] rounded-full mt-2"></div>
                        <span className="text-[#6B7280]">Alertes automatiques pour les nouvelles opportunités</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-[#00C2A8] rounded-full mt-2"></div>
                        <span className="text-[#6B7280]">Candidature en 1 clic directement sur la plateforme</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-[#00C2A8] rounded-full mt-2"></div>
                        <span className="text-[#6B7280]">Dashboard personnalisé pour suivre vos candidatures</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Social proof */}
                <div className="text-center space-y-2">
                  <div className="flex justify-center space-x-1">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-4 w-4 fill-[#EAB308] text-[#EAB308]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#6B7280]">
                    Rejoint par <strong className="text-[#111111]">95%</strong> des utilisateurs après leur première analyse
                  </p>
                </div>
              </div>

              {/* Right Column: CTA Card */}
              <div>
                <Card className="border-0 shadow-lg bg-gradient-to-br from-[#00C2A8] to-[#00A693] text-white">
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">
                      Créer mon compte gratuit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 text-teal-100">
                        <Clock className="h-5 w-5" />
                        <span>Inscription en 30 secondes</span>
                      </div>
                      <div className="flex items-center space-x-3 text-teal-100">
                        <Users className="h-5 w-5" />
                        <span>Aucune carte bancaire requise</span>
                      </div>
                      <div className="flex items-center space-x-3 text-teal-100">
                        <TrendingUp className="h-5 w-5" />
                        <span>Accès immédiat à vos résultats</span>
                      </div>
                    </div>
                    
                    <Button 
                      size="lg" 
                      className="w-full bg-white text-[#00C2A8] hover:bg-gray-100 font-semibold shadow-lg text-lg py-6"
                      onClick={handleSignup}
                    >
                      <Users className="mr-2 h-5 w-5" />
                      Commencer maintenant
                    </Button>
                    
                    <p className="text-xs text-teal-200 text-center leading-relaxed">
                      En créant votre compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité. 
                      Vos données sont protégées et conformes RGPD.
                    </p>
                  </CardContent>
                </Card>

                {/* Alternative: Sign in */}
                <div className="text-center mt-6">
                  <p className="text-[#6B7280]">
                    Vous avez déjà un compte ?{" "}
                    <Button 
                      variant="link" 
                      className="text-[#00C2A8] hover:text-[#00A693] p-0 h-auto font-semibold"
                      onClick={() => router.push('/sign-in')}
                    >
                      Se connecter
                    </Button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}