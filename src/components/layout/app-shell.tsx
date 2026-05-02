import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { BookOpenText, Flame, LogOut, Sparkles, UserRound } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
}

const links = [
  { to: '/', label: 'Desafio diario', icon: Sparkles },
  { to: '/profile', label: 'Perfil', icon: UserRound },
]

export function AppShell({ children }: Props) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.16),_transparent_30%),linear-gradient(180deg,_#f8fafc_0%,_#ecfccb_50%,_#ffffff_100%)] text-slate-900">
      <header className="border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-lime-300 shadow-lg shadow-lime-200">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg leading-none">FluentIA</p>
              <p className="text-sm text-slate-500">Seu ritual diario de ingles com IA</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition hover:bg-slate-900 hover:text-white',
                    isActive && 'bg-slate-900 text-white',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 sm:flex sm:items-center sm:gap-2">
              <Flame className="h-4 w-4" />
              Streak de {user?.streak ?? 0} dias
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user?.name}</p>
              <p className="text-xs text-slate-500">
                {location.pathname === '/' ? 'Bora praticar hoje' : 'Ajuste sua jornada'}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
