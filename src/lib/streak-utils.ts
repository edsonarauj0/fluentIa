import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'

export type WeekDayProgress = {
  key: string
  label: string
  dateIso: string
  status: 'past' | 'today' | 'future'
  completed: boolean
}

const PT_BR_WEEK_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] as const

export function calculateStreak(
  currentStreak: number,
  lastCompletedAt: string | null,
  referenceDate: Date = new Date(),
): number {
  if (!lastCompletedAt) {
    return 1
  }

  try {
    const lastDate = startOfDay(parseISO(lastCompletedAt))
    const today = startOfDay(referenceDate)
    const diffDays = differenceInCalendarDays(today, lastDate)

    if (diffDays <= 0) {
      return Math.max(1, currentStreak)
    }

    if (diffDays === 1) {
      return currentStreak + 1
    }

    return 1
  } catch {
    return 1
  }
}

export function buildWeekProgress(
  completedChallengeIds: string[] = [],
  lastCompletedAt: string | null = null,
  referenceDate: Date = new Date(),
): WeekDayProgress[] {
  const today = startOfDay(referenceDate)
  const monday = startOfWeek(today, { weekStartsOn: 1 })

  const completedDates = new Set<string>()
  for (const id of completedChallengeIds) {
    const parts = id.split(':')
    const maybeDate = parts[parts.length - 1]
    if (/^\d{4}-\d{2}-\d{2}$/.test(maybeDate)) {
      completedDates.add(maybeDate)
    }
  }

  if (lastCompletedAt) {
    completedDates.add(lastCompletedAt.slice(0, 10))
  }

  return PT_BR_WEEK_LABELS.map((label, index) => {
    const dayDate = addDays(monday, index)
    const dateIso = format(dayDate, 'yyyy-MM-dd')
    const isTodayDay = isSameDay(dayDate, today)
    const isPastDay = isBefore(dayDate, today) && !isTodayDay

    return {
      key: `${dateIso}-${index}`,
      label,
      dateIso,
      status: isTodayDay ? 'today' : isPastDay ? 'past' : 'future',
      completed: completedDates.has(dateIso),
    }
  })
}
