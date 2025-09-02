import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Target, Shield } from "lucide-react";

export default function SignUpPage() {
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
            <span className="text-sm text-gray-600">Déjà inscrit ?</span>
            <Link href="/sign-in">
              <Button variant="outline" size="sm">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            {/* Left side - Value proposition */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  Rejoins cledger5
                </h1>
                <p className="text-xl text-gray-600">
                  La plateforme d'emploi nouvelle génération avec IA avancée et matching précis
                </p>
              </div>

              {/* Features highlights */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Analyse CV instantanée</h3>
                    <p className="text-sm text-gray-600">
                      Notre IA analyse ton profil en moins de 60 secondes avec le référentiel ROME français
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Matching intelligent</h3>
                    <p className="text-sm text-gray-600">
                      Algorithme vectoriel avancé pour trouver les offres qui correspondent parfaitement à ton profil
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Sécurité et confidentialité</h3>
                    <p className="text-sm text-gray-600">
                      Données chiffrées, hébergement européen, et conformité RGPD garantie
                    </p>
                  </div>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">183+</div>
                  <div className="text-xs text-gray-600">Offres actives</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">95%</div>
                  <div className="text-xs text-gray-600">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-xs text-gray-600">RGPD</div>
                </div>
              </div>
            </div>

            {/* Right side - Sign up form */}
            <div className="flex justify-center">
              <div className="w-full max-w-md">
                <div className="bg-white rounded-lg shadow-lg border p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Créer un compte
                    </h2>
                    <p className="text-sm text-gray-600 mt-2">
                      Inscription gratuite • Aucun engagement
                    </p>
                  </div>

                  <SignUp 
                    appearance={{
                      elements: {
                        rootBox: "mx-auto",
                        card: "shadow-none border-none p-0",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton: "border-gray-200 hover:border-gray-300",
                        formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm font-medium",
                        footerActionLink: "text-blue-600 hover:text-blue-700",
                        formFieldInput: "border-gray-200 focus:border-blue-500 focus:ring-blue-500",
                        formFieldLabel: "text-gray-700 font-medium",
                        dividerText: "text-gray-500",
                        dividerLine: "bg-gray-200",
                      },
                      layout: {
                        socialButtonsPlacement: "top",
                        socialButtonsVariant: "iconButton"
                      }
                    }}
                    fallbackRedirectUrl="/dashboard"
                  />
                </div>

                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    En t'inscrivant, tu acceptes nos{" "}
                    <Link href="/legal/terms" className="text-blue-600 hover:text-blue-700">
                      conditions d'utilisation
                    </Link>{" "}
                    et notre{" "}
                    <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-700">
                      politique de confidentialité
                    </Link>
                    .
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