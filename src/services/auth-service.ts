import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { defaultPreferences } from '@/lib/constants'
import { readStorage, writeStorage } from '@/lib/storage'
import { getFirebaseAuth, getFirestoreDb } from '@/services/firebase'
import type { AuthCredentials, AuthMode, UserProfile } from '@/types/domain'

const USERS_KEY = 'fluentia.users'
const SESSION_KEY = 'fluentia.session'

type SessionResult = {
  user: UserProfile | null
  mode: AuthMode
}

type StoredUser = UserProfile & { password: string }

export const authService = {
  async getCurrentUser(): Promise<SessionResult> {
    const auth = getFirebaseAuth()
    if (auth) {
      const currentUser = auth.currentUser
      if (!currentUser) {
        return { user: null, mode: 'firebase' }
      }

      const profile = await getFirebaseProfile(
        currentUser.uid,
        currentUser.email ?? '',
        currentUser.displayName ?? undefined,
      )
      return { user: profile, mode: 'firebase' }
    }

    const session = readStorage<string | null>(SESSION_KEY, null)
    const users = readStorage<StoredUser[]>(USERS_KEY, [])
    const user = users.find((item) => item.id === session) ?? null
    return { user: stripPassword(user), mode: 'demo' }
  },

  async signIn({ email, password }: AuthCredentials): Promise<SessionResult> {
    const auth = getFirebaseAuth()
    if (auth) {
      const credential = await signInWithEmailAndPassword(auth, email, password)
      const profile = await getFirebaseProfile(
        credential.user.uid,
        credential.user.email ?? email,
        credential.user.displayName ?? undefined,
      )
      return { user: profile, mode: 'firebase' }
    }

    const users = readStorage<StoredUser[]>(USERS_KEY, [])
    const user = users.find((item) => item.email === email && item.password === password)
    if (!user) {
      throw new Error('Usuario nao encontrado no modo demo. Crie uma conta primeiro.')
    }

    writeStorage(SESSION_KEY, user.id)
    return { user: stripPassword(user), mode: 'demo' }
  },

  async signUp({ email, password, name }: AuthCredentials): Promise<SessionResult> {
    const auth = getFirebaseAuth()
    if (auth) {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateFirebaseProfile(credential.user, { displayName: name })
      }

      const profile = createBaseProfile(credential.user.uid, email, name)
      await saveFirebaseProfile(profile)
      return { user: profile, mode: 'firebase' }
    }

    const users = readStorage<StoredUser[]>(USERS_KEY, [])
    if (users.some((item) => item.email === email)) {
      throw new Error('Esse e-mail ja esta cadastrado no modo demo.')
    }

    const user: StoredUser = {
      id: crypto.randomUUID(),
      name: name ?? email.split('@')[0],
      email,
      password,
      preferences: defaultPreferences,
      streak: 0,
      completedChallengeIds: [],
      lastCompletedAt: null,
    }

    writeStorage(USERS_KEY, [...users, user])
    writeStorage(SESSION_KEY, user.id)
    return { user: stripPassword(user), mode: 'demo' }
  },

  async signOut() {
    const auth = getFirebaseAuth()
    if (auth) {
      await firebaseSignOut(auth)
      return
    }

    localStorage.removeItem(SESSION_KEY)
  },

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    const auth = getFirebaseAuth()
    if (auth?.currentUser) {
      await updateFirebaseProfile(auth.currentUser, { displayName: profile.name })
      await saveFirebaseProfile(profile)
      return profile
    }

    const users = readStorage<StoredUser[]>(USERS_KEY, [])
    const nextUsers = users.map((user) => (user.id === profile.id ? { ...user, ...profile } : user))
    writeStorage(USERS_KEY, nextUsers)
    return profile
  },
}

function stripPassword(user: StoredUser | null): UserProfile | null {
  if (!user) return null

  const { password: _password, ...profile } = user
  return profile
}

function createBaseProfile(id: string, email: string, name?: string): UserProfile {
  return {
    id,
    email,
    name: name ?? email.split('@')[0],
    preferences: defaultPreferences,
    streak: 0,
    completedChallengeIds: [],
    lastCompletedAt: null,
  }
}

async function getFirebaseProfile(id: string, email: string, name?: string): Promise<UserProfile> {
  const db = getFirestoreDb()
  if (!db) {
    return createBaseProfile(id, email, name)
  }

  const ref = doc(db, 'profiles', id)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    const profile = createBaseProfile(id, email, name)
    await setDoc(ref, profile, { merge: true })
    return profile
  }

  const data = snapshot.data() as Partial<UserProfile>
  return {
    ...createBaseProfile(id, email, name),
    ...data,
    id,
    email,
    name: data.name ?? name ?? email.split('@')[0],
    preferences: {
      ...defaultPreferences,
      ...data.preferences,
    },
    streak: data.streak ?? 0,
    completedChallengeIds: data.completedChallengeIds ?? [],
    lastCompletedAt: data.lastCompletedAt ?? null,
  }
}

async function saveFirebaseProfile(profile: UserProfile) {
  const db = getFirestoreDb()
  if (!db) return

  await setDoc(doc(db, 'profiles', profile.id), profile, { merge: true })
}
