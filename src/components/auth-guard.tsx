import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
