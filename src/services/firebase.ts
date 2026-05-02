import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

let appCache: ReturnType<typeof initializeApp> | null | undefined
let authCache: ReturnType<typeof getAuth> | null | undefined
let dbCache: ReturnType<typeof getFirestore> | null | undefined

function getFirebaseConfig() {
  const env = globalThis.__FLUENTIA_ENV__

  const apiKey = env?.VITE_FIREBASE_API_KEY
  const authDomain = env?.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = env?.VITE_FIREBASE_PROJECT_ID
  const storageBucket = env?.VITE_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = env?.VITE_FIREBASE_MESSAGING_SENDER_ID
  const appId = env?.VITE_FIREBASE_APP_ID

  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    return null
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  }
}

export function getFirebaseApp() {
  if (appCache !== undefined) return appCache
  const config = getFirebaseConfig()
  appCache = config ? initializeApp(config) : null
  return appCache
}

export function getFirebaseAuth() {
  if (authCache !== undefined) return authCache
  const app = getFirebaseApp()
  authCache = app ? getAuth(app) : null
  return authCache
}

export function getFirestoreDb() {
  if (dbCache !== undefined) return dbCache
  const app = getFirebaseApp()
  dbCache = app ? getFirestore(app) : null
  return dbCache
}
