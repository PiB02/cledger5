import { Suspense } from 'react'
import EmbeddingsDashboard from './embeddings-dashboard'

export default function EmbeddingsAdminPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold leading-6 text-gray-900">
          Embeddings Management
        </h1>
        <p className="mt-2 max-w-4xl text-sm text-gray-700">
          Monitor and manage vector embeddings for semantic job matching. 
          Track embedding generation progress, costs, and search performance.
        </p>
      </div>

      <Suspense fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      }>
        <EmbeddingsDashboard />
      </Suspense>
    </div>
  )
}