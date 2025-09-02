import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Zap, Shield } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-4">
            <ArrowLeft className="h-4 w-4" />
            <h1 className="text-2xl font-bold text-gray-900">cledger5</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Pas encore inscrit ?</span>
            <Link href="/sign-up">
              <Button size="sm">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Left side - Welcome back message */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  Bon retour !
                </h1>
                <p className="text-xl text-gray-600">
                  Connecte-toi pour accéder à ton profil et continuer ta recherche d'emploi
                </p>
              </div>

              {/* Quick benefits reminder */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Search className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Recherche avancée</h3>
                    <p className="text-sm text-gray-600">
                      Accède à ton historique et tes recherches sauvegardées
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">CV toujours à jour</h3>
                    <p className="text-sm text-gray-600">
                      Ton profil et tes préférences te suivent partout
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Données sécurisées</h3>
                    <p className="text-sm text-gray-600">
                      Toutes tes informations restent privées et chiffrées
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex justify-center gap-8 pt-6 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">183+ offres</div>
                  <div className="text-xs text-gray-600">mises à jour quotidiennement</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">&lt;500ms</div>
                  <div className="text-xs text-gray-600">temps de recherche</div>
                </div>
              </div>
            </div>

            {/* Right side - Sign in form */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg border p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Connexion
                    </h2>
                    <p className="text-sm text-gray-600 mt-2">
                      Accède à ton espace personnel
                    </p>
                  </div>

                  <SignIn 
                    appearance={{
                      elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none border-none p-0",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton: "border-gray-200 hover:border-gray-300",
                        formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm font-medium",
                        formFieldInput: "border-gray-200 focus:border-blue-500 focus:ring-blue-500",
                        formFieldLabel: "text-gray-700 font-medium",
                        dividerText: "text-gray-500",
                        dividerLine: "bg-gray-200",
                        footerActionLink: "text-blue-600 hover:text-blue-700",
                      },
                      layout: {
                        socialButtonsPlacement: "top",
                        socialButtonsVariant: "iconButton"
                      }
                    }}
                    fallbackRedirectUrl="/profile"
                  />
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    Problème de connexion ?{" "}
                    <Link href="/help/login" className="text-blue-600 hover:text-blue-700 font-medium">
                      Obtenir de l'aide
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}