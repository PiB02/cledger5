import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Heart, 
  Search, 
  Bell, 
  MapPin, 
  Filter,
  Clock,
  Eye,
  Trash2,
  Edit,
  Plus,
  Settings
} from "lucide-react";
import Link from "next/link";

export default async function SavedSearchesPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recherches Sauvegardées</h1>
          <p className="text-lg text-muted-foreground">
            Tes recherches favorites avec alertes automatiques
          </p>
        </div>
        <Link href="/offres">
          <Button className="bg-[#00C2A8] hover:bg-[#00A693]">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle recherche
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recherches actives</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Sauvegardées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes actives</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Notifications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux résultats</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C2A8]">0</div>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card>
        <CardContent className="text-center py-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune recherche sauvegardée</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Sauvegarde tes recherches préférées pour recevoir des alertes automatiques quand de nouvelles offres correspondent à tes critères.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/offres">
              <Button className="bg-[#00C2A8] hover:bg-[#00A693]">
                <Search className="mr-2 h-4 w-4" />
                Créer ma première recherche
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Sample Saved Search (commented out for empty state) */}
      {/* 
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tes recherches</h2>
        
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  Développeur React - Paris
                  <Badge className="bg-[#00C2A8]">
                    <Bell className="w-3 h-3 mr-1" />
                    Alerte active
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Paris et région
                  </span>
                  <span className="flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    CDI, Télétravail
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Créée il y a 2 jours
                  </span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">React</Badge>
                <Badge variant="outline">Node.js</Badge>
                <Badge variant="outline">TypeScript</Badge>
                <Badge variant="outline">CDI</Badge>
                <Badge variant="outline">Télétravail</Badge>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <strong>12 nouvelles offres</strong> depuis la dernière vérification (il y a 6h)
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    Quotidienne
                  </span>
                  <span>Score min: 75%</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Voir les résultats (12)
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      */}

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>Comment ça fonctionne</CardTitle>
          <CardDescription>
            Tire le maximum de tes recherches sauvegardées
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#00C2A8]/10 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-6 w-6 text-[#00C2A8]" />
              </div>
              <h3 className="font-medium">1. Crée ta recherche</h3>
              <p className="text-sm text-muted-foreground">
                Définis tes critères : poste, localisation, type de contrat, salaire...
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#00C2A8]/10 rounded-full flex items-center justify-center mx-auto">
                <Heart className="h-6 w-6 text-[#00C2A8]" />
              </div>
              <h3 className="font-medium">2. Sauvegarde & Alerte</h3>
              <p className="text-sm text-muted-foreground">
                Active les notifications pour être averti des nouvelles offres correspondantes
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-[#00C2A8]/10 rounded-full flex items-center justify-center mx-auto">
                <Bell className="h-6 w-6 text-[#00C2A8]" />
              </div>
              <h3 className="font-medium">3. Reçois les alertes</h3>
              <p className="text-sm text-muted-foreground">
                Email quotidien/hebdomadaire avec les nouvelles opportunités
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Fonctionnalités avancées</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-[#00C2A8]" />
                <span className="text-sm">Filtres sémantiques avec IA</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#00C2A8]" />
                <span className="text-sm">Rayon géographique personnalisé</span>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-[#00C2A8]" />
                <span className="text-sm">Alertes en temps réel</span>
              </div>
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-[#00C2A8]" />
                <span className="text-sm">Score de matching personnalisable</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}