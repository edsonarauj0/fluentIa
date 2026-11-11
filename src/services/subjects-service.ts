import { doc, getDoc, setDoc } from 'firebase/firestore'
import { readStorage, writeStorage } from '@/lib/storage'
import { getFirebaseAuth, getFirestoreDb } from '@/services/firebase'
import type { StudySubject, UserProfile } from '@/types/domain'

export const SUBJECTS_STORAGE_KEY = 'sem-mico.subjects.v1'
const USERS_KEY = 'sem-mico.users'
const SESSION_KEY = 'sem-mico.session'

/**
 * Remove recursivamente propriedades com valor `undefined` para que o
 * Firebase Firestore aceite os objetos sem erro de serialização.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as unknown as T
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, sanitizeForFirestore(v)])
    return Object.fromEntries(entries) as T
  }
  return value
}

function getScopedStorageKey(userId?: string | null) {
  return userId ? `${SUBJECTS_STORAGE_KEY}:${userId}` : SUBJECTS_STORAGE_KEY
}

function resolveCurrentUserId(explicitUserId?: string | null): string | null {
  if (explicitUserId) return explicitUserId
  const firebaseUid = getFirebaseAuth()?.currentUser?.uid
  if (firebaseUid) return firebaseUid
  return readStorage<string | null>(SESSION_KEY, null)
}

export const subjectsService = {
  /**
   * Carrega os assuntos e suas preferências do banco (Firestore `profiles/{userId}`)
   * ou do armazenamento local caso esteja em modo demo/offline.
   */
  async loadUserSubjects(
    fallbackSubjects: StudySubject[],
    explicitUserId?: string | null,
  ): Promise<{ subjects: StudySubject[]; source: 'firebase' | 'local' }> {
    const userId = resolveCurrentUserId(explicitUserId)
    const db = getFirestoreDb()

    if (db && userId) {
      try {
        const ref = doc(db, 'profiles', userId)
        const snapshot = await getDoc(ref)

        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<UserProfile> & {
            subjects?: StudySubject[]
          }

          if (Array.isArray(data.subjects) && data.subjects.length > 0) {
            writeStorage(getScopedStorageKey(userId), data.subjects)
            writeStorage(SUBJECTS_STORAGE_KEY, data.subjects)
            return { subjects: data.subjects, source: 'firebase' }
          }
        }

        // Se o documento do usuário no Firestore ainda não tinha `subjects`,
        // aproveita os assuntos locais existentes (ou os iniciais) e grava no banco.
        const localExisting = this.readLocalSubjects(fallbackSubjects, userId)
        await this.saveUserSubjects(localExisting, userId)
        return { subjects: localExisting, source: 'firebase' }
      } catch {
        // Em caso de falha de rede temporária, usa o cache local
        return {
          subjects: this.readLocalSubjects(fallbackSubjects, userId),
          source: 'local',
        }
      }
    }

    return {
      subjects: this.readLocalSubjects(fallbackSubjects, userId),
      source: 'local',
    }
  },

  /**
   * Salva todos os assuntos, lições e preferências (nível, duração, chatMode, status, etc.)
   * diretamente no banco de dados (Firestore `profiles/{userId}`) e sincroniza com as
   * preferências do perfil do usuário.
   */
  async saveUserSubjects(
    subjects: StudySubject[],
    explicitUserId?: string | null,
  ): Promise<'firebase' | 'local'> {
    const userId = resolveCurrentUserId(explicitUserId)
    const activeSubject =
      subjects.find((item) => item.status === 'active') ??
      subjects.find((item) => item.status === 'paused') ??
      subjects[0]

    // Salva sempre no cache local (geral e por usuário) para leitura instantânea
    writeStorage(SUBJECTS_STORAGE_KEY, subjects)
    if (userId) {
      writeStorage(getScopedStorageKey(userId), subjects)
    }

    // Atualiza também o registro do usuário no modo demo (`sem-mico.users`)
    if (userId) {
      const users = readStorage<Array<UserProfile & { password?: string }>>(USERS_KEY, [])
      if (users.some((u) => u.id === userId)) {
        const nextUsers = users.map((u) => {
          if (u.id !== userId) return u
          return {
            ...u,
            activeSubjectId: activeSubject?.id,
            subjects,
            preferences: activeSubject
              ? {
                  ...u.preferences,
                  level: activeSubject.level,
                  dailyGoalMinutes: activeSubject.durationMinutes,
                }
              : u.preferences,
          }
        })
        writeStorage(USERS_KEY, nextUsers)
      }
    }

    // Persiste no Firebase Firestore se configurado e autenticado
    const db = getFirestoreDb()
    if (db && userId) {
      const sanitizedSubjects = sanitizeForFirestore(subjects)
      const ref = doc(db, 'profiles', userId)

      const payload: Record<string, unknown> = {
        subjects: sanitizedSubjects,
        activeSubjectId: activeSubject?.id ?? null,
        updatedAt: new Date().toISOString(),
      }

      if (activeSubject) {
        payload.preferences = sanitizeForFirestore({
          category: activeSubject.title,
          level: activeSubject.level,
          dailyGoalMinutes: activeSubject.durationMinutes,
          theme: 'sunrise',
          maxCharacters: activeSubject.durationMinutes <= 5 ? 320 : activeSubject.durationMinutes >= 12 ? 650 : 450,
        })
      }

      await setDoc(ref, payload, { merge: true })
      return 'firebase'
    }

    return 'local'
  },

  readLocalSubjects(fallbackSubjects: StudySubject[], userId?: string | null): StudySubject[] {
    if (userId) {
      const scoped = readStorage<StudySubject[]>(getScopedStorageKey(userId), [])
      if (Array.isArray(scoped) && scoped.length > 0) {
        return scoped
      }

      const users = readStorage<UserProfile[]>(USERS_KEY, [])
      const foundUser = users.find((u) => u.id === userId)
      if (foundUser?.subjects && foundUser.subjects.length > 0) {
        return foundUser.subjects
      }
    }

    const saved = readStorage<StudySubject[]>(SUBJECTS_STORAGE_KEY, [])
    if (Array.isArray(saved) && saved.length > 0) {
      return saved
    }

    writeStorage(SUBJECTS_STORAGE_KEY, fallbackSubjects)
    return fallbackSubjects
  },
}
