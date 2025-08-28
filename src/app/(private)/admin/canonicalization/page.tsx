/**
 * Page d'administration pour la canonicalisation des offres
 * /admin/canonicalization
 */

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CanonicalizationDashboard } from './canonicalization-dashboard'

export default function CanonicalizationPage() {
  return (
    <div className="container max-w-7xl py-6 space-y-8">
      {/* En-tête */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Canonicalisation des Offres</h1>
        <p className="text-muted-foreground">
          Transforme les offres brutes en format canonique avec déduplication automatique.
        </p>
      </div>

      {/* Explication du processus */}
      <Card>
        <CardHeader>
          <CardTitle>Comment fonctionne la canonicalisation ?</CardTitle>
          <CardDescription>
            Le pipeline de canonicalisation transforme les données brutes en format standardisé
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">
                1. Extraction
              </Badge>
              <p className="text-sm text-muted-foreground">
                Récupère les offres depuis la table <code>offers_raw</code>
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">
                2. Normalisation
              </Badge>
              <p className="text-sm text-muted-foreground">
                Normalise les données (titre, entreprise, lieu, contact)
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">
                3. Déduplication
              </Badge>
              <p className="text-sm text-muted-foreground">
                Génère un fingerprint unique pour éviter les doublons
              </p>
            </div>
            
            <div className="space-y-2">
              <Badge variant="outline" className="w-fit">
                4. Insertion
              </Badge>
              <p className="text-sm text-muted-foreground">
                Insère dans <code>offers</code>, <code>companies</code>, <code>locations</code>
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h4 className="font-medium">Fonctionnalités clés :</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Déduplication intelligente</strong> : Détecte les doublons via fingerprint canonique</li>
              <li><strong>Sources multiples</strong> : Une offre peut avoir plusieurs sources (LBA, FT)</li>
              <li><strong>Traitement par lot</strong> : Process par batch pour optimiser les performances</li>
              <li><strong>Idempotence</strong> : Relancer le process n'ajoute pas de doublons</li>
              <li><strong>Suivi d'état</strong> : Marque les offres brutes comme traitées</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard interactif */}
      <Suspense fallback={
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <CanonicalizationDashboard />
      </Suspense>
    </div>
  )
}