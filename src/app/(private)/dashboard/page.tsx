import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Search, 
  FileText, 
  Heart, 
  Bell, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">Bienvenue sur cledger5</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Ton tableau de bord personnel pour trouver le job parfait
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#00C2A8]/20 hover:border-[#00C2A8]/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyser mon CV</CardTitle>
            <Upload className="h-4 w-4 text-[#00C2A8]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C2A8]">Nouveau</div>
            <p className="text-xs text-muted-foreground">
              IA + ROME + Matching
            </p>
            <Link href="/cv/upload">
              <Button size="sm" className="w-full mt-3 bg-[#00C2A8] hover:bg-[#00A693]">
                Commencer
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechercher</CardTitle>
            <Search className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">183+</div>
            <p className="text-xs text-muted-foreground">
              Offres actives
            </p>
            <Link href="/offres">
              <Button variant="outline" size="sm" className="w-full mt-3">
                Explorer
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Candidatures</CardTitle>
            <FileText className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              En cours
            </p>
            <Link href="/dashboard/applications">
              <Button variant="outline" size="sm" className="w-full mt-3">
                Voir tout
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recherches</CardTitle>
            <Heart className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Sauvegardées
            </p>
            <Link href="/dashboard/saved-searches">
              <Button variant="outline" size="sm" className="w-full mt-3">
                Gérer
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Current Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Status de ton profil
            </CardTitle>
            <CardDescription>
              Complète ton profil pour augmenter tes chances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Compte créé</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">CV non analysé</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-muted-foreground">Préférences à définir</span>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Link href="/cv/upload">
                <Button size="sm" className="bg-[#00C2A8] hover:bg-[#00A693]">
                  Analyser CV
                </Button>
              </Link>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm">
                  Profil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activité récente
            </CardTitle>
            <CardDescription>
              Tes dernières actions sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-[#00C2A8] rounded-full"></div>
                <span>Inscription réussie</span>
                <span className="text-muted-foreground ml-auto">Maintenant</span>
              </div>
              <div className="text-sm text-muted-foreground text-center py-4">
                Commence par analyser ton CV pour voir plus d'activité
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Prochaines étapes recommandées
          </CardTitle>
          <CardDescription>
            Pour maximiser tes chances de trouver le job parfait
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-[#00C2A8]/5 rounded-lg">
            <Upload className="h-5 w-5 text-[#00C2A8] mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold">Analyser ton CV</h4>
              <p className="text-sm text-muted-foreground">
                Notre IA analysera ton profil et identifiera tes compétences selon le référentiel ROME français.
              </p>
              <Link href="/cv/upload">
                <Button size="sm" className="mt-2 bg-[#00C2A8] hover:bg-[#00A693]">
                  Commencer maintenant
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold">Définir tes préférences</h4>
              <p className="text-sm text-muted-foreground">
                Zone géographique, type de contrat, salaire... pour un matching personnalisé.
              </p>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm" className="mt-2">
                  Configurer
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
            <Search className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold">Explorer les offres</h4>
              <p className="text-sm text-muted-foreground">
                Plus de 180 offres d'emploi actualisées quotidiennement depuis LBA et France Travail.
              </p>
              <Link href="/offres">
                <Button variant="outline" size="sm" className="mt-2">
                  Parcourir
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}