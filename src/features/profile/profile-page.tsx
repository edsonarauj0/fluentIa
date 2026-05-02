import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/features/auth/auth-context'
import { categories, difficulties, themes } from '@/lib/constants'

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

  const {
    register,
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
      preferences: {
        category: values.category,
        level: values.level,
        theme: values.theme,
        maxCharacters: values.maxCharacters,
      },
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="space-y-4">
        <Badge>Perfil do estudante</Badge>
        <CardTitle>Personalize sua rotina</CardTitle>
        <CardDescription>
          Defina categoria, tamanho do texto, dificuldade e tema visual. Essas preferencias influenciam o desafio diario.
        </CardDescription>
        <div className="rounded-[24px] bg-slate-50 p-5 text-sm leading-7 text-slate-600">
          Historico salvo: {user?.completedChallengeIds.length ?? 0} desafios concluidos.
        </div>
      </Card>

      <Card>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-rose-600">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria principal</Label>
            <Select id="category" {...register('category')}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
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
            <Select id="level" {...register('level')}>
              {difficulties.map((difficulty) => (
                <option key={difficulty.value} value={difficulty.value}>
                  {difficulty.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="theme">Tema visual</Label>
            <Select id="theme" {...register('theme')}>
              {themes.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </Select>
          </div>

          {errors.maxCharacters && <p className="text-sm text-rose-600 md:col-span-2">{errors.maxCharacters.message}</p>}

          <div className="flex items-center justify-between gap-4 md:col-span-2">
            {isSubmitSuccessful ? <p className="text-sm text-lime-700">Preferencias salvas com sucesso.</p> : <span />}
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
