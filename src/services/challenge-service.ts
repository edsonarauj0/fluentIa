import { aiService } from '@/services/ai-service'
import { readStorage, writeStorage } from '@/lib/storage'
import type { Challenge, Difficulty, UserProfile } from '@/types/domain'
import { getFirestoreDb } from '@/services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const CHALLENGES_KEY = 'fluentia.challenges'

type StoredChallenges = Record<string, Challenge>

export const challengeService = {
  async getDailyChallenge(user: UserProfile, force = false) {
    const key = `${user.id}:${new Date().toISOString().slice(0, 10)}`
    const db = getFirestoreDb()

    if (db) {
      const ref = doc(db, 'dailyChallenges', key)
      const snapshot = await getDoc(ref)

      if (!force && snapshot.exists()) {
        const data = snapshot.data() as Challenge & { userId: string }
        const { userId: _userId, ...challenge } = data
        return { challenge, mode: challenge.source }
      }
    }

    const stored = readStorage<StoredChallenges>(CHALLENGES_KEY, {})

    if (!force && stored[key]) {
      return { challenge: stored[key], mode: stored[key].source }
    }

    const generated = await aiService.generateChallenge(user.preferences)
    const challenge: Challenge = {
      id: key,
      date: new Date().toISOString(),
      category: user.preferences.category,
      title: generated.title,
      text: generated.text,
      reflectionQuestion: generated.reflectionQuestion,
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

  async explainSelection(challenge: Challenge, selection: string, level: Difficulty) {
    return aiService.explainSelection(challenge, selection, level)
  },

  async completeChallenge(user: UserProfile, challengeId: string): Promise<UserProfile> {
    if (user.completedChallengeIds.includes(challengeId)) {
      return user
    }

    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    const lastCompletedAt = user.lastCompletedAt?.slice(0, 10) ?? null

    const streak =
      lastCompletedAt === today ? user.streak : lastCompletedAt === yesterday ? user.streak + 1 : 1

    const nextUser = {
      ...user,
      streak,
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
