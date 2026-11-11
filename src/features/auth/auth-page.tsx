import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, type UseFormRegisterReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-context'
import { MicoFace, type MicoMood } from '@/features/auth/MicoFace'
import {
  CATEGORIES,
  DAILY_MINUTES,
  GOALS,
  LEVELS,
  buildSignupProfile,
  friendlyAuthError,
  loginSchema,
  passwordScore,
  registerSchema,
  resetSchema,
  type LoginData,
  type RegisterData,
  type ResetData,
} from '@/features/auth/auth-schema'

type View = 'login' | 'register' | 'reset'

/* ------------------------------------------------------------------ */
/* Etapas do cadastro: cada uma cabe na tela sem rolagem               */
/* ------------------------------------------------------------------ */

const STEP_FIELDS: (keyof RegisterData)[][] = [
  ['name', 'email'],
  ['level'],
  ['goal'],
  ['dailyMinutes'],
  ['categories'],
  ['password', 'acceptTerms'],
]
const LAST_STEP = STEP_FIELDS.length

const REGISTER_HEADINGS = [
  { title: 'Crie sua conta', text: 'Leva cerca de 1 minuto. Errar aqui é parte do jogo.' },
  { title: 'Qual é o seu nível hoje?', text: 'Sem pressão: você pode mudar isso depois no perfil.' },
  { title: 'Por que aprender inglês?', text: 'O Mico escolhe textos que combinam com o seu objetivo.' },
  { title: 'Quanto tempo por dia?', text: 'Pouco todo dia vale mais do que muito de vez em quando.' },
  { title: 'O que você gosta de ler?', text: 'Escolha quantos quiser.' },
  { title: 'Quase lá!', text: 'Crie uma senha para guardar o seu progresso.' },
]

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28 }),
}

/* ------------------------------------------------------------------ */
/* Peças pequenas                                                      */
/* ------------------------------------------------------------------ */

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-amber-700">
          {error}
        </p>
      )}
    </div>
  )
}

function PasswordInput({
  id,
  registration,
  autoComplete,
  invalid,
  placeholder,
}: {
  id: string
  registration: UseFormRegisterReturn
  autoComplete: string
  invalid: boolean
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="pr-12"
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  )
}

function StrengthMeter({ password }: { password: string }) {
  const score = passwordScore(password)
  const labels = ['Muito curta', 'Fraca', 'Razoável', 'Boa', 'Forte']
  const colors = ['bg-slate-200', 'bg-amber-400', 'bg-amber-400', 'bg-brand-500', 'bg-emerald-500']
  if (!password) return null
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${step <= score ? colors[score] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500">Senha: {labels[score].toLowerCase()}</p>
    </div>
  )
}

/**
 * Cartão de escolha (radio ou checkbox).
 * `onPick` avança a etapa sozinho quando a pessoa toca/clica (não dispara pelo teclado,
 * para não atrapalhar quem navega com as setas; quem usa teclado aperta "Continuar").
 */
function Choice({
  type,
  value,
  registration,
  children,
  className = '',
  onPick,
}: {
  type: 'radio' | 'checkbox'
  value: string
  registration: UseFormRegisterReturn
  children: ReactNode
  className?: string
  onPick?: () => void
}) {
  return (
    <label
      className={`relative block cursor-pointer ${className}`}
      onPointerUp={onPick ? () => window.setTimeout(onPick, 260) : undefined}
    >
      <input type={type} value={value} className="peer sr-only" {...registration} />
      <span className="flex h-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-slate-300 peer-checked:border-brand-500 peer-checked:bg-brand-100/60 peer-checked:text-slate-950 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-200 [@media(max-height:760px)]:py-2.5">
        {children}
      </span>
    </label>
  )
}

/** A pergunta já está no título da etapa, então a legenda fica só para leitores de tela. */
function Group({ legend, error, children }: { legend: string; error?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2.5">
      <legend className="sr-only">{legend}</legend>
      {children}
      {error && <p className="text-sm font-medium text-amber-700">{error}</p>}
    </fieldset>
  )
}

function MicoNote({ children, mood = 'blushing' }: { children: ReactNode; mood?: MicoMood }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-800"
    >
      <MicoFace mood={mood} className="h-9 w-9 shrink-0" />
      <p className="pt-1 leading-6">{children}</p>
    </div>
  )
}

function StepProgress({ step, total, onBack }: { step: number; total: number; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3">
      {step > 1 && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar para a etapa anterior"
          className="-ml-1 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div
        className="flex flex-1 gap-1.5"
        role="progressbar"
        aria-label={`Etapa ${step} de ${total}`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              index < step ? 'bg-brand-500' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold tabular-nums text-slate-500">
        {step}/{total}
      </span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Painel da marca: o leitor do app, em miniatura                      */
/* ------------------------------------------------------------------ */

const PREVIEW_WORDS = ['She', 'likes', 'to', 'wander', 'through', 'the', 'old', 'market.']
const SELECTED_WORD = 3

function ReaderPreview() {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let index = 0
    const timer = window.setInterval(() => {
      setActive(index % (PREVIEW_WORDS.length + 3)) // pausa curta entre as repetições
      index++
    }, 520)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="max-w-md" aria-hidden="true">
      <p className="font-reading text-2xl leading-[2.4rem] text-slate-100">
        {PREVIEW_WORDS.map((word, i) => (
          <span
            key={word}
            className={`mr-2 inline-block rounded-lg px-1.5 transition-colors duration-200 ${
              i === active ? 'bg-brand-500 text-white' : ''
            } ${i === SELECTED_WORD ? 'underline decoration-mico decoration-2 underline-offset-[6px]' : ''}`}
          >
            {word}
          </span>
        ))}
      </p>

      <div className="mt-5 flex items-start gap-3 rounded-3xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
        <MicoFace mood="idle" className="h-11 w-11 shrink-0" />
        <div className="text-sm leading-6">
          <p className="font-semibold text-white">
            wander <span className="font-normal text-slate-300">· vagar, andar sem rumo</span>
          </p>
          <p className="text-slate-300">Fala-se: “uón-der”</p>
        </div>
        <span className="ml-auto shrink-0 rounded-full bg-mico px-3 py-1 text-xs font-bold text-navy-900">
          +1 mico superado
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export function AuthPage() {
  const [view, setView] = useState<View>('login')
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const navigate = useNavigate()
  const { signIn, signUp, sendPasswordResetEmail, mode } = useAuth()

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: true },
  })
  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      dailyMinutes: '10',
      categories: [],
      acceptTerms: false,
      marketingOptIn: false,
    },
  })
  const resetForm = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  })

  const loginErrors = loginForm.formState.errors
  const regErrors = registerForm.formState.errors
  const resetErrors = resetForm.formState.errors
  const passwordValue = registerForm.watch('password')

  function go(next: View) {
    setView(next)
    setStep(1)
    setDirection(1)
    setError(null)
    setResetSent(false)
  }

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1)
    setStep(next)
    setError(null)
  }

  /** Valida só os campos da etapa atual e avança. */
  async function nextStep(from: number) {
    const valid = await registerForm.trigger(STEP_FIELDS[from - 1])
    if (valid) {
      setDirection(1)
      setStep(from + 1)
      setError(null)
    }
  }

  async function onLogin(values: LoginData) {
    setError(null)
    try {
      await signIn({ email: values.email, password: values.password, remember: values.remember })
      navigate('/')
    } catch (submissionError) {
      setError(friendlyAuthError(submissionError))
    }
  }

  async function onRegister(values: RegisterData) {
    setError(null)
    try {
      await signUp({
        email: values.email,
        password: values.password,
        name: values.name.trim() || 'Aprendiz',
        profile: buildSignupProfile(values),
      })
      navigate('/')
    } catch (submissionError) {
      const code = (submissionError as { code?: string })?.code
      if (code === 'auth/email-already-in-use') goToStep(1)
      setError(friendlyAuthError(submissionError))
    }
  }

  async function onReset(values: ResetData) {
    setError(null)
    try {
      await sendPasswordResetEmail(values.email)
      setResetSent(true)
    } catch (submissionError) {
      setError(friendlyAuthError(submissionError))
    }
  }

  const busy =
    loginForm.formState.isSubmitting || registerForm.formState.isSubmitting || resetForm.formState.isSubmitting
  const mood: MicoMood = busy ? 'thinking' : error ? 'blushing' : resetSent ? 'celebrating' : 'idle'

  const inWizard = view === 'register'
  const showTabs = view === 'login' || (inWizard && step === 1)

  const heading =
    view === 'login'
      ? { title: 'Que bom te ver de novo', text: 'Sua missão de hoje está esperando.' }
      : view === 'reset'
        ? { title: 'Recupere sua senha', text: 'Enviamos um link para o seu e-mail.' }
        : REGISTER_HEADINGS[step - 1]

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid h-dvh overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
        {/* ---------- Marca ---------- */}
        <section className="relative hidden overflow-hidden bg-navy-900 px-12 py-14 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,255,0.38),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(255,176,32,0.16),_transparent_30%)]" />

          <div className="relative flex items-center gap-3">
            <MicoFace mood="idle" className="h-11 w-11" />
            <p className="font-display text-2xl font-extrabold tracking-tight">
              Sem <span className="text-mico">Mico</span>
            </p>
          </div>

          <div className="relative space-y-10">
            <h1 className="max-w-md font-display text-5xl font-extrabold leading-[1.1] tracking-tight">
              Errar aqui é parte do jogo.
            </h1>
            <ReaderPreview />
          </div>

          <p className="relative max-w-sm text-sm leading-6 text-slate-300">
            Leitura, áudio e um tutor de IA no seu nível. Toda dúvida tirada vira um mico superado no seu álbum.
          </p>
        </section>

        {/* ---------- Formulário ---------- */}
        {/* overflow-y-auto fica só como rede de segurança para telas muito baixas */}
        <section className="flex min-h-0 flex-col items-center justify-center overflow-y-auto bg-[linear-gradient(180deg,_#ffffff_0%,_#F2F6FF_100%)] px-4 py-6 sm:px-6">
          {/* Marca no mobile (o painel lateral some abaixo de lg); some nas etapas 2+ para ganhar espaço */}
          <div className={`mb-4 items-center gap-2.5 lg:hidden ${inWizard && step > 1 ? 'hidden' : 'flex'}`}>
            <MicoFace mood={mood} className="h-9 w-9" />
            <p className="font-display text-xl font-extrabold text-navy-900">
              Sem <span className="text-mico">Mico</span>
            </p>
          </div>

          <Card className="w-full max-w-xl border-slate-200">
            <div className="mb-5 flex items-start justify-between gap-4 [@media(max-height:760px)]:mb-4">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-navy-900">{heading.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{heading.text}</p>
              </div>
              <div className="hidden shrink-0 rounded-2xl bg-brand-100 p-1.5 lg:block">
                <MicoFace mood={mood} className="h-11 w-11" />
              </div>
            </div>

            {mode === 'demo' && showTabs && (
              <p className="mb-4 rounded-2xl bg-slate-100 px-4 py-2 text-xs text-slate-600">
                Modo demo: suas informações ficam salvas só neste navegador.
              </p>
            )}

            {showTabs && (
              <div
                role="tablist"
                aria-label="Entrar ou criar conta"
                className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 [@media(max-height:760px)]:mb-4"
              >
                {(['login', 'register'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={view === tab}
                    onClick={() => go(tab)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 [@media(max-height:760px)]:py-2.5 ${
                      view === tab ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'login' ? 'Entrar' : 'Criar conta'}
                  </button>
                ))}
              </div>
            )}

            {/* ---------------- LOGIN ---------------- */}
            {view === 'login' && (
              <form
                className="space-y-5 [@media(max-height:760px)]:space-y-4"
                onSubmit={loginForm.handleSubmit(onLogin)}
                noValidate
              >
                <Field id="login-email" label="E-mail" error={loginErrors.email?.message}>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      className="pl-11"
                      placeholder="voce@email.com"
                      aria-invalid={!!loginErrors.email}
                      aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
                      {...loginForm.register('email')}
                    />
                  </div>
                </Field>

                <Field id="login-password" label="Senha" error={loginErrors.password?.message}>
                  <PasswordInput
                    id="login-password"
                    autoComplete="current-password"
                    invalid={!!loginErrors.password}
                    registration={loginForm.register('password')}
                  />
                </Field>

                <div className="flex items-center justify-between gap-4">
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 accent-[var(--color-brand-500,#2563FF)]"
                      {...loginForm.register('remember')}
                    />
                    Manter conectado
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm.setValue('email', loginForm.getValues('email'))
                      go('reset')
                    }}
                    className="rounded-lg text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
                  >
                    Esqueci a senha
                  </button>
                </div>

                {error && <MicoNote>{error}</MicoNote>}

                <Button variant="mico" type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            )}

            {/* ---------------- CADASTRO EM ETAPAS ---------------- */}
            {inWizard && (
              <form
                className="flex flex-col gap-5 [@media(max-height:760px)]:gap-4"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault()
                  if (step < LAST_STEP) {
                    void nextStep(step)
                  } else {
                    void registerForm.handleSubmit(onRegister)(event)
                  }
                }}
              >
                <StepProgress step={step} total={LAST_STEP} onBack={() => goToStep(step - 1)} />

                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div
                    key={step}
                    custom={direction}
                    variants={slide}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="flex min-h-[14.5rem] flex-col justify-center gap-4"
                  >
                    {/* 1. Nome e e-mail */}
                    {step === 1 && (
                      <>
                        <Field id="reg-name" label="Como podemos te chamar?" error={regErrors.name?.message}>
                          <Input
                            id="reg-name"
                            autoComplete="given-name"
                            placeholder="Seu nome"
                            aria-invalid={!!regErrors.name}
                            aria-describedby={regErrors.name ? 'reg-name-error' : undefined}
                            {...registerForm.register('name')}
                          />
                        </Field>
                        <Field id="reg-email" label="E-mail" error={regErrors.email?.message}>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                            <Input
                              id="reg-email"
                              type="email"
                              autoComplete="email"
                              className="pl-11"
                              placeholder="voce@email.com"
                              aria-invalid={!!regErrors.email}
                              aria-describedby={regErrors.email ? 'reg-email-error' : undefined}
                              {...registerForm.register('email')}
                            />
                          </div>
                        </Field>
                      </>
                    )}

                    {/* 2. Nível */}
                    {step === 2 && (
                      <Group legend="Qual é o seu nível hoje?" error={regErrors.level?.message}>
                        <div className="grid gap-2">
                          {LEVELS.map((item) => (
                            <Choice
                              key={item.value}
                              type="radio"
                              value={item.value}
                              registration={registerForm.register('level')}
                              onPick={() => void nextStep(2)}
                            >
                              <span>
                                <span className="block">{item.label}</span>
                                <span className="block text-xs font-normal text-slate-500">{item.hint}</span>
                              </span>
                            </Choice>
                          ))}
                        </div>
                      </Group>
                    )}

                    {/* 3. Objetivo */}
                    {step === 3 && (
                      <Group legend="Por que você quer aprender inglês?" error={regErrors.goal?.message}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {GOALS.map((item, index) => (
                            <Choice
                              key={item.value}
                              type="radio"
                              value={item.value}
                              registration={registerForm.register('goal')}
                              onPick={() => void nextStep(3)}
                              className={index === GOALS.length - 1 && GOALS.length % 2 === 1 ? 'sm:col-span-2' : ''}
                            >
                              {item.label}
                            </Choice>
                          ))}
                        </div>
                      </Group>
                    )}

                    {/* 4. Tempo por dia */}
                    {step === 4 && (
                      <Group legend="Quanto tempo por dia?" error={regErrors.dailyMinutes?.message}>
                        <div className="grid grid-cols-3 gap-2">
                          {DAILY_MINUTES.map((item) => (
                            <Choice
                              key={item.value}
                              type="radio"
                              value={item.value}
                              registration={registerForm.register('dailyMinutes')}
                              onPick={() => void nextStep(4)}
                            >
                              <span className="w-full py-2 text-center">
                                <span className="block font-display text-2xl font-extrabold">
                                  {item.label.replace(' min', '')}
                                </span>
                                <span className="block text-xs font-normal text-slate-500">
                                  min · {item.hint.toLowerCase()}
                                </span>
                              </span>
                            </Choice>
                          ))}
                        </div>
                      </Group>
                    )}

                    {/* 5. Categorias (várias) */}
                    {step === 5 && (
                      <Group legend="O que você gosta de ler?" error={regErrors.categories?.message}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {CATEGORIES.map((item) => (
                            <Choice
                              key={item.value}
                              type="checkbox"
                              value={item.value}
                              registration={registerForm.register('categories')}
                            >
                              {item.label}
                            </Choice>
                          ))}
                        </div>
                      </Group>
                    )}

                    {/* 6. Senha e termos */}
                    {step === 6 && (
                      <>
                        <Field id="reg-password" label="Crie uma senha" error={regErrors.password?.message}>
                          <PasswordInput
                            id="reg-password"
                            autoComplete="new-password"
                            placeholder="Mínimo de 8 caracteres"
                            invalid={!!regErrors.password}
                            registration={registerForm.register('password')}
                          />
                          <StrengthMeter password={passwordValue ?? ''} />
                        </Field>

                        <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4">
                          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[var(--color-brand-500,#2563FF)]"
                              {...registerForm.register('acceptTerms')}
                            />
                            <span>
                              Li e aceito os{' '}
                              <a href="/termos" target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">
                                Termos de uso
                              </a>{' '}
                              e a{' '}
                              <a href="/privacidade" target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">
                                Política de privacidade
                              </a>
                              .
                            </span>
                          </label>
                          {regErrors.acceptTerms && (
                            <p className="text-sm font-medium text-amber-700">{regErrors.acceptTerms.message}</p>
                          )}
                          <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[var(--color-brand-500,#2563FF)]"
                              {...registerForm.register('marketingOptIn')}
                            />
                            Quero receber lembretes e novidades por e-mail (opcional).
                          </label>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {error && <MicoNote>{error}</MicoNote>}

                <Button variant="mico" type="submit" size="lg" className="w-full" disabled={busy}>
                  {step < LAST_STEP ? 'Continuar' : busy ? 'Criando sua conta...' : 'Criar conta'}
                </Button>
              </form>
            )}

            {/* ---------------- RECUPERAR SENHA ---------------- */}
            {view === 'reset' && (
              <form className="space-y-5" onSubmit={resetForm.handleSubmit(onReset)} noValidate>
                {resetSent ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-slate-800">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-6">
                      Se esse e-mail tiver conta, o link de recuperação já está a caminho. Confira também a caixa de spam.
                    </p>
                  </div>
                ) : (
                  <>
                    <Field id="reset-email" label="E-mail da conta" error={resetErrors.email?.message}>
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="reset-email"
                          type="email"
                          autoComplete="email"
                          className="pl-11"
                          placeholder="voce@email.com"
                          aria-invalid={!!resetErrors.email}
                          aria-describedby={resetErrors.email ? 'reset-email-error' : undefined}
                          {...resetForm.register('email')}
                        />
                      </div>
                    </Field>
                    {error && <MicoNote>{error}</MicoNote>}
                    <Button variant="mico" type="submit" size="lg" className="w-full" disabled={busy}>
                      {busy ? 'Enviando...' : 'Enviar link'}
                    </Button>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => go('login')}
                  className="mx-auto flex items-center gap-2 rounded-lg text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para entrar
                </button>
              </form>
            )}
          </Card>
        </section>
      </div>
    </MotionConfig>
  )
}