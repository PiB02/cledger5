"use client";

import { useState, useEffect } from "react";
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
  MapPin,
  Sparkles,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface AnonymousSessionData {
  sessionToken: string;
  cvSessionId: string;
  timestamp: number;
  previewData: {
    skills_found: number;
    opportunities: number;
    experience_level: string;
  };
}

export function DashboardClient() {
  const [anonymousData, setAnonymousData] = useState<AnonymousSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoMigrating, setAutoMigrating] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      // Check for anonymous session data in localStorage
      const stored = localStorage.getItem('anonymous_session_data');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          // Check if data is not too old (< 24h)
          if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
            setAnonymousData(data);
            
            // Auto-migrate if user just signed up (data is < 5 minutes old)
            const isRecentSignup = Date.now() - data.timestamp < 5 * 60 * 1000;
            if (isRecentSignup && !data.migrationAttempted) {
              setAutoMigrating(true);
              try {
                const response = await fetch('/api/cv/migrate-anonymous', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    sessionToken: data.sessionToken,
                    cvSessionId: data.cvSessionId,
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    // Migration successful - clean up localStorage
                    localStorage.removeItem('anonymous_session_data');
                    setAnonymousData(null);
                  }
                } else {
                  // Mark migration as attempted to avoid retry loops
                  data.migrationAttempted = true;
                  localStorage.setItem('anonymous_session_data', JSON.stringify(data));
                }
              } catch (error) {
                console.error('Auto-migration failed:', error);
                // Mark migration as attempted to avoid retry loops
                data.migrationAttempted = true;
                localStorage.setItem('anonymous_session_data', JSON.stringify(data));
              } finally {
                setAutoMigrating(false);
              }
            }
          } else {
            // Clean up old data
            localStorage.removeItem('anonymous_session_data');
          }
        } catch (error) {
          console.error('Error parsing anonymous session data:', error);
          localStorage.removeItem('anonymous_session_data');
        }
      }
      setLoading(false);
    };

    initializeDashboard();
  }, []);

  const handleMigrateData = async () => {
    if (!anonymousData) return;
    
    try {
      const response = await fetch('/api/cv/migrate-anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: anonymousData.sessionToken,
          cvSessionId: anonymousData.cvSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Migration failed');
      }

      const result = await response.json();
      
      if (result.success) {
        // Migration successful - clean up localStorage and refresh dashboard
        localStorage.removeItem('anonymous_session_data');
        setAnonymousData(null);
        
        // Show success message (you could use a toast here)
        alert('Vos données CV ont été migrées avec succès vers votre compte !');
        
        // Optionally redirect to CV profile page
        window.location.href = '/dashboard/profile';
      } else {
        throw new Error(result.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Erreur lors de la migration des données. Veuillez réessayer.');
    }
  };

  const handleViewFullResults = async () => {
    if (!anonymousData) return;
    
    // Open full results in new tab
    window.open(`/api/cv/results/anonymous?session_token=${anonymousData.sessionToken}&access_level=full`, '_blank');
  };

  if (loading || autoMigrating) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C2A8] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">
            {autoMigrating ? 'Migration de vos données CV en cours...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  // Show CV results if we have anonymous data
  if (anonymousData) {
    return (
      <div className="space-y-8">
        {/* Welcome with CV Results */}
        <div>
          <h1 className="text-3xl font-bold">Bienvenue sur cledger5 ! 🎉</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Ton compte a été créé avec succès. Voici les résultats de l'analyse de ton CV :
          </p>
        </div>

        {/* CV Analysis Results */}
        <Card className="border-[#00C2A8]/20 bg-gradient-to-r from-[#16A34A]/5 to-[#00C2A8]/5 border-l-4 border-l-[#16A34A]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#111111]">
              <Sparkles className="h-5 w-5 text-[#00C2A8]" />
              Analyse de ton CV terminée
            </CardTitle>
            <CardDescription>
              Notre IA a identifié tes compétences et trouvé des opportunités pour toi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#16A34A]/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-[#16A34A]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111111]">{anonymousData.previewData.skills_found}</p>
                  <p className="text-sm text-[#6B7280]">Compétences identifiées</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#00C2A8]/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-[#00C2A8]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111111]">{anonymousData.previewData.opportunities}</p>
                  <p className="text-sm text-[#6B7280]">Opportunités disponibles</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#EAB308]/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-[#EAB308]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111111]">{anonymousData.previewData.experience_level}</p>
                  <p className="text-sm text-[#6B7280]">Niveau d'expérience</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleMigrateData}
                className="bg-[#00C2A8] hover:bg-[#00A693]"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Sauvegarder dans mon compte
              </Button>
              <Button 
                variant="outline"
                onClick={handleViewFullResults}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir détails
              </Button>
              <Button 
                variant="ghost"
                onClick={() => {
                  localStorage.removeItem('anonymous_session_data');
                  setAnonymousData(null);
                }}
              >
                Masquer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

          <Card className="hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profil</CardTitle>
              <MapPin className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Setup</div>
              <p className="text-xs text-muted-foreground">
                À compléter
              </p>
              <Link href="/dashboard/profile">
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Configurer
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
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
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold">Définir tes préférences</h4>
                <p className="text-sm text-muted-foreground">
                  Zone géographique, type de contrat, salaire... pour un matching personnalisé.
                </p>
                <Link href="/dashboard/profile">
                  <Button variant="outline" size="sm" className="mt-2">
                    Configurer maintenant
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

  // Standard dashboard if no anonymous data
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