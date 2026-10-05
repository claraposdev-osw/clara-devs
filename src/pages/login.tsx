import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { signInWithPersistence } from '@/lib/supabase'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await signInWithPersistence(email, password, rememberMe)

    if (error) {
      setError('Credenciales incorrectas. Verificá tu email y contraseña.')
    }

    setSubmitting(false)
  }

  return (
    <>
      {/* Animated background */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg__orb login-bg__orb--1" />
        <div className="login-bg__orb login-bg__orb--2" />
        <div className="login-bg__orb login-bg__orb--3" />
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {/* Logo / Brand */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4 shadow-lg shadow-primary/30">
                <span className="text-primary-foreground font-bold text-lg">CD</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">Clara Devs</h1>
              <p className="text-sm text-muted-foreground mt-1">Panel de operaciones</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="dev@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-muted accent-primary cursor-pointer"
                />
                <Label htmlFor="remember-me" className="cursor-pointer text-muted-foreground font-normal">
                  Recordarme
                </Label>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={submitting}>
                {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
