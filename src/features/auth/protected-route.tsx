import { Navigate } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useAuth } from '@/features/auth/auth-context'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-lg font-semibold text-white">
        Preparando sua jornada...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}
