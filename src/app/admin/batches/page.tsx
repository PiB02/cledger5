"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import BatchMonitor from "@/components/admin/batch-monitor";

export default function BatchesPage() {
  const { user, isLoaded } = useUser();
  const [adminStatus, setAdminStatus] = useState<{isAdmin: boolean, bypassReason?: string}>({ isAdmin: false });
  
  // Check admin access with dev bypass support
  useEffect(() => {
    async function checkAdmin() {
      if (!isLoaded || !user) return;

      try {
        const response = await fetch('/api/auth/admin-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        const result = await response.json();
        setAdminStatus(result);
      } catch (error) {
        console.error('Admin check failed:', error);
        setAdminStatus({ isAdmin: false });
      }
    }

    checkAdmin();
  }, [isLoaded, user]);
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Connexion requise</h1>
          <p className="text-gray-600">Vous devez vous connecter pour accéder à cette page.</p>
        </div>
      </div>
    );
  }
  
  if (!adminStatus.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600">Cette page nécessite des privilèges administrateur.</p>
          {adminStatus.bypassReason && (
            <p className="text-sm text-green-600 mt-2">Dev: {adminStatus.bypassReason}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monitoring des Batches</h1>
        <p className="text-gray-600 mt-2">
          Suivi en temps réel des processus d'ingestion LBA et France Travail
        </p>
      </div>

      <BatchMonitor autoRefresh={true} />
    </div>
  );
}