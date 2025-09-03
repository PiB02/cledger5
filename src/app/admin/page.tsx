import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Building2, 
  TrendingUp, 
  Download, 
  Brain,
  Zap,
  Activity,
  Monitor
} from "lucide-react";
import Link from "next/link";
import BatchMonitor from "@/components/admin/batch-monitor";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble de la plateforme cledger5
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offres</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">598,279</div>
            <p className="text-xs text-muted-foreground">
              +2,345 cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">
              +156 cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entreprises</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,421</div>
            <p className="text-xs text-muted-foreground">
              +89 cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matchs IA</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87,234</div>
            <p className="text-xs text-muted-foreground">
              +1,245 cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-orange-500" />
              Ingestion de Données
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importer des offres depuis LBA et France Travail
            </p>
            <div className="flex gap-2">
              <Link href="/admin/ingestion">
                <Button size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Lancer l'ingestion
                </Button>
              </Link>
              <Badge variant="outline">Auto: 6h</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-green-500" />
              Monitoring Batches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Suivi temps réel des processus d'ingestion
            </p>
            <div className="flex gap-2">
              <Link href="/admin/batches">
                <Button size="sm" variant="outline">
                  <Monitor className="h-4 w-4 mr-2" />
                  Voir les batches
                </Button>
              </Link>
              <Badge variant="secondary">3 actifs</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Enrichissement IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Analyser et enrichir les offres avec GPT-4o-mini
            </p>
            <div className="flex gap-2">
              <Link href="/admin/enrichment">
                <Button size="sm" variant="outline">
                  <Brain className="h-4 w-4 mr-2" />
                  Enrichir les offres
                </Button>
              </Link>
              <Badge variant="secondary">1,247 en attente</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Embeddings Vector
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Générer les embeddings pour le matching sémantique
            </p>
            <div className="flex gap-2">
              <Link href="/admin/embeddings">
                <Button size="sm" variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Mettre à jour
                </Button>
              </Link>
              <Badge variant="secondary">543 à traiter</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-500" />
            État du Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Base de données</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Opérationnel
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API France Travail</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connecté
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">API LBA</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Connecté
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}