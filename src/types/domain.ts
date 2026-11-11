export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type ThemeName = 'sunrise' | 'forest' | 'ocean'
export type AuthMode = 'demo' | 'firebase'
export type MascotState = 'idle' | 'thinking' | 'celebrating' | 'blushing' | 'sleeping'
export type MissionStepId = 'read' | 'listen' | 'quiz'

export type SubjectIconName = 'briefcase' | 'plane' | 'coffee' | 'message' | 'sparkles'
export type SubjectStatus = 'active' | 'paused' | 'archived'
export type SubjectTrackType = 'goal' | 'continuous'
export type SubjectChatMode = 'optional' | 'always' | 'off'
export type SubjectTone = 'Formal' | 'Casual' | 'Técnico'

export type SubjectLesson = {
  number: number
  title: string
  subtitle: string
  status: 'completed' | 'today' | 'ready'
  durationMinutes: number
  readingText?: string
  reflectionQuestion?: string
  mentorTip?: string
}

export type SubjectScenario = {
  id: string
  title: string
  subtitle: string
}

export type StudySubject = {
  id: string
  title: string
  summary: string
  prompt: string
  expertPersona?: string
  icon: SubjectIconName
  status: SubjectStatus
  trackType: SubjectTrackType
  targetDateLabel?: string
  currentLessonNumber: number
  completedLessonsCount: number
  completedLessonsSummary: string
  totalLessons: number | null
  level: Difficulty
  tone: SubjectTone
  durationMinutes: number
  chatMode: SubjectChatMode
  lessons: SubjectLesson[]
  chatScenarios: SubjectScenario[]
  keywords: string[]
  totalKeywordsPool: number
  createdAt: string
}

export type StudyPreferences = {
  category: string
  level: Difficulty
  theme: ThemeName
  maxCharacters: number
  dailyGoalMinutes?: number
  remindersEnabled?: boolean
}

export type ChallengePreferencesSnapshot = Pick<StudyPreferences, 'category' | 'level' | 'maxCharacters'> & {
  subjectId?: string
}

export type UserProfile = {
  id: string
  name: string
  email: string
  preferences: StudyPreferences
  streak: number
  xp?: number
  soundEnabled?: boolean
  micosSuperados?: number
  activeSubjectId?: string
  subjects?: StudySubject[]
  completedChallengeIds: string[]
  lastCompletedAt: string | null
}

export type AuthCredentials = {
  email: string
  password: string
  name?: string
  remember?: boolean
  profile?: unknown
}

export type Challenge = {
  id: string
  date: string
  category: string
  title: string
  text: string
  reflectionQuestion: string
  subjectId?: string
  lessonNumber?: number
  mentorTip?: string
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
