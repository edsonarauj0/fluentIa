import { useEffect, useMemo, useState } from 'react'
import type { ComponentType } from 'react'
import { CalendarCheck2, Flame, RefreshCw, WandSparkles } from 'lucide-react'
import { useAuth } from '@/features/auth/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChallengeReader } from '@/features/challenge/challenge-reader'
import { defaultPreferences, difficultyLabels, themeLabels } from '@/lib/constants'
import { challengeService } from '@/services/challenge-service'
import { useSpeech } from '@/hooks/use-speech'
import type { Challenge, WordInsight } from '@/types/domain'

export function DashboardPage() {
  const { user, updateUser, mode } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [insight, setInsight] = useState<WordInsight | null>(null)
  const [playbackRate, setPlaybackRate] = useState(0.85)
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true)
  const [isAsking, setIsAsking] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const { speak, pause, resume, speakSelection, speaking, paused, currentCharIndex } = useSpeech()

  const preferences = useMemo(() => user?.preferences ?? defaultPreferences, [user])

  useEffect(() => {
    if (!user) return

    void loadChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, preferences.category, preferences.maxCharacters, preferences.level])

  async function loadChallenge(force = false) {
    if (!user) return

    setIsLoadingChallenge(true)
    setStatus(null)
    const response = await challengeService.getDailyChallenge(user, force)
    setChallenge(response.challenge)
    setStatus(response.mode === 'fallback' ? 'Conteudo gerado em modo demo.' : 'Conteudo gerado pela Gemini.')
    setIsLoadingChallenge(false)
    setInsight(null)
    setSelectedText('')
  }

  async function askInsight() {
    if (!user || !challenge || !selectedText) return

    setIsAsking(true)
    const nextInsight = await challengeService.explainSelection(challenge, selectedText, preferences.level)
    setInsight(nextInsight)
    setIsAsking(false)
  }

  async function completeChallenge() {
    if (!user || !challenge) return

    const nextUser = await challengeService.completeChallenge(user, challenge.id)
    await updateUser(nextUser)
    setStatus('Desafio marcado como concluido. Sua streak foi atualizada.')
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden bg-slate-950 text-white">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(163,230,53,0.24),_transparent_35%)]" />
            <div className="relative space-y-6">
              <Badge className="border-white/15 bg-white/10 text-white">MVP em funcionamento</Badge>
              <div>
                <CardTitle className="text-4xl text-white">Estude ingles todos os dias com desafios vivos.</CardTitle>
                <CardDescription className="mt-3 max-w-xl text-slate-300">
                  Escolha categoria, nivel e tamanho do texto. A FluentIA gera o conteudo, le em voz alta e explica qualquer trecho selecionado.
                </CardDescription>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard icon={Flame} label="Streak" value={`${user?.streak ?? 0} dias`} />
                <MetricCard icon={CalendarCheck2} label="Tema" value={themeLabels[preferences.theme]} />
                <MetricCard icon={WandSparkles} label="Nivel" value={difficultyLabels[preferences.level]} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <CardTitle>Seu desafio de hoje</CardTitle>
            <CardDescription className="mt-2">
              {mode === 'demo'
                ? 'O app funciona sem credenciais usando conteudo local. Quando voce adicionar Firebase e Gemini, ele troca para o modo conectado.'
                : 'Sua conta esta conectada. Ajuste as preferencias no perfil e gere um novo desafio quando quiser.'}
            </CardDescription>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PreferencePreview label="Categoria" value={preferences.category} />
            <PreferencePreview label="Limite" value={`${preferences.maxCharacters} caracteres`} />
            <PreferencePreview label="Nivel" value={difficultyLabels[preferences.level]} />
            <PreferencePreview label="Historico" value={`${user?.completedChallengeIds.length ?? 0} concluidos`} />
          </div>

          <Button variant="outline" onClick={() => void loadChallenge(true)}>
            <RefreshCw className="h-4 w-4" />
            Gerar novo texto
          </Button>

          {status && <p className="rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-600">{status}</p>}
        </Card>
      </section>

      {isLoadingChallenge || !challenge ? (
        <Card>
          <p className="text-sm text-slate-500">Gerando seu texto do dia...</p>
        </Card>
      ) : (
        <ChallengeReader
          challenge={challenge}
          insight={insight}
          selectedText={selectedText}
          isPlaying={speaking}
          isPaused={paused}
          currentCharIndex={currentCharIndex}
          isAsking={isAsking}
          playbackRate={playbackRate}
          onPlayAudio={() => speak(challenge.text, playbackRate)}
          onPauseAudio={pause}
          onResumeAudio={resume}
          onPlaySelection={() => speakSelection(selectedText, Math.max(0.65, playbackRate - 0.05))}
          onPlaybackRateChange={setPlaybackRate}
          onSelection={setSelectedText}
          onAskInsight={() => void askInsight()}
        />
      )}

      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-xl">Fechou o ritual de hoje?</CardTitle>
          <CardDescription className="mt-2">
            Marque o desafio como concluido para atualizar sua streak e o historico local.
          </CardDescription>
        </div>
        <Button size="lg" onClick={() => void completeChallenge()} disabled={!challenge}>
          Marcar como concluido
        </Button>
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/8 p-4">
      <div className="flex items-center gap-2 text-lime-300">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
    </div>
  )
}

function PreferencePreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-900">{value}</p>
    </div>
  )
}
