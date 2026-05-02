import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { BookMarked, KeyRound, Mail, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/auth-context'

const authSchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo.').optional(),
  email: z.string().email('Digite um e-mail valido.'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres.'),
})

type AuthFormData = z.infer<typeof authSchema>

export function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { signIn, signUp, mode } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '', name: '' },
  })

  async function onSubmit(values: AuthFormData) {
    setError(null)
    try {
      if (tab === 'login') {
        await signIn({ email: values.email, password: values.password })
      } else {
        await signUp({
          email: values.email,
          password: values.password,
          name: values.name?.trim() || 'New learner',
        })
      }

      navigate('/')
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Nao foi possivel autenticar.')
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(163,230,53,0.2),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(45,212,191,0.22),_transparent_28%)]" />
        <div className="relative">
          <p className="font-display text-2xl">FluentIA</p>
          <p className="mt-4 max-w-md text-lg leading-8 text-slate-300">
            Transforme leitura, escuta e curiosidade em um ritual diario de ingles com IA.
          </p>
        </div>
        <div className="relative space-y-6">
          {[
            'Textos diarios por categoria e nivel',
            'Audio com leitura pausada usando Web Speech API',
            'Selecione palavras e receba explicacoes da IA',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-5">
              <Sparkles className="mt-1 h-5 w-5 text-lime-300" />
              <p className="text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center bg-[linear-gradient(180deg,_#ffffff_0%,_#f7fee7_100%)] px-4 py-10 sm:px-6">
        <Card className="w-full max-w-xl border-slate-200">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <CardTitle>{tab === 'login' ? 'Entre na sua rotina' : 'Crie sua conta'}</CardTitle>
              <CardDescription className="mt-2">
                {mode === 'demo'
                  ? 'Modo demo ativo ate configurar Firebase e Gemini.'
                  : 'Firebase conectado e pronto para autenticar usuarios.'}
              </CardDescription>
            </div>
            <div className="rounded-2xl bg-lime-100 p-3 text-lime-700">
              {tab === 'login' ? <KeyRound className="h-6 w-6" /> : <BookMarked className="h-6 w-6" />}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                tab === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                tab === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
              }`}
              onClick={() => setTab('register')}
            >
              Cadastro
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {tab === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" {...register('name')} />
                {errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <Input id="email" type="email" className="pl-11" placeholder="voce@email.com" {...register('email')} />
              </div>
              {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="******" {...register('password')} />
              {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
            </div>

            {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  )
}
