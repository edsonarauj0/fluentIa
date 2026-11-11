import { aiService } from '@/services/ai-service'
import { readStorage, writeStorage } from '@/lib/storage'
import { calculateStreak } from '@/lib/streak-utils'
import type {
  Challenge,
  ChallengePreferencesSnapshot,
  Difficulty,
  StudySubject,
  UserProfile,
} from '@/types/domain'
import { getFirestoreDb } from '@/services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const CHALLENGES_KEY = 'sem-mico.challenges'

type StoredChallenges = Record<string, Challenge>

export const challengeService = {
  async getDailyChallenge(
    user: UserProfile,
    force = false,
    activeSubject?: StudySubject | null,
  ) {
    const subjectPart = activeSubject ? `:${activeSubject.id}:L${activeSubject.currentLessonNumber}` : ''
    const key = `${user.id}:${new Date().toISOString().slice(0, 10)}${subjectPart}`
    const db = getFirestoreDb()

    if (db) {
      const ref = doc(db, 'dailyChallenges', key)
      const snapshot = await getDoc(ref)

      if (!force && snapshot.exists()) {
        const data = snapshot.data() as Challenge & { userId?: string }
        const challenge: Challenge = {
          id: data.id,
          date: data.date,
          category: data.category,
          title: data.title,
          text: data.text,
          reflectionQuestion: data.reflectionQuestion,
          subjectId: data.subjectId,
          lessonNumber: data.lessonNumber,
          mentorTip: data.mentorTip,
          preferencesSnapshot: data.preferencesSnapshot,
          source: data.source,
          completed: data.completed,
        }
        if (isChallengeCompatible(challenge, user, activeSubject)) {
          return { challenge, mode: challenge.source }
        }
      }
    }

    const stored = readStorage<StoredChallenges>(CHALLENGES_KEY, {})

    if (!force && stored[key] && isChallengeCompatible(stored[key], user, activeSubject)) {
      return { challenge: stored[key], mode: stored[key].source }
    }

    const generated = activeSubject
      ? await aiService.generateChallenge(user.preferences, activeSubject)
      : await aiService.generateChallenge(user.preferences)
    const challenge: Challenge = {
      id: key,
      date: new Date().toISOString(),
      category: activeSubject?.title ?? user.preferences.category,
      title: generated.title,
      text: generated.text,
      reflectionQuestion: generated.reflectionQuestion,
      subjectId: activeSubject?.id,
      lessonNumber: activeSubject?.currentLessonNumber,
      mentorTip: generated.mentorTip,
      preferencesSnapshot: buildPreferencesSnapshot(user, activeSubject),
      source: generated.mode,
      completed: user.completedChallengeIds.includes(key),
    }

    if (db) {
      await setDoc(doc(db, 'dailyChallenges', key), { ...challenge, userId: user.id }, { merge: true })
      return { challenge, mode: generated.mode }
    }

    writeStorage(CHALLENGES_KEY, { ...stored, [key]: challenge })
    return { challenge, mode: generated.mode }
  },

  async explainSelection(
    challenge: Challenge,
    selection: string,
    level: Difficulty,
    activeSubject?: StudySubject | null,
  ) {
    return activeSubject
      ? aiService.explainSelection(challenge, selection, level, activeSubject)
      : aiService.explainSelection(challenge, selection, level)
  },

  async completeChallenge(user: UserProfile, challengeId: string): Promise<UserProfile> {
    if (user.completedChallengeIds.includes(challengeId)) {
      return user
    }

    const streak = calculateStreak(user.streak, user.lastCompletedAt)
    const nextXp = (user.xp ?? 0) + 45

    const nextUser: UserProfile = {
      ...user,
      streak,
      xp: nextXp,
      completedChallengeIds: [...user.completedChallengeIds, challengeId],
      lastCompletedAt: new Date().toISOString(),
    }

    const db = getFirestoreDb()
    if (db) {
      await setDoc(doc(db, 'profiles', user.id), nextUser, { merge: true })
      await setDoc(doc(db, 'dailyChallenges', challengeId), { completed: true, userId: user.id }, { merge: true })
    }

    return nextUser
  },
}

function buildPreferencesSnapshot(
  user: UserProfile,
  activeSubject?: StudySubject | null,
): ChallengePreferencesSnapshot {
  return {
    category: user.preferences.category,
    level: activeSubject?.level ?? user.preferences.level,
    maxCharacters: user.preferences.maxCharacters,
    ...(activeSubject ? { subjectId: activeSubject.id } : {}),
  }
}

function isChallengeCompatible(
  challenge: Challenge,
  user: UserProfile,
  activeSubject?: StudySubject | null,
) {
  const snapshot = challenge.preferencesSnapshot
  if (!snapshot) return false

  const current = buildPreferencesSnapshot(user, activeSubject)
  return (
    snapshot.category === current.category &&
    snapshot.level === current.level &&
    snapshot.maxCharacters === current.maxCharacters &&
    snapshot.subjectId === current.subjectId
  )
}
