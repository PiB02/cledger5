import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AuthButton from "@/components/auth/auth-button";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

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
              <Link href="/admin">
                <Button variant="ghost">Admin</Button>
              </Link>
            </SignedIn>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Plateforme de matching emploi intelligente
            </h1>
            <p className="text-xl text-muted-foreground">
              IA avancée • Recherche sémantique • Matching vectoriel
            </p>
            <SignedOut>
              <p className="text-sm text-muted-foreground">
                Connectez-vous pour accéder à toutes les fonctionnalités
              </p>
            </SignedOut>
          </div>

        <Separator />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>🔍 Recherche d'offres</CardTitle>
              <CardDescription>
                Ingestion depuis LBA et France Travail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>LBA</Badge>
                <Badge>France Travail</Badge>
                <Badge variant="secondary">5-20 req/s</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📄 Analyse de CV</CardTitle>
              <CardDescription>
                Parsing IA avec GPT-4o-mini
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>PDF</Badge>
                <Badge>OpenAI</Badge>
                <Badge variant="secondary">Embeddings</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎯 Matching vectoriel</CardTitle>
              <CardDescription>
                pgvector avec index HNSW
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>1536d</Badge>
                <Badge>Cosine</Badge>
                <Badge variant="secondary">&lt;500ms p95</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔒 Sécurité RGPD</CardTitle>
              <CardDescription>
                PII chiffrée avec pgcrypto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>RLS</Badge>
                <Badge>Double opt-in</Badge>
                <Badge variant="secondary">EU only</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

          <div className="flex justify-center gap-4">
            <SignedOut>
              <Link href="/sign-up">
                <Button size="lg">
                  Créer un compte
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Se connecter
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/offres">
                <Button size="lg">
                  Rechercher des offres
                </Button>
              </Link>
              <Link href="/admin">
                <Button size="lg" variant="outline">
                  Administration
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </div>
    </main>
  );
}
