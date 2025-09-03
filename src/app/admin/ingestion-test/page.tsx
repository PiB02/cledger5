"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function IngestionTestPage() {
  const { user, isLoaded } = useUser();
  const [adminStatus, setAdminStatus] = useState<{isAdmin: boolean, bypassReason?: string, devMode?: boolean}>({ isAdmin: false });
  const [apiResult, setApiResult] = useState<string>('');

  // Test admin API directly
  const testAdminAPI = async () => {
    try {
      const response = await fetch('/api/auth/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      setApiResult(JSON.stringify(result, null, 2));
      setAdminStatus(result);
    } catch (error) {
      setApiResult('Error: ' + (error as Error).message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Test Admin & Ingestion</h1>
      
      {/* User Status */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Clerk User Status</h2>
        <p><strong>Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}</p>
        <p><strong>User:</strong> {user ? `✅ ${user.id?.slice(0, 8)}...` : '❌ Not signed in'}</p>
      </div>

      {/* API Test */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Admin API Test</h2>
        <button 
          onClick={testAdminAPI}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mb-4"
        >
          🔍 Test Admin Check API
        </button>
        
        <div className="bg-gray-100 p-3 rounded text-sm">
          <strong>Admin Status:</strong> {adminStatus.isAdmin ? '✅ Admin' : '❌ Not Admin'}
          {adminStatus.bypassReason && <><br/><strong>Bypass:</strong> {adminStatus.bypassReason}</>}
          {adminStatus.devMode && <><br/><strong>Dev Mode:</strong> ✅ Active</>}
        </div>
      </div>

      {/* API Response */}
      {apiResult && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">API Response</h2>
          <pre className="bg-black text-green-400 p-3 rounded text-xs overflow-auto">
            {apiResult}
          </pre>
        </div>
      )}

      {/* Ingestion Test */}
      {adminStatus.isAdmin && (
        <div className="bg-yellow-50 p-4 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-2">🚀 Ingestion Test</h2>
          <p className="mb-4">Admin access confirmed! Ready for ingestion tests.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
              📥 Test LBA Ingestion
            </button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
              📥 Test FT Ingestion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}