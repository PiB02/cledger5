"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthenticatedHomepage } from "@/components/authenticated-homepage";
import { AnonymousHomepage } from "@/components/anonymous-homepage";

/**
 * Smart Homepage Component
 * Phase 3: Intelligent routing based on authentication status
 * 
 * Routes authenticated users to profile, shows anonymous "try before you buy" experience
 */
export function SmartHomepage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Auto-redirect authenticated users to their profile
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Delay redirect slightly to avoid flash of content
      const redirectTimer = setTimeout(() => {
        router.push('/dashboard');
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Show loading while determining auth state
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C2A8]"></div>
      </div>
    );
  }

  // Show authenticated homepage while redirecting (minimal flash)
  if (isSignedIn) {
    return <AuthenticatedHomepage />;
  }

  // Show anonymous "try before you buy" experience
  return <AnonymousHomepage />;
}