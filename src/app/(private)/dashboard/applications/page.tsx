import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  MapPin,
  Building,
  Calendar,
  ExternalLink,
  Plus
} from "lucide-react";
import Link from "next/link";

export default async function ApplicationsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mes Candidatures</h1>
          <p className="text-lg text-muted-foreground">
            Suivi de toutes tes candidatures
          </p>
        </div>
        <Link href="/offres">
          <Button className="bg-[#00C2A8] hover:bg-[#00A693]">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle candidature
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Candidatures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-muted-foreground">Positif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusées</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">0</div>
            <p className="text-xs text-muted-foreground">Négatif</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">Toutes (0)</TabsTrigger>
          <TabsTrigger value="applied">Postulées (0)</TabsTrigger>
          <TabsTrigger value="interview">Entretiens (0)</TabsTrigger>
          <TabsTrigger value="offer">Offres (0)</TabsTrigger>
          <TabsTrigger value="rejected">Refusées (0)</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Empty State */}
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucune candidature pour le moment</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Tu n'as pas encore postulé à d'offres. Commence par explorer les opportunités disponibles et trouve le job parfait pour toi.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/offres">
                  <Button className="bg-[#00C2A8] hover:bg-[#00A693]">
                    <Send className="mr-2 h-4 w-4" />
                    Explorer les offres
                  </Button>
                </Link>
                <Link href="/cv/upload">
                  <Button variant="outline">
                    <FileText className="mr-2 h-4 w-4" />
                    Analyser mon CV d'abord
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Sample Application (commented out for empty state) */}
          {/* 
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    Développeur Full-Stack React/Node.js
                    <Badge>Postulée</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      TechCorp
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Paris (75)
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Il y a 2 jours
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Status:</span>
                  <Badge variant="outline" className="text-yellow-600">
                    <Clock className="w-3 h-3 mr-1" />
                    En attente de réponse
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Candidature envoyée le 31 août 2025 • Score de matching: 92%
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Prochaine étape: Attendre la réponse RH
                  </span>
                  <Button variant="outline" size="sm">
                    Voir les détails
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          */}
        </TabsContent>

        <TabsContent value="applied">
          <Card>
            <CardContent className="text-center py-12">
              <Send className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">Aucune candidature postulée</h3>
              <p className="text-sm text-muted-foreground">
                Tes candidatures envoyées apparaîtront ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interview">
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">Aucun entretien programmé</h3>
              <p className="text-sm text-muted-foreground">
                Tes entretiens programmés apparaîtront ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offer">
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">Aucune offre reçue</h3>
              <p className="text-sm text-muted-foreground">
                Les offres d'emploi reçues apparaîtront ici
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardContent className="text-center py-12">
              <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">Aucune candidature refusée</h3>
              <p className="text-sm text-muted-foreground">
                Continue tes efforts, le bon job t'attend !
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Tips */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Conseils pour optimiser tes candidatures</CardTitle>
          <CardDescription>
            Maximise tes chances de décrocher le job parfait
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-[#00C2A8] mt-0.5" />
            <div>
              <h4 className="font-medium">Analyse ton CV</h4>
              <p className="text-sm text-muted-foreground">
                Notre IA optimise ton profil selon les critères ROME pour un meilleur matching.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Eye className="h-5 w-5 text-[#00C2A8] mt-0.5" />
            <div>
              <h4 className="font-medium">Personnalise tes candidatures</h4>
              <p className="text-sm text-muted-foreground">
                Utilise les explications de matching pour adapter ta lettre de motivation.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-[#00C2A8] mt-0.5" />
            <div>
              <h4 className="font-medium">Active les alertes</h4>
              <p className="text-sm text-muted-foreground">
                Reçois des notifications pour les nouvelles offres correspondant à ton profil.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}