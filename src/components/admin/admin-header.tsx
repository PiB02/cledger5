"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, User } from "lucide-react";
import Link from "next/link";

export function AdminHeader() {
  const { user } = useUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Title */}
        <div>
          <h2 className="text-lg font-semibold text-orange-600">
            Interface Admin
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestion de la plateforme cledger5
          </p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Quick Actions */}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
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

          {/* Switch to User Mode */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-orange-600 hover:bg-orange-50">
              <User className="h-4 w-4 mr-2" />
              Mode User
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}