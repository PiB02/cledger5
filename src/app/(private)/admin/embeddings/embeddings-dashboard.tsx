'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Clock, 
  Database,
  DollarSign,
  Activity,
  Search,
  Target,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface EmbeddingStats {
  queue_stats: {
    total_enriched_offers: number
    existing_embeddings: number
    needs_embedding: number
    completion_rate: number
  }
  recent_activity: Array<{
    offer_id: string
    kind: string
    model: string
    dim: number
    created_at: string
  }>
}

interface ReembeddingActivity {
  offer_id: string
  title: string
  action: string
  reason: string
  triggered_at: string
  current_status: string
}

export default function EmbeddingsDashboard() {
  const [stats, setStats] = useState<EmbeddingStats | null>(null)
  const [reembeddingActivity, setReembeddingActivity] = useState<ReembeddingActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchPerformance, setSearchPerformance] = useState<any>(null)

  useEffect(() => {
    fetchStats()
    fetchReembeddingActivity()
    testSearchPerformance()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats()
      fetchReembeddingActivity()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/embeddings/queue')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch embedding stats:', error)
      toast.error('Failed to load embedding statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchReembeddingActivity = async () => {
    try {
      // This would be a new API endpoint to fetch from v_reembedding_activity
      const response = await fetch('/api/admin/embeddings/activity')
      if (response.ok) {
        const data = await response.json()
        setReembeddingActivity(data.activity || [])
      }
    } catch (error) {
      console.error('Failed to fetch re-embedding activity:', error)
    }
  }

  const testSearchPerformance = async () => {
    try {
      const testQuery = 'développeur JavaScript React'
      const startTime = Date.now()
      
      const response = await fetch(
        `/api/search/offers?query=${encodeURIComponent(testQuery)}&semantic_search=true&limit=20`
      )
      
      const endTime = Date.now()
      const data = await response.json()
      
      setSearchPerformance({
        query: testQuery,
        duration: endTime - startTime,
        results_count: data.data?.offers?.length || 0,
        semantic_results: data.data?.search_metadata?.semantic_results_count || 0
      })
    } catch (error) {
      console.error('Failed to test search performance:', error)
    }
  }

  const processQueue = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/embeddings/queue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
        },
        body: JSON.stringify({
          batch_size: 20,
          force_regenerate: false
        })
      })

      if (!response.ok) throw new Error('Failed to process queue')
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Successfully processed ${result.processed_count} offers`)
        fetchStats() // Refresh stats
      } else {
        toast.error('Queue processing failed')
      }
    } catch (error) {
      console.error('Failed to process queue:', error)
      toast.error('Failed to process embedding queue')
    } finally {
      setProcessing(false)
    }
  }

  const forceRegenerate = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/embeddings/queue', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
        },
        body: JSON.stringify({
          batch_size: 10,
          force_regenerate: true
        })
      })

      if (!response.ok) throw new Error('Failed to regenerate embeddings')
      
      const result = await response.json()
      
      if (result.success) {
        toast.success(`Force regenerated ${result.processed_count} embeddings`)
        fetchStats()
      } else {
        toast.error('Force regeneration failed')
      }
    } catch (error) {
      console.error('Failed to force regenerate:', error)
      toast.error('Failed to force regenerate embeddings')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const completionRate = stats?.queue_stats.completion_rate || 0
  const needsEmbedding = stats?.queue_stats.needs_embedding || 0

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enriched</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.queue_stats.total_enriched_offers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Offers ready for embedding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Embeddings</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.queue_stats.existing_embeddings || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              1536d vectors ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Queue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {needsEmbedding}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(completionRate * 100)}%
            </div>
            <Progress value={completionRate * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Queue Actions */}
      {needsEmbedding > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              {needsEmbedding} offers are pending embedding generation. 
              Process the queue to enable semantic search for these offers.
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={processQueue} 
                disabled={processing}
                size="sm"
              >
                {processing ? 'Processing...' : 'Process Queue'}
              </Button>
              <Button 
                onClick={forceRegenerate} 
                disabled={processing}
                variant="outline"
                size="sm"
              >
                Force Regenerate
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Performance Metrics */}
      {searchPerformance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Performance Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Query</p>
                <p className="font-medium">"{searchPerformance.query}"</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="font-medium text-lg">
                  {searchPerformance.duration}ms
                  <Badge variant={searchPerformance.duration < 500 ? "default" : "destructive"} className="ml-2">
                    {searchPerformance.duration < 500 ? "Good" : "Slow"}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Results</p>
                <p className="font-medium text-lg">{searchPerformance.results_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Semantic Matches</p>
                <p className="font-medium text-lg">{searchPerformance.semantic_results}</p>
              </div>
            </div>
            <Button 
              onClick={testSearchPerformance} 
              variant="outline" 
              size="sm"
              className="mt-4"
            >
              <Activity className="h-4 w-4 mr-2" />
              Test Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="reembedding">Re-embedding Log</TabsTrigger>
          <TabsTrigger value="performance">Performance Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Embeddings Generated</CardTitle>
              <CardDescription>
                Latest embedding generations with model and dimension info
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recent_activity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.offer_id.slice(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.model} • {activity.dim}d • {activity.kind}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                        <Badge variant="outline">Generated</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No recent embedding activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reembedding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Re-embedding Triggers</CardTitle>
              <CardDescription>
                Automatic re-embedding triggered by data changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reembeddingActivity.length > 0 ? (
                <div className="space-y-2">
                  {reembeddingActivity.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.title || `Offer ${activity.offer_id.slice(0, 8)}`}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.reason.replace(/_/g, ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.triggered_at).toLocaleDateString()}
                        </p>
                        <Badge variant={activity.current_status === 'has_embedding' ? "default" : "destructive"}>
                          {activity.current_status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No re-embedding activity logged</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>HNSW Index Performance</CardTitle>
              <CardDescription>
                Vector similarity search performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Index Configuration</h4>
                  <div className="text-sm space-y-1">
                    <p>• Algorithm: HNSW (Hierarchical Navigable Small World)</p>
                    <p>• Distance: Cosine Similarity</p>
                    <p>• Dimensions: 1536 (text-embedding-3-small)</p>
                    <p>• Parameters: m=16, ef_construction=64</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Performance Targets</h4>
                  <div className="text-sm space-y-1">
                    <p>• Semantic Search: &lt;500ms p95</p>
                    <p>• Vector Query: &lt;100ms</p>
                    <p>• Embedding Generation: &lt;2s per offer</p>
                    <p>• Batch Processing: 20-50 offers</p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={testSearchPerformance} 
                className="mt-4"
                variant="outline"
              >
                <Target className="h-4 w-4 mr-2" />
                Run Performance Test
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}