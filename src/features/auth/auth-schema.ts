import { z } from 'zod'

/** Versão dos termos aceitos. Aumente quando mudar o texto legal. */
export const TERMS_VERSION = '2026-11'

/*
 * ATENÇÃO: alinhe os `value` abaixo com os valores que a ProfilePage
 * já usa para nível e categoria, para o cadastro e o perfil falarem a mesma língua.
 */
export const LEVELS = [
  { value: 'beginner', label: 'Iniciante', hint: 'Entendo o básico e quero ganhar confiança' },
  { value: 'intermediate', label: 'Intermediário', hint: 'Me viro, mas travo na hora de falar' },
  { value: 'advanced', label: 'Avançado', hint: 'Quero fluência e vocabulário refinado' },
] as const

export const GOALS = [
  { value: 'work', label: 'Trabalho e carreira' },
  { value: 'travel', label: 'Viajar sem medo' },
  { value: 'study', label: 'Estudos e intercâmbio' },
  { value: 'conversation', label: 'Conversar com confiança' },
  { value: 'fun', label: 'Séries, músicas e livros' },
] as const

export const DAILY_MINUTES = [
  { value: '5', label: '5 min', hint: 'Leve' },
  { value: '10', label: '10 min', hint: 'Ideal' },
  { value: '20', label: '20 min', hint: 'Intenso' },
] as const

export const CATEGORIES = [
  { value: 'poem', label: 'Poemas' },
  { value: 'tale', label: 'Contos' },
  { value: 'story', label: 'Histórias' },
  { value: 'horror', label: 'Histórias de terror' },
  { value: 'chronicle', label: 'Crônicas' },
  { value: 'news', label: 'Notícias' },
] as const

const email = z.string().trim().email('Digite um e-mail válido, como voce@email.com.')

export const loginSchema = z.object({
  email,
  password: z.string().min(6, 'A senha tem pelo menos 6 caracteres.'),
  remember: z.boolean(),
})

export const resetSchema = z.object({ email })

export const registerSchema = z.object({
  // Passo 1: conta
  name: z.string().trim().min(2, 'Como o Mico deve te chamar? Use ao menos 2 letras.'),
  email,
  password: z
    .string()
    .min(8, 'Use ao menos 8 caracteres.')
    .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra.')
    .regex(/\d/, 'Inclua pelo menos um número.'),

  // Passo 2: como você aprende
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    message: 'Escolha o nível que mais combina com você.',
  }),
  goal: z.enum(['work', 'travel', 'study', 'conversation', 'fun'], {
    message: 'Escolha o seu principal objetivo.',
  }),
  dailyMinutes: z.enum(['5', '10', '20']),
  categories: z.array(z.string()).min(1, 'Escolha pelo menos um tipo de texto.'),
  acceptTerms: z.boolean().refine((value) => value === true, 'Aceite os termos para criar a conta.'),
  marketingOptIn: z.boolean(),
})

export type LoginData = z.infer<typeof loginSchema>
export type ResetData = z.infer<typeof resetSchema>
export type RegisterData = z.infer<typeof registerSchema>

/** Campos do passo 1, usados para validar antes de avançar. */
export const REGISTER_STEP_ONE_FIELDS = ['name', 'email', 'password'] as const

/** Dados extras gravados em `users/{uid}` junto com nome e e-mail. */
export interface SignupProfile {
  englishLevel: RegisterData['level']
  goal: RegisterData['goal']
  dailyMinutes: number
  categories: string[]
  consent: {
    termsVersion: string
    termsAcceptedAt: string
    marketingOptIn: boolean
  }
  meta: {
    locale: string
    timeZone: string
    signupSource: 'web'
    onboardingCompleted: boolean
  }
}

export function buildSignupProfile(values: RegisterData): SignupProfile {
  return {
    englishLevel: values.level,
    goal: values.goal,
    dailyMinutes: Number(values.dailyMinutes),
    categories: values.categories,
    consent: {
      termsVersion: TERMS_VERSION,
      termsAcceptedAt: new Date().toISOString(),
      marketingOptIn: values.marketingOptIn,
    },
    meta: {
      locale: typeof navigator !== 'undefined' ? navigator.language : 'pt-BR',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      signupSource: 'web',
      onboardingCompleted: true,
    },
  }
}

/** Traduz códigos do Firebase Auth em mensagens que explicam o que fazer. */
export function friendlyAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha não bateram. Confira os dois ou recupere a senha.'
    case 'auth/email-already-in-use':
      return 'Esse e-mail já tem conta. Entre com ele ou recupere a senha.'
    case 'auth/weak-password':
      return 'Essa senha é fraca. Use 8 caracteres ou mais, com letras e números.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
    case 'auth/network-request-failed':
      return 'Sem conexão no momento. Verifique sua internet e tente de novo.'
    default:
      return error instanceof Error && error.message
        ? error.message
        : 'Não foi possível concluir agora. Tente de novo em instantes.'
  }
}

/** Nota de 0 a 4 para o medidor de força da senha. */
export function passwordScore(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++
  return score
}
