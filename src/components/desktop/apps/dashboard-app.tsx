import {
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Cpu,
  Users,
  Radio,
  Globe,
  HardDrive,
  GitBranch,
  Link,
} from 'lucide-react'
import { useSupabaseMetrics, type HealthService, type ProjectUsage } from '@/hooks/use-supabase-metrics'

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmt(value: number | null, decimals = 0): string {
  if (value == null) return '—'
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals })
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function cacheHitColor(ratio: number | null): string {
  if (ratio == null) return 'text-foreground'
  if (ratio >= 95) return 'text-emerald-400'
  if (ratio >= 80) return 'text-yellow-400'
  return 'text-red-400'
}

function memUsageColor(pct: number | null): string {
  if (pct == null) return 'text-foreground'
  if (pct < 70) return 'text-emerald-400'
  if (pct <= 85) return 'text-yellow-400'
  return 'text-red-400'
}

function loadColor(load: number | null): string {
  if (load == null) return 'text-foreground'
  if (load < 1.0) return 'text-emerald-400'
  if (load <= 2.0) return 'text-yellow-400'
  return 'text-red-400'
}

function waitingClientsColor(n: number | null): string {
  if (n == null) return 'text-foreground'
  if (n === 0) return 'text-emerald-400'
  return 'text-yellow-400'
}

// ─── Small reusable components ────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE_HEALTHY'
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
      isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'
    }`}>
      {isActive ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {isActive ? 'Active' : status}
    </span>
  )
}

function HealthRow({ service }: { service: HealthService }) {
  const ok = service.status === 'HEALTHY' || service.status === 'ACTIVE_HEALTHY'
  const degraded = service.status === 'COMING_UP'
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground capitalize">{service.name.replace(/_/g, ' ')}</span>
      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
        ok ? 'text-emerald-400' : degraded ? 'text-yellow-400' : 'text-red-400'
      }`}>
        {ok
          ? <CheckCircle className="w-3 h-3" />
          : degraded
          ? <Clock className="w-3 h-3" />
          : <XCircle className="w-3 h-3" />}
        {ok ? 'OK' : degraded ? 'Starting' : 'Error'}
      </span>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ─── Metric cell ─────────────────────────────────────────────────────────────

function MetricCell({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-2.5">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-sm font-semibold ${valueClass ?? 'text-foreground'}`}>{value}</div>
    </div>
  )
}

// ─── Metrics sections ─────────────────────────────────────────────────────────

function DatabaseSection({ u }: { u: ProjectUsage }) {
  const cacheRatio =
    u.db_cache_hit != null && u.db_cache_read != null && (u.db_cache_hit + u.db_cache_read) > 0
      ? (u.db_cache_hit / (u.db_cache_hit + u.db_cache_read)) * 100
      : null

  return (
    <div>
      <SectionHeader icon={<Database className="w-3.5 h-3.5" />} label="Database" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="DB Size" value={formatBytes(u.db_size_bytes)} />
        <MetricCell label="WAL Size" value={u.wal_size_mb != null ? `${u.wal_size_mb.toFixed(1)} MB` : '—'} />
        <MetricCell label="Active backends" value={fmt(u.db_backends)} />
        <MetricCell label="Deadlocks" value={fmt(u.db_deadlocks)} />
        <MetricCell
          label="Cache hit ratio"
          value={cacheRatio != null ? `${cacheRatio.toFixed(1)}%` : '—'}
          valueClass={cacheHitColor(cacheRatio)}
        />
        <MetricCell label="Commits" value={fmt(u.db_commits)} />
        <MetricCell label="Rollbacks" value={fmt(u.db_rollbacks)} />
        <MetricCell label="Rows inserted" value={fmt(u.db_tup_inserted)} />
        <MetricCell label="Rows updated" value={fmt(u.db_tup_updated)} />
        <MetricCell label="Rows deleted" value={fmt(u.db_tup_deleted)} />
      </div>
    </div>
  )
}

function ConnectionsSection({ u }: { u: ProjectUsage }) {
  const serverPool =
    u.pgbouncer_used_servers != null && u.pgbouncer_free_servers != null
      ? `${u.pgbouncer_used_servers} used / ${u.pgbouncer_free_servers} free`
      : '—'

  return (
    <div>
      <SectionHeader icon={<Link className="w-3.5 h-3.5" />} label="Connections" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell
          label="Active clients"
          value={fmt(u.pgbouncer_active_clients)}
        />
        <MetricCell
          label="Waiting clients"
          value={fmt(u.pgbouncer_waiting_clients)}
          valueClass={waitingClientsColor(u.pgbouncer_waiting_clients)}
        />
        <MetricCell label="Max clients" value={fmt(u.pgbouncer_max_clients)} />
        <MetricCell label="Server pool" value={serverPool} />
      </div>
    </div>
  )
}

function SystemSection({ u }: { u: ProjectUsage }) {
  const memUsed =
    u.mem_total_bytes != null && u.mem_available_bytes != null
      ? u.mem_total_bytes - u.mem_available_bytes
      : null
  const memPct =
    memUsed != null && u.mem_total_bytes != null && u.mem_total_bytes > 0
      ? (memUsed / u.mem_total_bytes) * 100
      : null
  const loadStr =
    u.load_1m != null && u.load_5m != null && u.load_15m != null
      ? `${u.load_1m.toFixed(2)} / ${u.load_5m.toFixed(2)} / ${u.load_15m.toFixed(2)}`
      : '—'

  return (
    <div>
      <SectionHeader icon={<Cpu className="w-3.5 h-3.5" />} label="System" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Memory used" value={formatBytes(memUsed)} />
        <MetricCell label="Memory total" value={formatBytes(u.mem_total_bytes)} />
        <MetricCell
          label="Memory usage"
          value={memPct != null ? `${memPct.toFixed(1)}%` : '—'}
          valueClass={memUsageColor(memPct)}
        />
        <MetricCell
          label="Load avg (1m)"
          value={u.load_1m != null ? u.load_1m.toFixed(2) : '—'}
          valueClass={loadColor(u.load_1m)}
        />
        <div className="col-span-2 bg-white/5 rounded-lg p-2.5">
          <div className="text-xs text-muted-foreground mb-1">Load avg (1m / 5m / 15m)</div>
          <div className={`text-sm font-semibold ${loadColor(u.load_1m)}`}>{loadStr}</div>
        </div>
      </div>
    </div>
  )
}

function AuthSection({ u }: { u: ProjectUsage }) {
  return (
    <div>
      <SectionHeader icon={<Users className="w-3.5 h-3.5" />} label="Auth" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Total users" value={fmt(u.auth_users)} />
        <div className="bg-white/5 rounded-lg p-2.5">
          <div className="text-xs text-muted-foreground mb-1">GoTrue</div>
          <div className={`text-sm font-semibold flex items-center gap-1.5 ${
            u.gotrue_running === 1 ? 'text-emerald-400' : u.gotrue_running == null ? 'text-foreground' : 'text-red-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full inline-block ${
              u.gotrue_running === 1 ? 'bg-emerald-400' : u.gotrue_running == null ? 'bg-white/30' : 'bg-red-400'
            }`} />
            {u.gotrue_running === 1 ? 'Running' : u.gotrue_running == null ? '—' : 'Down'}
          </div>
        </div>
      </div>
    </div>
  )
}

function RealtimeSection({ u }: { u: ProjectUsage }) {
  return (
    <div>
      <SectionHeader icon={<Radio className="w-3.5 h-3.5" />} label="Realtime" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Active subscriptions" value={fmt(u.realtime_subscriptions)} />
        <MetricCell label="Total subscriptions" value={fmt(u.realtime_total_subscriptions)} />
      </div>
    </div>
  )
}

function PostgRESTSection({ u }: { u: ProjectUsage }) {
  return (
    <div>
      <SectionHeader icon={<Globe className="w-3.5 h-3.5" />} label="PostgREST" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Pool available" value={fmt(u.pgrst_pool_available)} />
        <MetricCell label="Pool max" value={fmt(u.pgrst_pool_max)} />
        <MetricCell
          label="Pool waiting"
          value={fmt(u.pgrst_pool_waiting)}
          valueClass={waitingClientsColor(u.pgrst_pool_waiting)}
        />
      </div>
    </div>
  )
}

function StorageSection({ u }: { u: ProjectUsage }) {
  if (u.storage_size_bytes == null) return null
  return (
    <div>
      <SectionHeader icon={<HardDrive className="w-3.5 h-3.5" />} label="Storage" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Storage size" value={formatBytes(u.storage_size_bytes)} />
      </div>
    </div>
  )
}

function ReplicationSection({ u }: { u: ProjectUsage }) {
  if (u.replication_lag_bytes == null) return null
  return (
    <div>
      <SectionHeader icon={<GitBranch className="w-3.5 h-3.5" />} label="Replication" />
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Lag bytes" value={formatBytes(u.replication_lag_bytes)} />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardApp() {
  const { projects, loading, error, refetch } = useSupabaseMetrics()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading metrics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <AlertCircle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-center">{error}</p>
        <button onClick={refetch} className="text-xs text-primary hover:underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium">Supabase Projects</span>
          <span className="text-xs text-muted-foreground bg-white/10 px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
        <button
          onClick={refetch}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-white/10"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-5">
            {/* Project header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">{project.name}</h3>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {project.region} · Created {formatDate(project.created_at)}
                </div>
              </div>
              <StatusBadge status={project.status} />
            </div>

            {/* Metrics categories */}
            {project.usage ? (
              <div className="space-y-5">
                <DatabaseSection u={project.usage} />
                <ConnectionsSection u={project.usage} />
                <SystemSection u={project.usage} />
                <AuthSection u={project.usage} />
                <RealtimeSection u={project.usage} />
                <PostgRESTSection u={project.usage} />
                <StorageSection u={project.usage} />
                <ReplicationSection u={project.usage} />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic">Usage metrics unavailable</div>
            )}

            {/* Health services */}
            {project.health && project.health.length > 0 && (
              <div>
                <SectionHeader icon={<Server className="w-3.5 h-3.5" />} label="Services" />
                <div className="bg-white/5 rounded-lg px-3 divide-y divide-white/5">
                  {project.health.map((svc) => (
                    <HealthRow key={svc.name} service={svc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
