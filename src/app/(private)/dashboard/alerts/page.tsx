import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Target,
  TrendingUp,
  Settings,
  Volume2,
  VolumeX
} from "lucide-react";

export default async function AlertsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Alertes & Notifications</h1>
        <p className="text-lg text-muted-foreground">
          Configure tes préférences de notification pour ne rien manquer
        </p>
      </div>

      {/* Alert Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes actives</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#00C2A8]">0</div>
            <p className="text-xs text-muted-foreground">Configurées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Notifications envoyées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'ouverture</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Emails ouverts</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Types */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Types d'alertes</h2>

        <div className="space-y-4">
          {/* Job Matching Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Nouvelles offres correspondantes
                  </CardTitle>
                  <CardDescription>
                    Notification quand de nouvelles offres matchent avec ton profil (&gt;75%)
                  </CardDescription>
                </div>
                <Switch defaultChecked />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fréquence</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Instantané</Button>
                    <Button variant="default" size="sm" className="bg-[#00C2A8]">Quotidien</Button>
                    <Button variant="outline" size="sm">Hebdomadaire</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Score minimum</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">75%</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-[#00C2A8] h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-sm">95%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <Badge>
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </Badge>
                <Badge variant="outline">
                  <VolumeX className="w-3 h-3 mr-1" />
                  SMS (désactivé)
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Saved Search Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recherches sauvegardées
                  </CardTitle>
                  <CardDescription>
                    Alertes pour tes recherches favorites (0 active)
                  </CardDescription>
                </div>
                <Switch />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Aucune recherche sauvegardée. <Button variant="link" className="p-0 h-auto">Créer une recherche</Button> pour activer les alertes.
              </p>
            </CardContent>
          </Card>

          {/* Application Updates */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Suivi de candidatures
                  </CardTitle>
                  <CardDescription>
                    Notifications sur l'évolution de tes candidatures
                  </CardDescription>
                </div>
                <Switch defaultChecked />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Candidature vue par recruteur</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Changement de statut</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Demande d'entretien</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Réponse négative</span>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Résumé hebdomadaire
                  </CardTitle>
                  <CardDescription>
                    Récap de tes activités et nouvelles opportunités chaque lundi
                  </CardDescription>
                </div>
                <Switch />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nouvelles offres de la semaine</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Statistiques de candidatures</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conseils personnalisés</span>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Canaux de notification</CardTitle>
          <CardDescription>
            Configure comment tu veux recevoir les alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#00C2A8]" />
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p className="text-sm text-muted-foreground">Notifications par email</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">In-App</h4>
                  <p className="text-sm text-muted-foreground">Notifications dans l'application</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">SMS</h4>
                  <p className="text-sm text-muted-foreground">Notifications par SMS (Premium)</p>
                </div>
              </div>
              <Switch disabled />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
              <div className="flex items-center gap-3">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Push</h4>
                  <p className="text-sm text-muted-foreground">Notifications push (bientôt)</p>
                </div>
              </div>
              <Switch disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Paramètres avancés
          </CardTitle>
          <CardDescription>
            Options supplémentaires pour personnaliser tes alertes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Mode silencieux</span>
                <p className="text-sm text-muted-foreground">
                  Pas de notifications entre 22h et 8h
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Grouper les notifications</span>
                <p className="text-sm text-muted-foreground">
                  Combiner plusieurs alertes en un seul email
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Notifications de rappel</span>
                <p className="text-sm text-muted-foreground">
                  Rappel si pas d'activité depuis 7 jours
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Tester les notifications
            </Button>
            <Button variant="outline" size="sm">
              Historique des envois
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}