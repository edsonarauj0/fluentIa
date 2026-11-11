import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Volume2, VolumeX } from 'lucide-react'
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
import { categories, difficulties, themes } from '@/lib/constants'
import { useGamificationStore } from '@/stores/gamification-store'

const profileSchema = z.object({
  name: z.string().min(2, 'Informe um nome com pelo menos 2 caracteres.'),
  category: z.string().min(1, 'Escolha uma categoria.'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  theme: z.enum(['sunrise', 'forest', 'ocean']),
  maxCharacters: z.number().min(200).max(1200),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { soundEnabled, setSoundEnabled } = useGamificationStore()

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
      },
    })
    toast.success('Preferências salvas com sucesso!')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="space-y-4 border-brand-100 bg-white shadow-card">
        <Badge className="border-brand-200 bg-brand-50 text-brand-600">Perfil do estudante</Badge>
        <CardTitle className="font-extrabold text-navy-900">Personalize sua rotina</CardTitle>
        <CardDescription>
          Defina categoria, tamanho do texto, dificuldade e efeitos sonoros. Essas preferências influenciam sua missão diária.
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
  )
}
