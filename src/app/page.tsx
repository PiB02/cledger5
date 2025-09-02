import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AuthButton from "@/components/auth/auth-button";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Upload, FileText, Zap, Shield, Search, Target } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">cledger5</h1>
            <Badge variant="outline">Phase 8 Complete</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/offres">
              <Button variant="ghost">Offres d'emploi</Button>
            </Link>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost">Mon Dashboard</Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost">Admin</Button>
              </Link>
            </SignedIn>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Hero Section - Phase 10 CV Upload CTA */}
      <section className="relative bg-gradient-to-br from-[#00C2A8] via-[#00A693] to-[#008A7B] text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Télécharge ton CV et trouve les meilleurs jobs
              </h1>
              <p className="text-xl md:text-2xl text-teal-100">
                IA avancée • Analyse ROME • Matching précis • Marché français
              </p>
            </div>

            <div className="space-y-6">
              <SignedIn>
                <Link href="/cv/upload">
                  <Button size="lg" className="bg-white text-[#00C2A8] hover:bg-gray-100 px-12 py-4 text-lg font-semibold">
                    <Upload className="mr-2 h-5 w-5" />
                    Analyser mon CV maintenant
                  </Button>
                </Link>
              </SignedIn>
              
              <SignedOut>
                <div className="space-y-4">
                  <Link href="/sign-up">
                    <Button size="lg" className="bg-white text-[#00C2A8] hover:bg-gray-100 px-12 py-4 text-lg font-semibold">
                      <Upload className="mr-2 h-5 w-5" />
                      Analyser mon CV maintenant
                    </Button>
                  </Link>
                  <p className="text-sm text-teal-100">
                    Inscription gratuite • Analyse instantanée
                  </p>
                </div>
              </SignedOut>

              <div className="flex justify-center items-center gap-8 text-sm text-teal-100">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>183+ offres actives</span>
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
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Comment ça fonctionne</h2>
              <p className="text-xl text-muted-foreground">
                Processus intelligent en 3 étapes
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-[#00C2A8] rounded-full flex items-center justify-center text-white mb-4">
                    <FileText className="h-6 w-6" />
                  </div>
                  <CardTitle>1. Upload ton CV</CardTitle>
                  <CardDescription>
                    PDF ou Word • Max 10MB • Processus sécurisé
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Notre IA analyse instantanément ton profil professionnel avec le référentiel ROME français
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-[#00C2A8] rounded-full flex items-center justify-center text-white mb-4">
                    <Target className="h-6 w-6" />
                  </div>
                  <CardTitle>2. Matching intelligent</CardTitle>
                  <CardDescription>
                    Analyse sémantique • Compétences • Géolocalisation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Algorithme avancé qui trouve les offres correspondant parfaitement à ton profil et tes préférences
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-[#16A34A] rounded-full flex items-center justify-center text-white mb-4">
                    <Search className="h-6 w-6" />
                  </div>
                  <CardTitle>3. Trouve ton job</CardTitle>
                  <CardDescription>
                    Offres classées • Explications • Candidature 1-clic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Découvre les opportunités les plus pertinentes avec des explications détaillées du matching
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats & Trust Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8 md:grid-cols-4 text-center">
              <div>
                <div className="text-3xl font-bold text-[#00C2A8]">183+</div>
                <div className="text-sm text-muted-foreground">Offres actives</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#00C2A8]">95%</div>
                <div className="text-sm text-muted-foreground">Satisfaction utilisateur</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#16A34A]">&lt;60s</div>
                <div className="text-sm text-muted-foreground">Analyse CV moyenne</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#16A34A]">100%</div>
                <div className="text-sm text-muted-foreground">RGPD compliant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features for Existing Users */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold">Technologie avancée</h2>
              <p className="text-xl text-muted-foreground">
                Infrastructure moderne pour un matching optimal
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Recherche sémantique
                  </CardTitle>
                  <CardDescription>
                    Ingestion LBA et France Travail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge>LBA API</Badge>
                    <Badge>France Travail</Badge>
                    <Badge variant="secondary">Temps réel</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    IA d'analyse
                  </CardTitle>
                  <CardDescription>
                    Parsing intelligent avec GPT-4o-mini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge>OpenAI</Badge>
                    <Badge>ROME 4.0</Badge>
                    <Badge variant="secondary">Embeddings</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Matching vectoriel
                  </CardTitle>
                  <CardDescription>
                    pgvector avec index HNSW
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge>1536d vectors</Badge>
                    <Badge>Cosine similarity</Badge>
                    <Badge variant="secondary">&lt;500ms</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sécurité RGPD
                  </CardTitle>
                  <CardDescription>
                    Données chiffrées et conformes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge>EU Cloud</Badge>
                    <Badge>RLS policies</Badge>
                    <Badge variant="secondary">Chiffrement</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-4 mt-12">
              <SignedIn>
                <Link href="/offres">
                  <Button size="lg" variant="outline">
                    <Search className="mr-2 h-4 w-4" />
                    Parcourir les offres
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button size="lg" variant="ghost">
                    Administration
                  </Button>
                </Link>
              </SignedIn>
              
              <SignedOut>
                <Link href="/offres">
                  <Button size="lg" variant="outline">
                    <Search className="mr-2 h-4 w-4" />
                    Voir les offres
                  </Button>
                </Link>
              </SignedOut>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
