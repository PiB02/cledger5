import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Download,
  Filter,
  Brain,
  Zap,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Offres", href: "/admin/offers", icon: FileText },
  { name: "Candidats", href: "/admin/candidates", icon: Users },
  { name: "Entreprises", href: "/admin/companies", icon: Building2 },
  { name: "Ingestion", href: "/admin/ingestion", icon: Download },
  { name: "Canonicalisation", href: "/admin/canonicalization", icon: Filter },
  { name: "Enrichissement IA", href: "/admin/enrichment", icon: Brain },
  { name: "Embeddings", href: "/admin/embeddings", icon: Zap },
  { name: "Paramètres", href: "/admin/settings", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar Static */}
        <aside className="w-64 bg-white border-r border-gray-200">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <Link href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-xl">Admin cledger5</span>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <Link href="/dashboard">
                <button className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                  ← Retour User
                </button>
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          {/* Header Static */}
          <header className="border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between h-16 px-6">
              <div>
                <h2 className="text-lg font-semibold text-orange-600">
                  Interface Admin
                </h2>
                <p className="text-sm text-muted-foreground">
                  Gestion de la plateforme cledger5
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <button className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-md transition-colors border border-orange-200">
                    Mode User
                  </button>
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}