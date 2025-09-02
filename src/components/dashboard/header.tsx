"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Search } from "lucide-react";

export function Header() {
  const { user } = useUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Title */}
        <div>
          <h2 className="text-lg font-semibold">
            Bonjour, {user?.firstName || "Candidat"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Prêt à trouver ton prochain défi ?
          </p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Quick Search */}
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Recherche rapide
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500">
              0
            </Badge>
          </Button>

          {/* User Profile */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>
    </header>
  );
}