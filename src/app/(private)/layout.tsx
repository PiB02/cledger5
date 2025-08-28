import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Download,
  Filter,
  Settings,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Offres', href: '/admin/offres', icon: FileText },
    { name: 'Candidats', href: '/admin/candidats', icon: Users },
    { name: 'Entreprises', href: '/admin/entreprises', icon: Building2 },
    { name: 'Ingestion', href: '/admin/ingestion', icon: Download },
    { name: 'Canonicalisation', href: '/admin/canonicalization', icon: Filter },
    { name: 'Paramètres', href: '/admin/settings', icon: Settings },
  ]
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-background border-r">
          <div className="flex items-center h-16 px-6 border-b">
            <Link href="/admin" className="font-bold text-xl">
              cledger5 Admin
            </Link>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-muted-foreground">admin@cledger5.com</p>
            </div>
            <Button variant="outline" className="w-full" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b bg-background">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center h-16 px-6 border-b">
                <Link href="/admin" className="font-bold text-xl">
                  cledger5 Admin
                </Link>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <Link href="/admin" className="font-bold text-lg">
            cledger5 Admin
          </Link>
          
          <Button variant="ghost" size="icon">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
} 