import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  FileText,
  Settings,
  Shield,
  Bell,
  Globe
} from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Mon Profil</h1>
        <p className="text-lg text-muted-foreground">
          Gère tes informations personnelles et préférences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="preferences">Préférences</TabsTrigger>
          <TabsTrigger value="privacy">Confidentialité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Tes informations de base synchronisées avec Clerk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">Non disponible</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Membre depuis</div>
                    <div className="text-sm text-muted-foreground">Aujourd'hui</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Status</div>
                    <div className="flex items-center gap-2">
                      <Badge>Candidat</Badge>
                      <Badge variant="outline">Vérifié</Badge>
                    </div>
                  </div>
                </div>
                <Separator />
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* CV Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Mon CV
                </CardTitle>
                <CardDescription>
                  Status de l'analyse de ton CV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium">Aucun CV analysé</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload ton CV pour débloquer le matching intelligent
                  </p>
                  <Link href="/cv/upload">
                    <Button className="bg-[#00C2A8] hover:bg-[#00A693]">
                      Analyser mon CV
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Job Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Préférences emploi
                </CardTitle>
                <CardDescription>
                  Critères pour tes recherches d'emploi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Zone géographique</label>
                    <p className="text-sm text-muted-foreground">Non définie</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type de contrat</label>
                    <p className="text-sm text-muted-foreground">Tous</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Mode de travail</label>
                    <p className="text-sm text-muted-foreground">Non défini</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fourchette salariale</label>
                    <p className="text-sm text-muted-foreground">Non définie</p>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" size="sm">
                  Configurer mes préférences
                </Button>
              </CardContent>
            </Card>

            {/* Matching Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Paramètres de matching
                </CardTitle>
                <CardDescription>
                  Comment nous trouvons les offres pour toi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Matching sémantique</label>
                      <p className="text-xs text-muted-foreground">IA + embeddings</p>
                    </div>
                    <Badge>Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Seuil de similarité</label>
                      <p className="text-xs text-muted-foreground">0.7 (70%)</p>
                    </div>
                    <Badge variant="outline">Auto</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Rayon géographique</label>
                      <p className="text-xs text-muted-foreground">50 km</p>
                    </div>
                    <Badge variant="outline">Défaut</Badge>
                  </div>
                </div>
                <Separator />
                <Button variant="outline" size="sm">
                  Ajuster les paramètres
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Confidentialité et données
              </CardTitle>
              <CardDescription>
                Contrôle qui peut voir ton profil et tes données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Profil recherchable</h4>
                    <p className="text-sm text-muted-foreground">
                      Permet aux recruteurs de trouver ton profil
                    </p>
                  </div>
                  <Badge>Activé</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Anonymisation automatique</h4>
                    <p className="text-sm text-muted-foreground">
                      Tes informations personnelles sont chiffrées
                    </p>
                  </div>
                  <Badge>Activé</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rétention des données</h4>
                    <p className="text-sm text-muted-foreground">
                      Suppression automatique après 2 ans d'inactivité
                    </p>
                  </div>
                  <Badge variant="outline">2 ans</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Actions RGPD</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Exporter mes données
                  </Button>
                  <Button variant="outline" size="sm">
                    Supprimer mon compte
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Conforme au RGPD • Hébergement EU • Chiffrement bout-en-bout
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Choisis comment tu veux être notifié des nouvelles opportunités
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Nouvelles offres correspondantes</h4>
                    <p className="text-sm text-muted-foreground">
                      Notification quand de nouvelles offres correspondent à ton profil
                    </p>
                  </div>
                  <Badge>Activé</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Alertes de matching</h4>
                    <p className="text-sm text-muted-foreground">
                      Score de matching élevé (&gt;80%)
                    </p>
                  </div>
                  <Badge>Activé</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Résumé hebdomadaire</h4>
                    <p className="text-sm text-muted-foreground">
                      Récap des nouvelles offres chaque lundi
                    </p>
                  </div>
                  <Badge variant="outline">Désactivé</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Demandes de contact recruteur</h4>
                    <p className="text-sm text-muted-foreground">
                      Quand un recruteur veut te contacter
                    </p>
                  </div>
                  <Badge>Activé</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Canaux de notification</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email</span>
                    <Badge>Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">In-app</span>
                    <Badge>Activé</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SMS (premium)</span>
                    <Badge variant="outline">Désactivé</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}