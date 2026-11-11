export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ThemeName = 'sunrise' | 'forest' | 'ocean'
export type AuthMode = 'demo' | 'firebase'
export type MascotState = 'idle' | 'thinking' | 'celebrating' | 'blushing' | 'sleeping'
export type MissionStepId = 'read' | 'listen' | 'quiz'

export type StudyPreferences = {
  category: string
  level: Difficulty
  theme: ThemeName
  maxCharacters: number
}

export type ChallengePreferencesSnapshot = Pick<StudyPreferences, 'category' | 'level' | 'maxCharacters'>

export type UserProfile = {
  id: string
  name: string
  email: string
  preferences: StudyPreferences
  streak: number
  xp?: number
  soundEnabled?: boolean
  micosSuperados?: number
  completedChallengeIds: string[]
  lastCompletedAt: string | null
}

export type AuthCredentials = {
  email: string
  password: string
  name?: string
}

export type Challenge = {
  id: string
  date: string
  category: string
  title: string
  text: string
  reflectionQuestion: string
  preferencesSnapshot?: ChallengePreferencesSnapshot
  source: 'gemini' | 'fallback'
  completed: boolean
}

export type WordInsight = {
  term: string
  translation: string
  meaning: string
  example: string
  synonyms: string[]
  pronunciation: string
  context: string
}
