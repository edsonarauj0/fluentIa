import { create } from 'zustand'
import type { MascotState, MissionStepId, UserProfile } from '@/types/domain'

export const MISSION_XP_REWARD = 45
export const STEP_XP_REWARD = 15

type GamificationState = {
  xp: number
  streak: number
  level: number
  completedSteps: MissionStepId[]
  activeStep: MissionStepId
  mascotState: MascotState
  isTutorOpen: boolean
  tutorInitialTerm: string
  soundEnabled: boolean
  vocabPendingCount: number
  micosSuperados: number
  syncFromUser: (user: UserProfile | null, isTodayChallengeDone?: boolean) => void
  completeStep: (step: MissionStepId) => boolean
  markAllStepsCompleted: () => void
  resetSteps: () => void
  setActiveStep: (step: MissionStepId) => void
  setMascotState: (state: MascotState) => void
  openTutor: (initialTerm?: string) => void
  closeTutor: () => void
  setSoundEnabled: (enabled: boolean) => void
  incrementMicoSuperado: () => void
}

export function computeLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1)
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  xp: 0,
  streak: 0,
  level: 1,
  completedSteps: [],
  activeStep: 'read',
  mascotState: 'idle',
  isTutorOpen: false,
  tutorInitialTerm: '',
  soundEnabled: false,
  vocabPendingCount: 12,
  micosSuperados: 0,

  syncFromUser: (user, isTodayChallengeDone = false) => {
    if (!user) {
      set({
        xp: 0,
        streak: 0,
        level: 1,
        completedSteps: [],
        soundEnabled: false,
        micosSuperados: 0,
      })
      return
    }

    const baseXp = user.xp ?? user.completedChallengeIds.length * MISSION_XP_REWARD
    set((state) => ({
      xp: baseXp,
      streak: user.streak ?? 0,
      level: computeLevel(baseXp),
      soundEnabled: user.soundEnabled ?? false,
      micosSuperados: user.micosSuperados ?? state.micosSuperados,
      completedSteps: isTodayChallengeDone ? ['read', 'listen', 'quiz'] : state.completedSteps,
    }))
  },

  completeStep: (step) => {
    const { completedSteps, xp } = get()
    if (completedSteps.includes(step)) {
      return false
    }

    const nextSteps = [...completedSteps, step]
    const nextXp = xp + STEP_XP_REWARD
    set({
      completedSteps: nextSteps,
      xp: nextXp,
      level: computeLevel(nextXp),
      mascotState: 'celebrating',
    })
    return true
  },

  markAllStepsCompleted: () => {
    set((state) => {
      const missingCount = 3 - state.completedSteps.length
      const addedXp = missingCount > 0 ? missingCount * STEP_XP_REWARD : 0
      const nextXp = state.xp + addedXp
      return {
        completedSteps: ['read', 'listen', 'quiz'],
        xp: nextXp,
        level: computeLevel(nextXp),
        mascotState: 'celebrating',
      }
    })
  },

  resetSteps: () => {
    set({
      completedSteps: [],
      activeStep: 'read',
      mascotState: 'idle',
    })
  },

  setActiveStep: (step) => set({ activeStep: step }),

  setMascotState: (mascotState) => set({ mascotState }),

  openTutor: (initialTerm = '') =>
    set({
      isTutorOpen: true,
      tutorInitialTerm: initialTerm,
      mascotState: 'thinking',
    }),

  closeTutor: () =>
    set({
      isTutorOpen: false,
      mascotState: 'idle',
    }),

  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),

  incrementMicoSuperado: () =>
    set((state) => ({
      micosSuperados: state.micosSuperados + 1,
    })),
}))
