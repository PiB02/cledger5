"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  User,
  Search,
  FileText,
  Heart,
  Bell,
  Upload,
  Settings,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Mon Profil",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    name: "Rechercher",
    href: "/offres",
    icon: Search,
    badge: "183+",
  },
  {
    name: "Mes Candidatures",
    href: "/dashboard/applications",
    icon: FileText,
    badge: "Nouveau",
  },
  {
    name: "Recherches Sauvées",
    href: "/dashboard/saved-searches",
    icon: Heart,
  },
  {
    name: "Alertes",
    href: "/dashboard/alerts",
    icon: Bell,
  },
  {
    name: "Analyser CV",
    href: "/cv/upload",
    icon: Upload,
    highlight: true,
  },
];

const secondaryNavigation = [
  {
    name: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00C2A8] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C5</span>
          </div>
          <span className="text-xl font-bold">cledger5</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-[#00C2A8]/10 text-[#00C2A8] border border-[#00C2A8]/20"
                  : item.highlight
                  ? "bg-[#00C2A8]/5 text-[#00C2A8] hover:bg-[#00C2A8]/10"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge 
                  variant={item.highlight ? "default" : "secondary"} 
                  className={cn(
                    "text-xs px-2 py-0.5",
                    item.highlight && "bg-[#00C2A8] hover:bg-[#00A693]"
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}

        <Separator className="my-4" />

        {secondaryNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-muted-foreground">
          Phase 12 - Advanced Features
        </div>
      </div>
    </div>
  );
}