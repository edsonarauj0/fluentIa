import { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { AuthCredentials, AuthMode, UserProfile } from '@/types/domain'
import { authService } from '@/services/auth-service'

type AuthContextValue = {
  user: UserProfile | null
  loading: boolean
  mode: AuthMode
  signIn: (credentials: AuthCredentials) => Promise<void>
  signUp: (credentials: AuthCredentials) => Promise<void>
  signOut: () => Promise<void>
  updateUser: (profile: UserProfile) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<AuthMode>('demo')

  useEffect(() => {
    authService.getCurrentUser().then((session) => {
      setUser(session.user)
      setMode(session.mode)
      setLoading(false)
    })
  }, [])

  async function signIn(credentials: AuthCredentials) {
    const session = await authService.signIn(credentials)
    setUser(session.user)
    setMode(session.mode)
  }

  async function signUp(credentials: AuthCredentials) {
    const session = await authService.signUp(credentials)
    setUser(session.user)
    setMode(session.mode)
  }

  async function signOut() {
    await authService.signOut()
    setUser(null)
  }

  async function updateUser(profile: UserProfile) {
    const nextProfile = await authService.updateProfile(profile)
    setUser(nextProfile)
  }

  return (
    <AuthContext.Provider value={{ user, loading, mode, signIn, signUp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
