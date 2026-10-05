import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="bg-card border border-border rounded-xl p-8 shadow-sm text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-2">
          <span className="text-primary-foreground font-bold text-lg">CD</span>
        </div>
        <h1 className="text-2xl font-semibold">Hola, mundo 👋</h1>
        <p className="text-muted-foreground text-sm">
          Sesión iniciada como <span className="font-medium text-foreground">{user?.email}</span>
        </p>
        <Button variant="outline" onClick={signOut} className="mt-2">
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}
