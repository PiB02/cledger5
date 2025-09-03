"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
// Notification simple sans toast hook
import { 
  Download, 
  Database, 
  Clock, 
  Activity,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Filter,
  Play,
  Settings,
  Loader2
} from "lucide-react";

// Codes ROME disponibles dans la base
const ROME_CODES = [
  { code: "D1401", label: "Assistanat commercial" },
  { code: "D1402", label: "Relation commerciale grands comptes et entreprises" },
  { code: "D1403", label: "Relation commerciale auprès de particuliers" },
  { code: "E1103", label: "Communication" },
  { code: "E1104", label: "Conception de contenus multimédias" },
  { code: "H1206", label: "Management et ingénierie études, recherche et développement industriel" },
  { code: "I1401", label: "Maintenance informatique et bureautique" },
  { code: "K2111", label: "Formation professionnelle" },
  { code: "M1203", label: "Comptabilité" },
  { code: "M1204", label: "Contrôle de gestion" },
  { code: "M1205", label: "Direction administrative et financière" },
  { code: "M1403", label: "Études et prospectives socio-économiques" },
  { code: "M1801", label: "Conseil en systèmes et logiciels informatiques" },
  { code: "M1802", label: "Expertise et support en systèmes d'information" },
  { code: "M1805", label: "Études et développement informatique" },
  { code: "M1806", label: "Conseil et maîtrise d'ouvrage en systèmes d'information" },
  { code: "M1810", label: "Production et exploitation de systèmes d'information" }
];

export default function IngestionPage() {
  const { user, isLoaded } = useUser();
  const [isLbaLoading, setIsLbaLoading] = useState(false);
  const [isFtLoading, setIsFtLoading] = useState(false);
  const [adminStatus, setAdminStatus] = useState<{isAdmin: boolean, bypassReason?: string}>({ isAdmin: false });
  
  // States pour LBA (moved to top level to avoid hooks order violation)
  const [lbaFilters, setLbaFilters] = useState({
    from: "",
    to: "",
    departments: "",
    romeCodes: ["M1805"] as string[],
    limit: 1000,
    perPage: 100,
    dryRun: false
  });

  // States pour FT (moved to top level to avoid hooks order violation)
  const [ftFilters, setFtFilters] = useState({
    romeCodes: [] as string[],
    regions: "",
    departments: "",
    typeContrat: "",
    keywords: "",
    maxPages: 10,
    perPage: 150,
    dryRun: false
  });

  // Check admin access with dev bypass support
  useEffect(() => {
    async function checkAdmin() {
      // Always call admin-check API - it handles dev bypass internally

      try {
        const response = await fetch('/api/auth/admin-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const result = await response.json();
        setAdminStatus(result);
      } catch (error) {
        console.error('Admin check failed:', error);
        setAdminStatus({ isAdmin: false });
      }
    }

    checkAdmin();
  }, []); // Remove dependency on isLoaded and user for dev bypass
  
  if (!adminStatus.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Cette page nécessite des privilèges administrateur.</p>
          {adminStatus.bypassReason && (
            <p className="text-sm text-green-600 mt-2">Dev: {adminStatus.bypassReason}</p>
          )}
        </div>
      </div>
    );
  }
  
  const handleRomeToggle = (source: 'lba' | 'ft', romeCode: string) => {
    if (source === 'lba') {
      setLbaFilters(prev => ({
        ...prev,
        romeCodes: prev.romeCodes.includes(romeCode)
          ? prev.romeCodes.filter(c => c !== romeCode)
          : [...prev.romeCodes, romeCode]
      }));
    } else {
      setFtFilters(prev => ({
        ...prev,
        romeCodes: prev.romeCodes.includes(romeCode)
          ? prev.romeCodes.filter(c => c !== romeCode)
          : [...prev.romeCodes, romeCode]
      }));
    }
  };

  const handleLbaIngestion = async () => {
    setIsLbaLoading(true);
    try {
      const payload = {
        from: lbaFilters.from || undefined,
        to: lbaFilters.to || undefined,
        departments: lbaFilters.departments ? lbaFilters.departments.split(',').map(d => d.trim()) : undefined,
        romeCodes: lbaFilters.romeCodes,
        limit: lbaFilters.limit,
        perPage: lbaFilters.perPage,
        dryRun: lbaFilters.dryRun
      };

      // GDPR COMPLIANCE: Use authenticated API endpoint
      const response = await fetch('/api/admin/ingest/lba', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authentication handled by Clerk middleware - no credentials in client
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      alert(`Ingestion LBA lancée - Batch ID: ${result.batchId || 'N/A'}`);
      
    } catch (error) {
      alert(`Erreur ingestion LBA: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsLbaLoading(false);
    }
  };

  const handleFtIngestion = async () => {
    setIsFtLoading(true);
    try {
      const payload = {
        rome_codes: ftFilters.romeCodes,
        regions: ftFilters.regions ? ftFilters.regions.split(',').map(r => r.trim()) : undefined,
        departements: ftFilters.departments ? ftFilters.departments.split(',').map(d => d.trim()) : undefined,
        type_contrat: ftFilters.typeContrat && ftFilters.typeContrat !== 'ALL' ? [ftFilters.typeContrat] : undefined,
        motsCles: ftFilters.keywords || undefined,
        max_pages: ftFilters.maxPages,
        per_page: ftFilters.perPage,
        dry_run: ftFilters.dryRun
      };

      // GDPR COMPLIANCE: Use authenticated API endpoint  
      const response = await fetch('/api/admin/ingest/ft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authentication handled by Clerk middleware - no credentials in client
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      alert(`Ingestion France Travail lancée - ${result.total_fetched || 0} offres récupérées`);
      
    } catch (error) {
      alert(`Erreur ingestion France Travail: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsFtLoading(false);
    }
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ingestion de Données</h1>
        <p className="text-gray-600 mt-2">
          Import automatique des offres d'emploi depuis LBA et France Travail
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Ingestion</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h ago</div>
            <p className="text-xs text-muted-foreground">
              +2,345 nouvelles offres
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingéré</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">598,279</div>
            <p className="text-xs text-muted-foreground">
              Offres dans la base
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">
              Dernières 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ingestion avec Filtres */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LBA Ingestion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              LBA (La Bonne Alternance)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statut</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Actif
              </Badge>
            </div>

            {/* Filtres LBA */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres d'Ingestion
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lba-from">Date début</Label>
                    <Input 
                      id="lba-from" 
                      type="date" 
                      value={lbaFilters.from}
                      onChange={(e) => setLbaFilters(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lba-to">Date fin</Label>
                    <Input 
                      id="lba-to" 
                      type="date" 
                      value={lbaFilters.to}
                      onChange={(e) => setLbaFilters(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lba-departments">Départements</Label>
                  <Input 
                    id="lba-departments" 
                    placeholder="75,69,13 (séparés par virgules)" 
                    value={lbaFilters.departments}
                    onChange={(e) => setLbaFilters(prev => ({ ...prev, departments: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Codes ROME ({lbaFilters.romeCodes.length} sélectionnés)</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {ROME_CODES.map((rome) => (
                      <div key={rome.code} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`lba-rome-${rome.code}`}
                          checked={lbaFilters.romeCodes.includes(rome.code)}
                          onCheckedChange={() => handleRomeToggle('lba', rome.code)}
                        />
                        <Label htmlFor={`lba-rome-${rome.code}`} className="text-xs cursor-pointer flex-1">
                          <span className="font-mono text-blue-600">{rome.code}</span> - {rome.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lba-limit">Limite totale</Label>
                    <Input 
                      id="lba-limit" 
                      type="number" 
                      placeholder="1000" 
                      value={lbaFilters.limit}
                      onChange={(e) => setLbaFilters(prev => ({ ...prev, limit: parseInt(e.target.value) || 1000 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lba-perpage">Par page</Label>
                    <Input 
                      id="lba-perpage" 
                      type="number" 
                      placeholder="100" 
                      value={lbaFilters.perPage}
                      onChange={(e) => setLbaFilters(prev => ({ ...prev, perPage: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="lba-dry-run" 
                    checked={lbaFilters.dryRun}
                    onCheckedChange={(checked) => setLbaFilters(prev => ({ ...prev, dryRun: !!checked }))}
                  />
                  <Label htmlFor="lba-dry-run" className="text-sm">Mode simulation (dry run)</Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button 
                className="w-full" 
                size="sm" 
                onClick={handleLbaIngestion}
                disabled={isLbaLoading || lbaFilters.romeCodes.length === 0}
              >
                {isLbaLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isLbaLoading ? 'Ingestion en cours...' : 'Lancer l\'ingestion LBA'}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Config
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* France Travail Ingestion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-orange-500" />
              France Travail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statut OAuth</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connecté
              </Badge>
            </div>

            {/* Filtres France Travail */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtres d'Ingestion
              </h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Codes ROME ({ftFilters.romeCodes.length} sélectionnés)</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                    {ROME_CODES.map((rome) => (
                      <div key={rome.code} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`ft-rome-${rome.code}`}
                          checked={ftFilters.romeCodes.includes(rome.code)}
                          onCheckedChange={() => handleRomeToggle('ft', rome.code)}
                        />
                        <Label htmlFor={`ft-rome-${rome.code}`} className="text-xs cursor-pointer flex-1">
                          <span className="font-mono text-orange-600">{rome.code}</span> - {rome.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="ft-regions">Régions</Label>
                  <Input 
                    id="ft-regions" 
                    placeholder="11,84,93 (codes région)"
                    value={ftFilters.regions}
                    onChange={(e) => setFtFilters(prev => ({ ...prev, regions: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="ft-departments">Départements</Label>
                  <Input 
                    id="ft-departments" 
                    placeholder="75,69,13"
                    value={ftFilters.departments}
                    onChange={(e) => setFtFilters(prev => ({ ...prev, departments: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="ft-contrat">Types de contrat</Label>
                  <Select value={ftFilters.typeContrat} onValueChange={(value) => setFtFilters(prev => ({ ...prev, typeContrat: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tous</SelectItem>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="MIS">Mission intérim</SelectItem>
                      <SelectItem value="SAI">Saisonnier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ft-keywords">Mots-clés</Label>
                  <Input 
                    id="ft-keywords" 
                    placeholder="développeur, react, python..."
                    value={ftFilters.keywords}
                    onChange={(e) => setFtFilters(prev => ({ ...prev, keywords: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="ft-pages">Max pages</Label>
                    <Input 
                      id="ft-pages" 
                      type="number" 
                      placeholder="10" 
                      value={ftFilters.maxPages}
                      onChange={(e) => setFtFilters(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 10 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ft-perpage">Par page</Label>
                    <Input 
                      id="ft-perpage" 
                      type="number" 
                      placeholder="150" 
                      value={ftFilters.perPage}
                      onChange={(e) => setFtFilters(prev => ({ ...prev, perPage: parseInt(e.target.value) || 150 }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="ft-dry-run" 
                    checked={ftFilters.dryRun}
                    onCheckedChange={(checked) => setFtFilters(prev => ({ ...prev, dryRun: !!checked }))}
                  />
                  <Label htmlFor="ft-dry-run" className="text-sm">Mode simulation (dry run)</Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button 
                className="w-full" 
                size="sm"
                onClick={handleFtIngestion}
                disabled={isFtLoading || ftFilters.romeCodes.length === 0}
              >
                {isFtLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isFtLoading ? 'Ingestion en cours...' : 'Lancer l\'ingestion FT'}
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Config
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Logs
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration et Planification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            Planification Automatique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Ingestion LBA</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Fréquence: Toutes les 6 heures</div>
                <div>• Prochaine: Dans 4h 23min</div>
                <div>• Batch size: 1000 offres/request</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Ingestion France Travail</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>• Fréquence: Quotidienne à 3h00</div>
                <div>• Prochaine: Dans 18h 45min</div>
                <div>• Batch size: 500 offres/request</div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span>La déduplication est automatiquement appliquée via <code>canonical_fingerprint</code></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs récents */}
      <Card>
        <CardHeader>
          <CardTitle>Logs d'Ingestion Récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">LBA Ingestion - 2,345 offres importées</span>
              </div>
              <span className="text-xs text-muted-foreground">Il y a 2h</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">France Travail - 1,847 offres importées</span>
              </div>
              <span className="text-xs text-muted-foreground">Hier</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">LBA Rate Limit - Attente 30s</span>
              </div>
              <span className="text-xs text-muted-foreground">Il y a 6h</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}