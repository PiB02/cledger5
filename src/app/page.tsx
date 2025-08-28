import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            cledger5
          </h1>
          <p className="text-xl text-muted-foreground">
            Plateforme de matching emploi intelligente
          </p>
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
          <Button size="lg">
            Commencer
          </Button>
          <Button size="lg" variant="outline">
            Documentation
          </Button>
        </div>
      </div>
    </main>
  );
}
