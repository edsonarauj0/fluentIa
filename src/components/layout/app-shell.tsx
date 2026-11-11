import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Flame,
  Home,
  Layers,
  LogOut,
  MessageCircle,
  UserRound,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/auth-context'
import { BRAND_ASSETS } from '@/lib/assets'
import { difficultyLabels } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useGamificationStore } from '@/stores/gamification-store'

type Props = {
  children: ReactNode
}

export function AppShell({ children }: Props) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const {
    xp,
    streak,
    vocabPendingCount,
    micosSuperados,
    syncFromUser,
    openTutor,
  } = useGamificationStore()

  useEffect(() => {
    const todayKey = user ? `${user.id}:${new Date().toISOString().slice(0, 10)}` : ''
    const isDoneToday = Boolean(user && todayKey && user.completedChallengeIds.includes(todayKey))
    syncFromUser(user, isDoneToday)
  }, [user, syncFromUser])

  const displayName = user?.name || 'Edson'
  const userInitial = displayName.charAt(0).toUpperCase()
  const levelLabel = difficultyLabels[user?.preferences.level ?? 'beginner']
  const displayStreak = user?.streak ?? streak

  function handleVocabClick() {
    if (location.pathname !== '/') {
      void navigate('/')
    }
    const section = document.getElementById('deep-dive-section')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
    toast.info(`Você tem ${vocabPendingCount} palavras prontas para revisar hoje!`)
  }

  function handleChatClick() {
    openTutor()
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-[248px] md:shrink-0 md:flex-col md:justify-between md:border-r md:border-brand-100 md:bg-white md:px-4 md:py-6">
        <div>
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 px-2">
            <img
              src={BRAND_ASSETS.mascotAvatar}
              alt="Logo Mico"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <div>
              <p className="font-display text-xl font-extrabold leading-none tracking-tight text-navy-900">
                <span className="text-brand-500">Sem</span> Mico
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Fale inglês sem mico
              </p>
            </div>
          </Link>

          {/* Navigation Menu */}
          <nav aria-label="Menu principal" className="mt-7 space-y-1.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                  isActive
                    ? 'bg-brand-100 text-brand-600'
                    : 'text-navy-900/80 hover:bg-brand-50 hover:text-navy-900',
                )
              }
            >
              <Home className="h-5 w-5" />
              <span>Início</span>
            </NavLink>

            <button
              type="button"
              onClick={handleVocabClick}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-navy-900/80 transition-colors hover:bg-brand-50 hover:text-navy-900"
            >
              <Layers className="h-5 w-5 text-muted-foreground" />
              <span className="flex-1">Vocabulário</span>
              <span className="rounded-full bg-vocab px-2.5 py-0.5 text-xs font-extrabold text-white">
                {vocabPendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={handleChatClick}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-navy-900/80 transition-colors hover:bg-brand-50 hover:text-navy-900"
            >
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <span>Chat</span>
            </button>

            <NavLink
              to="/profile"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors',
                  isActive
                    ? 'bg-brand-100 text-brand-600'
                    : 'text-navy-900/80 hover:bg-brand-50 hover:text-navy-900',
                )
              }
            >
              <UserRound className="h-5 w-5" />
              <span>Perfil</span>
            </NavLink>
          </nav>
        </div>

        {/* Sidebar Bottom: Álbum de micos + User */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#FFF3D6] p-4 text-navy-900">
            <p className="text-xs font-extrabold text-navy-900">Álbum de micos</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-900/80">
              {micosSuperados} superados. Errar aqui é parte do jogo.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 px-1 pt-1">
            <Link to="/profile" className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-extrabold text-white">
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-navy-900">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">Nível {levelLabel}</p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sair"
              className="rounded-xl p-2 text-muted-foreground hover:bg-brand-50 hover:text-navy-900"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col min-w-0 pb-24 md:pb-10">
        {/* Mobile Top Header */}
        <header className="flex items-center justify-between px-5 pt-4 pb-2 safe-top md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={BRAND_ASSETS.mobileWordmark}
              alt="Sem Mico"
              className="h-6 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-extrabold text-navy-900 shadow-2xs">
              <Flame className="h-4 w-4 fill-streak/20 text-streak" />
              <span>{displayStreak}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-xs font-extrabold text-navy-900 shadow-2xs">
              <Zap className="h-4 w-4 fill-xp/20 text-xp" />
              <span>{xp} XP</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-4 md:px-9 md:py-8">
          {children}
        </main>
      </div>

      {/* Floating Mico Tutor FAB */}
      <div className="fixed right-5 bottom-22 z-30 flex items-center gap-3 md:right-8 md:bottom-6">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => openTutor()}
          className="hidden rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-extrabold text-navy-900 shadow-md hover:bg-brand-50 md:inline-flex"
        >
          Pergunte ao Mico
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => openTutor()}
          aria-label="Pergunte ao Mico"
          className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-mico bg-white p-1.5 shadow-chunky-mico"
        >
          <img
            src={BRAND_ASSETS.mascotAvatar}
            alt="Pergunte ao Mico"
            className="h-full w-full object-contain"
          />
        </motion.button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Navegação mobile"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-brand-100 bg-white px-2 py-2 safe-bottom md:hidden"
      >
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 text-xs font-bold',
              isActive ? 'text-brand-600' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex items-center justify-center rounded-full px-5 py-1.5',
                  isActive ? 'bg-brand-100 text-brand-600' : 'text-navy-900/70',
                )}
              >
                <Home className="h-5 w-5" />
              </span>
              <span>Início</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={handleVocabClick}
          className="flex flex-col items-center gap-1 text-xs font-bold text-muted-foreground"
        >
          <span className="flex items-center justify-center rounded-full px-5 py-1.5 text-navy-900/70">
            <Layers className="h-5 w-5" />
          </span>
          <span>Vocab</span>
        </button>

        <button
          type="button"
          onClick={handleChatClick}
          className="flex flex-col items-center gap-1 text-xs font-bold text-muted-foreground"
        >
          <span className="flex items-center justify-center rounded-full px-5 py-1.5 text-navy-900/70">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span>Chat</span>
        </button>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 text-xs font-bold',
              isActive ? 'text-brand-600' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex items-center justify-center rounded-full px-5 py-1.5',
                  isActive ? 'bg-brand-100 text-brand-600' : 'text-navy-900/70',
                )}
              >
                <UserRound className="h-5 w-5" />
              </span>
              <span>Perfil</span>
            </>
          )}
        </NavLink>
      </nav>
    </div>
  )
}
