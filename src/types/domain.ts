export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ThemeName = 'sunrise' | 'forest' | 'ocean'
export type AuthMode = 'demo' | 'firebase'

export type StudyPreferences = {
  category: string
  level: Difficulty
  theme: ThemeName
  maxCharacters: number
}

export type UserProfile = {
  id: string
  name: string
  email: string
  preferences: StudyPreferences
  streak: number
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
