import type { Difficulty, StudyPreferences, ThemeName } from '@/types/domain'

export const categories = ['News', 'Chronicles', 'Poems', 'Stories', 'Short tales', 'Custom topic']

export const difficulties: { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediario' },
  { value: 'advanced', label: 'Avancado' },
]

export const themes: { value: ThemeName; label: string }[] = [
  { value: 'sunrise', label: 'Sunrise lime' },
  { value: 'forest', label: 'Forest calm' },
  { value: 'ocean', label: 'Ocean focus' },
]

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediario',
  advanced: 'Avancado',
}

export const themeLabels: Record<ThemeName, string> = {
  sunrise: 'Sunrise lime',
  forest: 'Forest calm',
  ocean: 'Ocean focus',
}

export const defaultPreferences: StudyPreferences = {
  category: categories[0],
  level: 'beginner',
  theme: 'sunrise',
  maxCharacters: 450,
}
