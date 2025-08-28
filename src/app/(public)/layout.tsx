import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-bold text-xl">
                cledger5
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  href="/offres" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Offres d'emploi
                </Link>
                <Link 
                  href="/entreprises" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Entreprises
                </Link>
                <Link 
                  href="/candidats" 
                  className="text-sm font-medium transition-colors hover:text-primary"
                >
                  Espace candidat
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">S'inscrire</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2025 cledger5 - Plateforme de matching emploi
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-muted-foreground hover:text-primary">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-muted-foreground hover:text-primary">
                CGU
              </Link>
              <Link href="/rgpd" className="text-muted-foreground hover:text-primary">
                RGPD
              </Link>
              <Link href="/contact" className="text-muted-foreground hover:text-primary">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
} 