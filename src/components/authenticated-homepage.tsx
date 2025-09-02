import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AuthButton from "@/components/auth/auth-button";
import Link from "next/link";
import { SignedIn } from "@clerk/nextjs";
import { ArrowRight, User } from "lucide-react";

/**
 * Authenticated Homepage Component
 * Phase 3: Minimal homepage for authenticated users (shows during redirect)
 */
export function AuthenticatedHomepage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navigation Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-[#00C2A8]">cledger</h1>
            <Badge variant="outline" className="text-[#00C2A8] border-[#00C2A8]">Phase 12 Complete</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/offres">
              <Button variant="ghost">Offres d'emploi</Button>
            </Link>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost">Mon Dashboard</Button>
              </Link>
              <Link href="/admin">
                <Button variant="ghost">Admin</Button>
              </Link>
            </SignedIn>
            <AuthButton />
          </div>
        </div>
      </header>

      {/* Redirect Message */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#F8FAFB] to-[#E5E7EB]">
        <div className="text-center space-y-6 max-w-md">
          <div className="mx-auto w-16 h-16 bg-[#00C2A8] rounded-full flex items-center justify-center text-white">
            <User className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-[#111111]">
              Redirection vers votre profil...
            </h1>
            <p className="text-[#6B7280]">
              Accédez directement à votre dashboard personnalisé
            </p>
          </div>

          <Link href="/dashboard">
            <Button size="lg" className="bg-[#00C2A8] hover:bg-[#00A693] text-white">
              <ArrowRight className="mr-2 h-4 w-4" />
              Aller au dashboard
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}