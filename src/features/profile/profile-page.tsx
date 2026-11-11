import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, ChevronRight, FolderKanban, Plus, Save, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/features/auth/auth-context'
import { SubjectIconBadge } from '@/features/subjects/subject-icon'
import { categories, difficulties, themes } from '@/lib/constants'
import { useGamificationStore } from '@/stores/gamification-store'
import { MAX_SAVED_SUBJECTS, useSubjectsStore } from '@/stores/subjects-store'

const profileSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  category: z.string().min(1, 'Escolha uma categoria.'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  theme: z.enum(['sunrise', 'forest', 'ocean']),
  maxCharacters: z.number().min(200).max(1200),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { soundEnabled, setSoundEnabled } = useGamificationStore()
  const { subjects } = useSubjectsStore()

  const [remindersEnabled, setRemindersEnabled] = useState(
    user?.preferences.remindersEnabled ?? true,
  )

  const activeSubject = subjects.find((s) => s.status === 'active') ?? subjects[0]
  const pausedSubjects = subjects.filter((s) => s.status === 'paused')
  const savedCount = (activeSubject ? 1 : 0) + pausedSubjects.length

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      category: user?.preferences.category ?? categories[0],
      level: user?.preferences.level ?? 'beginner',
      theme: user?.preferences.theme ?? 'sunrise',
      maxCharacters: user?.preferences.maxCharacters ?? 450,
    },
  })

  async function onSubmit(values: ProfileFormData) {
    if (!user) return

    await updateUser({
      ...user,
      name: values.name,
      soundEnabled,
      preferences: {
        category: values.category,
        level: values.level,
        theme: values.theme,
        maxCharacters: values.maxCharacters,
        remindersEnabled,
      },
    })
    toast.success('Preferências salvas com sucesso!')
  }

  return (
    <div className="space-y-6">
      {/* Entry Card: Meus Assuntos (Perfil -> Meus assuntos -> Detalhe do assunto) */}
      <Card className="border-2 border-[#DCE7FF] bg-white p-5 shadow-card sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="border-brand-200 bg-[#DCE7FF] text-[#1B4FE0]">
                <FolderKanban className="mr-1.5 h-3.5 w-3.5" />
                Trilhas de estudo
              </Badge>
              <span className="text-xs font-extrabold text-[#55627A]">
                {savedCount} de {MAX_SAVED_SUBJECTS} guardados
              </span>
            </div>
            <CardTitle className="font-extrabold text-[#0B1437]">Meus assuntos</CardTitle>
            <CardDescription>
              Gerencie o assunto ativo, retome trilhas pausadas ou crie um novo assunto personalizado com o Mico.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void navigate('/subjects/new')}
            >
              <Plus className="h-4 w-4" />
              Novo assunto
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void navigate('/subjects')}
            >
              Gerenciar assuntos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {activeSubject ? (
          <div className="mt-4 flex flex-col justify-between gap-3 rounded-[18px] border-2 border-[#2563FF] bg-[#F2F6FF] p-3.5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <SubjectIconBadge icon={activeSubject.icon} />
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display text-base font-black text-[#0B1437]">
                    {activeSubject.title}
                  </p>
                  <span className="rounded-full bg-[#2563FF] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                    Ativo
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#55627A]">
                  {activeSubject.totalLessons
                    ? `Lição ${activeSubject.currentLessonNumber} de ${activeSubject.totalLessons} · ${activeSubject.durationMinutes} min/dia`
                    : `Contínua · ${activeSubject.completedLessonsCount} lições feitas`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void navigate(`/subjects/${activeSubject.id}`)}
              >
                Configurar trilha
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-4 border-brand-100 bg-white shadow-card">
          <Badge className="border-brand-200 bg-brand-50 text-brand-600">Perfil do estudante</Badge>
          <CardTitle className="font-extrabold text-navy-900">Personalize sua rotina</CardTitle>
          <CardDescription>
            Defina configurações globais da conta, lembretes, efeitos sonoros e preferências padrão.
          </CardDescription>

          <div className="rounded-2xl bg-brand-50/70 p-4 text-sm leading-7 text-navy-900">
            Histórico salvo: <strong>{user?.completedChallengeIds.length ?? 0}</strong> desafios concluídos.
          </div>

          {/* Sound Effects Toggle (Off by default per best practices) */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4">
            <div className="flex items-center gap-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-brand-500" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-extrabold text-navy-900">Efeitos sonoros</p>
                <p className="text-xs text-muted-foreground">
                  {soundEnabled ? 'Sons de conquista ativados' : 'Desligado por padrão'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant={soundEnabled ? 'primary' : 'secondary'}
              size="sm"
              role="switch"
              aria-checked={soundEnabled}
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? 'Ligado' : 'Desligado'}
            </Button>
          </div>

          {/* Daily Reminder Toggle */}
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white p-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-mico-dark" />
              <div>
                <p className="text-sm font-extrabold text-navy-900">Lembrete diário</p>
                <p className="text-xs text-muted-foreground">
                  {remindersEnabled ? 'Notificação às 19h para manter a ofensiva' : 'Lembretes pausados'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant={remindersEnabled ? 'primary' : 'secondary'}
              size="sm"
              role="switch"
              aria-checked={remindersEnabled}
              onClick={() => setRemindersEnabled((prev) => !prev)}
            >
              {remindersEnabled ? 'Ativo' : 'Pausado'}
            </Button>
          </div>
        </Card>

        <Card className="border-brand-100 bg-white shadow-card">
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-danger">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria principal</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Escolha uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCharacters">Maximo de caracteres</Label>
              <Input
                id="maxCharacters"
                type="number"
                min={200}
                max={1200}
                step={50}
                {...register('maxCharacters', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Nivel</Label>
              <Controller
                control={control}
                name="level"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Escolha um nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((difficulty) => (
                        <SelectItem key={difficulty.value} value={difficulty.value}>
                          {difficulty.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Tema visual</Label>
              <Controller
                control={control}
                name="theme"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Escolha um tema" />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {errors.maxCharacters && (
              <p className="text-sm text-danger md:col-span-2">{errors.maxCharacters.message}</p>
            )}

            <div className="flex items-center justify-between gap-4 md:col-span-2">
              {isSubmitSuccessful ? (
                <p className="text-sm font-bold text-success">Preferencias salvas com sucesso.</p>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar preferencias'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
