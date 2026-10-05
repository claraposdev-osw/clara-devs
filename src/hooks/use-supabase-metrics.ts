import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface HealthService {
  name: string
  status: string
  error?: string
}

export interface ProjectUsage {
  // Database
  db_size_bytes: number | null
  db_size_mb: number | null
  wal_size_mb: number | null
  db_backends: number | null
  db_deadlocks: number | null
  db_cache_hit: number | null
  db_cache_read: number | null
  db_commits: number | null
  db_rollbacks: number | null
  db_tup_inserted: number | null
  db_tup_updated: number | null
  db_tup_deleted: number | null
  // Connections
  pgbouncer_active_clients: number | null
  pgbouncer_waiting_clients: number | null
  pgbouncer_max_clients: number | null
  pgbouncer_used_servers: number | null
  pgbouncer_free_servers: number | null
  // System
  mem_total_bytes: number | null
  mem_available_bytes: number | null
  load_1m: number | null
  load_5m: number | null
  load_15m: number | null
  // Auth
  auth_users: number | null
  gotrue_running: number | null
  // Realtime
  realtime_subscriptions: number | null
  realtime_total_subscriptions: number | null
  // PostgREST
  pgrst_pool_available: number | null
  pgrst_pool_max: number | null
  pgrst_pool_waiting: number | null
  // Storage
  storage_size_bytes: number | null
  // Replication
  replication_lag_bytes: number | null
}

export interface ProjectMetrics {
  id: string
  name: string
  region: string
  status: string
  created_at: string
  health: HealthService[] | null
  usage: ProjectUsage | null
}

export interface SupabaseMetricsResult {
  projects: ProjectMetrics[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useSupabaseMetrics(): SupabaseMetricsResult {
  const [projects, setProjects] = useState<ProjectMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchMetrics() {
      setLoading(true)
      setError(null)

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('No session')

        const res = await supabase.functions.invoke('supabase-metrics', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })

        if (res.error) throw new Error(res.error.message)
        if (!cancelled) setProjects(res.data.projects ?? [])
      } catch (err) {
        if (!cancelled) setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchMetrics()
    return () => { cancelled = true }
  }, [tick])

  return { projects, loading, error, refetch: () => setTick((t) => t + 1) }
}
