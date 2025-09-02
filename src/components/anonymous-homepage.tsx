"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthButton from "@/components/auth/auth-button";
import Link from "next/link";
import { useState } from "react";
import { Upload, FileText, Zap, Shield, Search, Target, ChevronRight, Star } from "lucide-react";
import { AnonymousUploadFlow } from "@/components/anonymous-upload-flow";

/**
 * Anonymous Homepage Component
 * Phase 3: "Try before you buy" experience for anonymous users
 */
export function AnonymousHomepage() {
  const [showUploadFlow, setShowUploadFlow] = useState(false);

  if (showUploadFlow) {
    return <AnonymousUploadFlow onBack={() => setShowUploadFlow(false)} />;
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-[#00C2A8]">cledger</h1>
            <Badge variant="outline" className="text-[#00C2A8] border-[#00C2A8]">Next-gen recruitment</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/offres">
              <Button variant="ghost" className="text-[#6B7280] hover:text-[#111111]">
                Offres d'emploi
              </Button>
            </Link>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero Section - Anonymous CTA */}
      <section className="relative bg-gradient-to-br from-[#00C2A8] via-[#00A693] to-[#008A7B] text-white">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Trust indicators */}
            <div className="flex justify-center items-center gap-6 text-sm text-teal-100 mb-6">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current" />
                <span>95% satisfaction</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4" />
                <span>RGPD compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                <span>Gratuit</span>
              </div>
            </div>

            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                Analysez votre CV en
                <span className="block text-white/90">30 secondes - Gratuit</span>
              </h1>
              <p className="text-xl md:text-2xl text-teal-100 max-w-3xl mx-auto">
                Notre IA analyse instantanément votre profil et trouve les opportunités parfaitement adaptées. 
                Aucune inscription requise pour commencer.
              </p>
            </div>

            {/* Primary CTA */}
            <div className="space-y-6">
              <Button 
                size="lg" 
                className="bg-white text-[#00C2A8] hover:bg-gray-100 px-12 py-6 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => setShowUploadFlow(true)}
              >
                <Upload className="mr-3 h-6 w-6" />
                Analysez votre CV maintenant
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-sm text-teal-100">
                PDF ou Word • Max 10MB • Résultats instantanés • Aucune inscription
              </p>
            </div>

            {/* Social proof */}
            <div className="flex justify-center items-center gap-12 text-sm text-teal-100 mt-12">
              <div className="text-center">
                <div className="text-2xl font-bold">183+</div>
                <div>Offres actives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">&lt;60s</div>
                <div>Analyse moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">100%</div>
                <div>Sécurisé</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Anonymous Focus */}
      <section className="py-20 bg-[#F8FAFB]">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#111111]">Comment ça fonctionne</h2>
              <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
                Découvrez votre potentiel professionnel en 3 étapes simples
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-[#00C2A8] rounded-full flex items-center justify-center text-white mb-6">
                    <FileText className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl text-[#111111]">1. Téléchargez votre CV</CardTitle>
                  <CardDescription className="text-[#6B7280]">
                    Glissez-déposez votre CV • Aucun compte requis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#6B7280]">
                    Notre IA analyse instantanément votre expérience, vos compétences et votre profil professionnel selon les standards français ROME
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-[#00C2A8] rounded-full flex items-center justify-center text-white mb-6">
                    <Target className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl text-[#111111]">2. Aperçu des résultats</CardTitle>
                  <CardDescription className="text-[#6B7280]">
                    Compétences détectées • Niveau d'expérience • Opportunités
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#6B7280]">
                    Découvrez un aperçu de votre analyse : compétences identifiées, opportunités disponibles et votre potentiel sur le marché de l'emploi
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="mx-auto w-16 h-16 bg-[#16A34A] rounded-full flex items-center justify-center text-white mb-6">
                    <Search className="h-8 w-8" />
                  </div>
                  <CardTitle className="text-xl text-[#111111]">3. Accès complet</CardTitle>
                  <CardDescription className="text-[#6B7280]">
                    Inscription gratuite • Matching précis • Candidature 1-clic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#6B7280]">
                    Créez votre compte gratuit pour accéder à l'analyse complète, aux recommendations personnalisées et postuler directement
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Trust Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold text-[#111111]">Technologie de pointe</h2>
              <p className="text-xl text-[#6B7280]">
                IA avancée pour un matching optimal
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[#111111]">
                    <div className="w-10 h-10 bg-[#00C2A8]/10 rounded-lg flex items-center justify-center">
                      <Search className="h-5 w-5 text-[#00C2A8]" />
                    </div>
                    Recherche sémantique
                  </CardTitle>
                  <CardDescription className="text-[#6B7280]">
                    Données LBA et France Travail en temps réel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-[#00C2A8]/10 text-[#00C2A8] border-0">LBA API</Badge>
                    <Badge variant="secondary" className="bg-[#00C2A8]/10 text-[#00C2A8] border-0">France Travail</Badge>
                    <Badge variant="secondary" className="bg-[#E5E7EB] text-[#6B7280] border-0">Temps réel</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[#111111]">
                    <div className="w-10 h-10 bg-[#00C2A8]/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[#00C2A8]" />
                    </div>
                    IA d'analyse
                  </CardTitle>
                  <CardDescription className="text-[#6B7280]">
                    Parsing intelligent avec GPT-4o-mini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-[#00C2A8]/10 text-[#00C2A8] border-0">OpenAI</Badge>
                    <Badge variant="secondary" className="bg-[#00C2A8]/10 text-[#00C2A8] border-0">ROME 4.0</Badge>
                    <Badge variant="secondary" className="bg-[#E5E7EB] text-[#6B7280] border-0">Embeddings</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[#111111]">
                    <div className="w-10 h-10 bg-[#16A34A]/10 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-[#16A34A]" />
                    </div>
                    Matching vectoriel
                  </CardTitle>
                  <CardDescription className="text-[#6B7280]">
                    pgvector avec index HNSW
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-[#16A34A]/10 text-[#16A34A] border-0">1536d vectors</Badge>
                    <Badge variant="secondary" className="bg-[#16A34A]/10 text-[#16A34A] border-0">Cosine similarity</Badge>
                    <Badge variant="secondary" className="bg-[#E5E7EB] text-[#6B7280] border-0">&lt;500ms</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-[#111111]">
                    <div className="w-10 h-10 bg-[#DC2626]/10 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-[#DC2626]" />
                    </div>
                    Sécurité RGPD
                  </CardTitle>
                  <CardDescription className="text-[#6B7280]">
                    Données chiffrées et conformes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-[#DC2626]/10 text-[#DC2626] border-0">EU Cloud</Badge>
                    <Badge variant="secondary" className="bg-[#DC2626]/10 text-[#DC2626] border-0">RLS policies</Badge>
                    <Badge variant="secondary" className="bg-[#E5E7EB] text-[#6B7280] border-0">Chiffrement</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Secondary CTA */}
            <div className="text-center mt-16">
              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="bg-[#00C2A8] hover:bg-[#00A693] text-white px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => setShowUploadFlow(true)}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Commencez votre analyse gratuite
                </Button>
                <p className="text-sm text-[#6B7280]">
                  Essayez sans engagement • Résultats en moins d'une minute
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}