import { createClient } from 'jsr:@supabase/supabase-js@2'

const MGMT_API = 'https://api.supabase.com/v1'
const MGMT_PAT = Deno.env.get('MGMT_PAT') ?? ''
const METRICS_SECRET_KEY = Deno.env.get('METRICS_SECRET_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function mgmt(path: string) {
  const res = await fetch(`${MGMT_API}${path}`, {
    headers: { Authorization: `Bearer ${MGMT_PAT}` },
  })
  if (!res.ok) return null
  return res.json()
}

// Metrics that should be summed across multiple label variants (per-db, per-cpu, etc.)
const SUM_METRICS = new Set([
  'pg_stat_database_num_backends',
  'pg_stat_database_deadlocks_total',
  'pg_stat_database_blks_hit_total',
  'pg_stat_database_blks_read_total',
  'pg_stat_database_xact_commit_total',
  'pg_stat_database_xact_rollback_total',
  'pg_stat_database_tup_inserted_total',
  'pg_stat_database_tup_updated_total',
  'pg_stat_database_tup_deleted_total',
  'pgbouncer_pools_client_active_connections',
  'pgbouncer_pools_client_waiting_connections',
  'pgbouncer_databases_current_connections',
  'node_cpu_seconds_total',
])

function parsePrometheus(text: string): Record<string, number | null> {
  // Collect all values per base metric name
  const buckets: Record<string, number[]> = {}

  for (const line of text.split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue
    const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+([\d.e+\-]+)/)
    if (!match) continue

    const name = match[1]
    const value = parseFloat(match[3])
    if (isNaN(value)) continue

    if (!buckets[name]) buckets[name] = []
    buckets[name].push(value)
  }

  const result: Record<string, number | null> = {}
  for (const [name, values] of Object.entries(buckets)) {
    if (values.length === 0) {
      result[name] = null
    } else if (SUM_METRICS.has(name)) {
      result[name] = values.reduce((a, b) => a + b, 0)
    } else {
      // Single-value gauges: take the first
      result[name] = values[0]
    }
  }

  return result
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allProjects = await mgmt('/projects')
    if (!allProjects) throw new Error('Could not fetch projects')

    const projects = allProjects

    // deno-lint-ignore no-explicit-any
    const metrics = await Promise.all(projects.map(async (p: any) => {
      const [health, metricsRes] = await Promise.all([
        mgmt(`/projects/${p.id}/health`),
        fetch(`https://${p.id}.supabase.co/customer/v1/privileged/metrics`, {
          headers: {
            Authorization: `Basic ${btoa(`username:${METRICS_SECRET_KEY}`)}`,
          },
        }),
      ])

      const metricsRaw = metricsRes.ok ? await metricsRes.text() : null
      const parsed = metricsRaw ? parsePrometheus(metricsRaw) : {}

      const g = (key: string): number | null => parsed[key] ?? null

      const usage = {
        // Database
        db_size_bytes: g('pg_database_size_bytes'),
        db_size_mb: g('pg_database_size_mb'),
        wal_size_mb: g('pg_wal_size_mb'),
        db_backends: g('pg_stat_database_num_backends'),
        db_deadlocks: g('pg_stat_database_deadlocks_total'),
        db_cache_hit: g('pg_stat_database_blks_hit_total'),
        db_cache_read: g('pg_stat_database_blks_read_total'),
        db_commits: g('pg_stat_database_xact_commit_total'),
        db_rollbacks: g('pg_stat_database_xact_rollback_total'),
        db_tup_inserted: g('pg_stat_database_tup_inserted_total'),
        db_tup_updated: g('pg_stat_database_tup_updated_total'),
        db_tup_deleted: g('pg_stat_database_tup_deleted_total'),
        // Connections
        pgbouncer_active_clients: g('pgbouncer_pools_client_active_connections'),
        pgbouncer_waiting_clients: g('pgbouncer_pools_client_waiting_connections'),
        pgbouncer_max_clients: g('pgbouncer_config_max_client_connections'),
        pgbouncer_used_servers: g('pgbouncer_used_servers'),
        pgbouncer_free_servers: g('pgbouncer_free_servers'),
        // System
        mem_total_bytes: g('node_memory_MemTotal_bytes'),
        mem_available_bytes: g('node_memory_MemAvailable_bytes'),
        load_1m: g('node_load1'),
        load_5m: g('node_load5'),
        load_15m: g('node_load15'),
        // Auth
        auth_users: g('auth_users_user_count'),
        gotrue_running: g('gotrue_running'),
        // Realtime
        realtime_subscriptions: g('realtime_postgres_changes_client_subscriptions'),
        realtime_total_subscriptions: g('realtime_postgres_changes_total_subscriptions'),
        // PostgREST
        pgrst_pool_available: g('pgrst_db_pool_available'),
        pgrst_pool_max: g('pgrst_db_pool_max'),
        pgrst_pool_waiting: g('pgrst_db_pool_waiting'),
        // Storage
        storage_size_bytes: g('storage_size_bytes'),
        // Replication
        replication_lag_bytes: g('replication_slots_max_lag_bytes'),
      }

      return {
        id: p.id,
        name: p.name,
        region: p.region,
        status: p.status,
        created_at: p.created_at,
        health: health ?? [],
        usage,
      }
    }))

    return new Response(JSON.stringify({ projects: metrics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
