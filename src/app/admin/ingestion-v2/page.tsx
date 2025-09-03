"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Database, 
  Activity,
  AlertCircle,
  CheckCircle,
  Play,
  Loader2,
  Settings,
  BarChart3,
  Search,
  MapPin,
  Calendar,
  Hash,
  FileText,
  PlusCircle,
  MinusCircle,
  Eye,
  Sparkles
} from "lucide-react";
import { RealTimeTracker } from "@/components/ingestion/real-time-tracker";
import { cn } from "@/lib/utils";

// Codes ROME étendus avec catégories pour une meilleure UX
const ROME_CODES = [
  { 
    code: "D1401", 
    label: "Assistanat commercial",
    category: "Commerce",
    popular: true
  },
  { 
    code: "D1402", 
    label: "Relation commerciale grands comptes",
    category: "Commerce",
    popular: true
  },
  { 
    code: "D1403", 
    label: "Relation commerciale particuliers",
    category: "Commerce",
    popular: false
  },
  { 
    code: "E1103", 
    label: "Communication",
    category: "Communication",
    popular: true
  },
  { 
    code: "E1104", 
    label: "Conception contenus multimédias",
    category: "Communication",
    popular: false
  },
  { 
    code: "M1801", 
    label: "Conseil systèmes informatiques",
    category: "Informatique",
    popular: true
  },
  { 
    code: "M1802", 
    label: "Expertise systèmes d'information",
    category: "Informatique",
    popular: true
  },
  { 
    code: "M1805", 
    label: "Études développement informatique",
    category: "Informatique",
    popular: true
  },
  { 
    code: "M1806", 
    label: "Conseil maîtrise d'ouvrage SI",
    category: "Informatique",
    popular: false
  },
  { 
    code: "M1810", 
    label: "Production exploitation SI",
    category: "Informatique",
    popular: false
  }
];

// Types pour les ingestions actives
interface ActiveIngestion {
  batchId: string;
  source: 'lba' | 'ft';
  title: string;
  startedAt: Date;
}

// Composant pour la sélection ROME améliorée
interface ROMESelectorProps {
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  source: 'lba' | 'ft';
}

function ROMESelector({ selectedCodes, onChange, source }: ROMESelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);

  // Filtrer les codes ROME selon les critères
  const filteredCodes = useMemo(() => {
    return ROME_CODES.filter(code => {
      const matchesSearch = searchTerm === "" || 
        code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.label.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || code.category === selectedCategory;
      const matchesPopular = !showOnlyPopular || code.popular;
      
      return matchesSearch && matchesCategory && matchesPopular;
    });
  }, [searchTerm, selectedCategory, showOnlyPopular]);

  // Obtenir les catégories uniques
  const categories = useMemo(() => {
    const cats = [...new Set(ROME_CODES.map(code => code.category))];
    return cats.sort();
  }, []);

  // Sélectionner/désélectionner tous les codes visibles
  const toggleAllVisible = () => {
    const visibleCodes = filteredCodes.map(code => code.code);
    const allSelected = visibleCodes.every(code => selectedCodes.includes(code));
    
    if (allSelected) {
      onChange(selectedCodes.filter(code => !visibleCodes.includes(code)));
    } else {
      const newCodes = [...new Set([...selectedCodes, ...visibleCodes])];
      onChange(newCodes);
    }
  };

  const sourceColor = source === 'lba' ? 'blue' : 'orange';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Codes ROME ({selectedCodes.length} sélectionnés)
        </Label>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllVisible}
        >
          {filteredCodes.every(code => selectedCodes.includes(code.code)) ? (
            <MinusCircle className="h-4 w-4 mr-1" />
          ) : (
            <PlusCircle className="h-4 w-4 mr-1" />
          )}
          {filteredCodes.every(code => selectedCodes.includes(code.code)) ? 'Tout désél.' : 'Tout sél.'}
        </Button>
      </div>

      {/* Filtres de recherche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2 px-3 py-2 border rounded-md">
          <Checkbox
            id={`popular-${source}`}
            checked={showOnlyPopular}
            onCheckedChange={setShowOnlyPopular}
          />
          <Label htmlFor={`popular-${source}`} className="text-sm cursor-pointer">
            <Sparkles className="h-3 w-3 inline mr-1" />
            Populaires
          </Label>
        </div>
      </div>

      {/* Liste des codes ROME */}
      <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-1">
        {filteredCodes.map((rome) => (
          <div 
            key={rome.code} 
            className={cn(
              "flex items-center space-x-2 p-2 rounded-sm transition-colors hover:bg-gray-50",
              selectedCodes.includes(rome.code) && `bg-${sourceColor}-50`
            )}
          >
            <Checkbox 
              id={`${source}-${rome.code}`}
              checked={selectedCodes.includes(rome.code)}
              onCheckedChange={() => {
                if (selectedCodes.includes(rome.code)) {
                  onChange(selectedCodes.filter(c => c !== rome.code));
                } else {
                  onChange([...selectedCodes, rome.code]);
                }
              }}
            />
            <div className="flex-1 cursor-pointer" onClick={() => {
              const checkbox = document.getElementById(`${source}-${rome.code}`) as HTMLInputElement;
              checkbox?.click();
            }}>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-${sourceColor}-600 text-sm font-medium`}>
                  {rome.code}
                </span>
                {rome.popular && <Sparkles className="h-3 w-3 text-yellow-500" />}
                <Badge variant="secondary" className="text-xs">
                  {rome.category}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {rome.label}
              </div>
            </div>
          </div>
        ))}
        
        {filteredCodes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun code ROME ne correspond aux critères</p>
          </div>
        )}
      </div>

      {selectedCodes.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <strong>Sélectionnés :</strong> {selectedCodes.join(', ')}
        </div>
      )}
    </div>
  );
}

export default function IngestionV2Page() {
  // États d'authentification
  const [adminStatus, setAdminStatus] = useState<{isAdmin: boolean, bypassReason?: string}>({ isAdmin: false });
  const [isLoading, setIsLoading] = useState(true);

  // États des formulaires
  const [lbaConfig, setLbaConfig] = useState({
    romeCodes: ["M1805"] as string[],
    departments: "",
    dateFrom: "",
    dateTo: "",
    limit: 1000,
    perPage: 100,
    dryRun: false
  });

  const [ftConfig, setFtConfig] = useState({
    romeCodes: [] as string[],
    regions: "",
    departments: "",
    contractType: "",
    keywords: "",
    maxPages: 10,
    perPage: 150,
    dryRun: false
  });

  // États des ingestions actives
  const [activeIngestions, setActiveIngestions] = useState<ActiveIngestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<{lba: boolean, ft: boolean}>({ lba: false, ft: false });

  // Vérification des droits admin
  useEffect(() => {
    async function checkAdminAccess() {
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
      } finally {
        setIsLoading(false);
      }
    }

    checkAdminAccess();
  }, []);

  // Validation des formulaires
  const isLbaValid = useMemo(() => {
    return lbaConfig.romeCodes.length > 0 && lbaConfig.limit > 0 && lbaConfig.perPage > 0;
  }, [lbaConfig]);

  const isFtValid = useMemo(() => {
    return ftConfig.romeCodes.length > 0 && ftConfig.maxPages > 0 && ftConfig.perPage > 0;
  }, [ftConfig]);

  // Lancer ingestion LBA
  const handleLbaIngestion = async () => {
    setIsSubmitting(prev => ({ ...prev, lba: true }));
    
    try {
      const payload = {
        from: lbaConfig.dateFrom || undefined,
        to: lbaConfig.dateTo || undefined,
        departments: lbaConfig.departments ? lbaConfig.departments.split(',').map(d => d.trim()) : undefined,
        romeCodes: lbaConfig.romeCodes,
        limit: lbaConfig.limit,
        perPage: lbaConfig.perPage,
        dryRun: lbaConfig.dryRun
      };

      const response = await fetch('/api/admin/ingest/lba', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data.batchId) {
        // Ajouter l'ingestion active
        const newIngestion: ActiveIngestion = {
          batchId: result.data.batchId,
          source: 'lba',
          title: `Ingestion LBA (${lbaConfig.romeCodes.length} codes ROME)`,
          startedAt: new Date()
        };
        
        setActiveIngestions(prev => [...prev, newIngestion]);
      } else {
        throw new Error(result.message || 'Échec du lancement de l\'ingestion');
      }
      
    } catch (error) {
      console.error('Erreur ingestion LBA:', error);
      alert(`Erreur ingestion LBA: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsSubmitting(prev => ({ ...prev, lba: false }));
    }
  };

  // Lancer ingestion FT
  const handleFtIngestion = async () => {
    setIsSubmitting(prev => ({ ...prev, ft: true }));
    
    try {
      const payload = {
        rome_codes: ftConfig.romeCodes,
        regions: ftConfig.regions ? ftConfig.regions.split(',').map(r => r.trim()) : undefined,
        departements: ftConfig.departments ? ftConfig.departments.split(',').map(d => d.trim()) : undefined,
        type_contrat: ftConfig.contractType && ftConfig.contractType !== 'ALL' ? [ftConfig.contractType] : undefined,
        motsCles: ftConfig.keywords || undefined,
        max_pages: ftConfig.maxPages,
        per_page: ftConfig.perPage,
        dry_run: ftConfig.dryRun
      };

      const response = await fetch('/api/admin/ingest/ft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.batchId) {
        // Ajouter l'ingestion active
        const newIngestion: ActiveIngestion = {
          batchId: result.data.batchId,
          source: 'ft',
          title: `Ingestion France Travail (${ftConfig.romeCodes.length} codes ROME)`,
          startedAt: new Date()
        };
        
        setActiveIngestions(prev => [...prev, newIngestion]);
      } else {
        throw new Error(result.message || 'Échec du lancement de l\'ingestion');
      }
      
    } catch (error) {
      console.error('Erreur ingestion France Travail:', error);
      alert(`Erreur ingestion FT: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setIsSubmitting(prev => ({ ...prev, ft: false }));
    }
  };

  // Fermer une ingestion
  const handleCloseIngestion = (batchId: string) => {
    setActiveIngestions(prev => prev.filter(ing => ing.batchId !== batchId));
  };

  // Callback quand une ingestion se termine
  const handleIngestionComplete = (batchId: string, metrics: any) => {
    console.log(`Ingestion ${batchId} terminée:`, metrics);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Vérification des droits d'accès...</p>
        </div>
      </div>
    );
  }

  if (!adminStatus.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Cette page nécessite des privilèges administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Layout en 2 colonnes */}
      <div className="flex h-screen">
        
        {/* COLONNE GAUCHE - Lancement des ingestions */}
        <div className="w-1/2 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Lancement d'ingestions</h1>
                  <p className="text-sm text-gray-600">Configurer et démarrer de nouvelles ingestions</p>
                </div>
              </div>
            </div>

            {/* Interface principale avec onglets */}
            <Tabs defaultValue="lba" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="lba" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  LBA
                </TabsTrigger>
                <TabsTrigger value="ft" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  France Travail
                </TabsTrigger>
              </TabsList>

              <TabsContent value="lba" className="space-y-6">
                {/* Configuration LBA */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-blue-500" />
                      <div>
                        <div>Configuration LBA</div>
                        <div className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                          Alternance et apprentissage
                          {isLbaValid ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valide
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Invalide
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Sélection ROME */}
                    <ROMESelector
                      selectedCodes={lbaConfig.romeCodes}
                      onChange={(codes) => setLbaConfig(prev => ({ ...prev, romeCodes: codes }))}
                      source="lba"
                    />

                    <Separator />

                    {/* Filtres temporels */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Période (optionnel)</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="lba-from" className="text-xs text-muted-foreground">Date début</Label>
                          <Input 
                            id="lba-from" 
                            type="date" 
                            value={lbaConfig.dateFrom}
                            onChange={(e) => setLbaConfig(prev => ({ ...prev, dateFrom: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lba-to" className="text-xs text-muted-foreground">Date fin</Label>
                          <Input 
                            id="lba-to" 
                            type="date" 
                            value={lbaConfig.dateTo}
                            onChange={(e) => setLbaConfig(prev => ({ ...prev, dateTo: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filtres géographiques */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="lba-departments" className="text-sm font-medium">Départements (optionnel)</Label>
                      </div>
                      <Input 
                        id="lba-departments" 
                        placeholder="75,69,13 (séparés par virgules)" 
                        value={lbaConfig.departments}
                        onChange={(e) => setLbaConfig(prev => ({ ...prev, departments: e.target.value }))}
                      />
                    </div>

                    {/* Paramètres de pagination */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Paramètres de pagination</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="lba-limit" className="text-xs text-muted-foreground">Limite totale</Label>
                          <Input 
                            id="lba-limit" 
                            type="number" 
                            value={lbaConfig.limit}
                            onChange={(e) => setLbaConfig(prev => ({ ...prev, limit: parseInt(e.target.value) || 1000 }))}
                            min="1"
                            max="10000"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lba-per-page" className="text-xs text-muted-foreground">Par page</Label>
                          <Input 
                            id="lba-per-page" 
                            type="number" 
                            value={lbaConfig.perPage}
                            onChange={(e) => setLbaConfig(prev => ({ ...prev, perPage: parseInt(e.target.value) || 100 }))}
                            min="1"
                            max="500"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Options avancées */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="lba-dry-run" 
                          checked={lbaConfig.dryRun}
                          onCheckedChange={(checked) => setLbaConfig(prev => ({ ...prev, dryRun: !!checked }))}
                        />
                        <Label htmlFor="lba-dry-run" className="text-sm font-medium cursor-pointer">
                          Mode simulation (dry run)
                        </Label>
                      </div>
                      {lbaConfig.dryRun && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Simulation
                        </Badge>
                      )}
                    </div>

                    {/* Bouton de lancement */}
                    <div className="pt-4 border-t">
                      <Button 
                        className={cn(
                          "w-full transition-all",
                          isLbaValid 
                            ? "bg-blue-600 hover:bg-blue-700" 
                            : "bg-gray-400 cursor-not-allowed"
                        )}
                        size="lg"
                        onClick={handleLbaIngestion}
                        disabled={isSubmitting.lba || !isLbaValid}
                      >
                        {isSubmitting.lba ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-5 w-5 mr-2" />
                        )}
                        {isSubmitting.lba ? 'Lancement en cours...' : 'Lancer l\'ingestion LBA'}
                      </Button>
                      
                      {!isLbaValid && (
                        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Sélectionnez au moins un code ROME et vérifiez les paramètres
                        </div>
                      )}
                    </div>
                    
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ft" className="space-y-6">
                {/* Configuration France Travail */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Database className="h-5 w-5 text-orange-500" />
                      <div>
                        <div>Configuration France Travail</div>
                        <div className="text-sm font-normal text-muted-foreground flex items-center gap-2">
                          API officielle Pôle emploi
                          {isFtValid ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valide
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Invalide
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Sélection ROME */}
                    <ROMESelector
                      selectedCodes={ftConfig.romeCodes}
                      onChange={(codes) => setFtConfig(prev => ({ ...prev, romeCodes: codes }))}
                      source="ft"
                    />

                    <Separator />

                    {/* Filtres géographiques */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Filtres géographiques (optionnel)</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ft-regions" className="text-xs text-muted-foreground">Régions</Label>
                          <Input 
                            id="ft-regions" 
                            placeholder="11,84,93 (codes région)"
                            value={ftConfig.regions}
                            onChange={(e) => setFtConfig(prev => ({ ...prev, regions: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ft-departments" className="text-xs text-muted-foreground">Départements</Label>
                          <Input 
                            id="ft-departments" 
                            placeholder="75,69,13"
                            value={ftConfig.departments}
                            onChange={(e) => setFtConfig(prev => ({ ...prev, departments: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filtres emploi */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Filtres d'emploi</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ft-contract" className="text-xs text-muted-foreground">Type de contrat</Label>
                          <Select value={ftConfig.contractType} onValueChange={(value) => setFtConfig(prev => ({ ...prev, contractType: value }))}>
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Tous types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">Tous</SelectItem>
                              <SelectItem value="CDI">CDI</SelectItem>
                              <SelectItem value="CDD">CDD</SelectItem>
                              <SelectItem value="APP">Apprentissage</SelectItem>
                              <SelectItem value="MIS">Mission intérim</SelectItem>
                              <SelectItem value="SAI">Saisonnier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="ft-keywords" className="text-xs text-muted-foreground">Mots-clés</Label>
                          <Input 
                            id="ft-keywords" 
                            placeholder="développeur, react, python..."
                            value={ftConfig.keywords}
                            onChange={(e) => setFtConfig(prev => ({ ...prev, keywords: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Paramètres de pagination */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">Paramètres de pagination</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="ft-pages" className="text-xs text-muted-foreground">Max pages</Label>
                          <Input 
                            id="ft-pages" 
                            type="number" 
                            value={ftConfig.maxPages}
                            onChange={(e) => setFtConfig(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 10 }))}
                            min="1"
                            max="100"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="ft-per-page" className="text-xs text-muted-foreground">Par page</Label>
                          <Input 
                            id="ft-per-page" 
                            type="number" 
                            value={ftConfig.perPage}
                            onChange={(e) => setFtConfig(prev => ({ ...prev, perPage: parseInt(e.target.value) || 150 }))}
                            min="1"
                            max="200"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Options avancées */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox 
                          id="ft-dry-run" 
                          checked={ftConfig.dryRun}
                          onCheckedChange={(checked) => setFtConfig(prev => ({ ...prev, dryRun: !!checked }))}
                        />
                        <Label htmlFor="ft-dry-run" className="text-sm font-medium cursor-pointer">
                          Mode simulation (dry run)
                        </Label>
                      </div>
                      {ftConfig.dryRun && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          <Eye className="h-3 w-3 mr-1" />
                          Simulation
                        </Badge>
                      )}
                    </div>

                    {/* Bouton de lancement */}
                    <div className="pt-4 border-t">
                      <Button 
                        className={cn(
                          "w-full transition-all",
                          isFtValid 
                            ? "bg-orange-600 hover:bg-orange-700" 
                            : "bg-gray-400 cursor-not-allowed"
                        )}
                        size="lg"
                        onClick={handleFtIngestion}
                        disabled={isSubmitting.ft || !isFtValid}
                      >
                        {isSubmitting.ft ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        ) : (
                          <Play className="h-5 w-5 mr-2" />
                        )}
                        {isSubmitting.ft ? 'Lancement en cours...' : 'Lancer l\'ingestion FT'}
                      </Button>
                      
                      {!isFtValid && (
                        <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Sélectionnez au moins un code ROME et vérifiez les paramètres
                        </div>
                      )}
                    </div>
                    
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* COLONNE DROITE - Batchs en cours */}
        <div className="w-1/2 bg-gray-50 overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-8 w-8 text-green-500" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Ingestions actives</h2>
                  <p className="text-sm text-gray-600">
                    {activeIngestions.length === 0 
                      ? "Aucune ingestion en cours" 
                      : `${activeIngestions.length} ingestion(s) en cours`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Liste des ingestions actives */}
            {activeIngestions.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Activity className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Aucune ingestion active</h3>
                  <p className="text-gray-500 text-center">
                    Lancez une nouvelle ingestion depuis le panneau de gauche pour voir la progression ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeIngestions.map((ingestion) => (
                  <RealTimeTracker
                    key={ingestion.batchId}
                    title={ingestion.title}
                    source={ingestion.source}
                    batchId={ingestion.batchId}
                    onClose={() => handleCloseIngestion(ingestion.batchId)}
                    onComplete={(metrics) => handleIngestionComplete(ingestion.batchId, metrics)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}