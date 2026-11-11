import { useMemo } from 'react'
import { CheckCircle2, GraduationCap, Languages, Pause, Play, Sparkles, Volume2, VolumeX } from 'lucide-react'
import type { Challenge, WordInsight } from '@/types/domain'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Props = {
  challenge: Challenge
  expertPersona?: string
  insight: WordInsight | null
  selectedText: string
  isPlaying: boolean
  isPaused: boolean
  currentCharIndex: number | null
  isAsking: boolean
  playbackRate: number
  onPlayAudio: () => void
  onPauseAudio: () => void
  onResumeAudio: () => void
  onPlaySelection: () => void
  onPlaybackRateChange: (value: number) => void
  onSelection: (value: string) => void
  onAskInsight: () => void
  onCompleteQuizStep?: () => void
  quizCompleted?: boolean
}

export function ChallengeReader({
  challenge,
  expertPersona,
  insight,
  selectedText,
  isPlaying,
  isPaused,
  currentCharIndex,
  isAsking,
  playbackRate,
  onPlayAudio,
  onPauseAudio,
  onResumeAudio,
  onPlaySelection,
  onPlaybackRateChange,
  onSelection,
  onAskInsight,
  onCompleteQuizStep,
  quizCompleted = false,
}: Props) {
  const tokens = useMemo(() => tokenizeText(challenge.text), [challenge.text])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="space-y-6 border-brand-100 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-brand-200 bg-brand-50 text-brand-600">{challenge.category}</Badge>
            {expertPersona ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1CF] px-3 py-1 text-xs font-extrabold text-[#8A5200]">
                <GraduationCap className="h-3.5 w-3.5" />
                {expertPersona}
              </span>
            ) : null}
          </div>
          <CardTitle className="mt-3 font-extrabold text-navy-900">{challenge.title}</CardTitle>
          <CardDescription className="mt-1">
            Leia com calma, selecione uma palavra ou frase e pergunte para o Mico.
          </CardDescription>
        </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(playbackRate)}
              onValueChange={(value) => onPlaybackRateChange(Number(value))}
            >
              <SelectTrigger aria-label="Velocidade da leitura" className="w-[132px] border-brand-100 bg-white">
                <SelectValue placeholder="Velocidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.7">0.7x</SelectItem>
                <SelectItem value="0.85">0.85x</SelectItem>
                <SelectItem value="1">1.0x</SelectItem>
                <SelectItem value="1.15">1.15x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2.0x</SelectItem>
                <SelectItem value="2.5">2.5x</SelectItem>
                <SelectItem value="3">3.0x</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={onPlayAudio}>
              <Volume2 className="h-4 w-4" />
              {isPlaying ? 'Reiniciar leitura' : 'Ouvir texto'}
            </Button>
            {isPlaying && !isPaused ? (
              <Button variant="outline" onClick={onPauseAudio}>
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
            ) : null}
            {isPlaying && isPaused ? (
              <Button variant="outline" onClick={onResumeAudio}>
                <Play className="h-4 w-4" />
                Retomar
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className="rounded-3xl border border-brand-100/80 bg-brand-50/50 p-6 font-reading text-lg leading-9 text-navy-900 whitespace-pre-wrap"
          onMouseUp={() => onSelection(window.getSelection()?.toString().trim() ?? '')}
          onTouchEnd={() => onSelection(window.getSelection()?.toString().trim() ?? '')}
        >
          {tokens.map((token) => {
            const isActive =
              currentCharIndex !== null &&
              !token.isWhitespace &&
              currentCharIndex >= token.start &&
              currentCharIndex < token.end

            return (
              <span
                key={`${token.start}-${token.end}`}
                className={
                  isActive
                    ? 'rounded-xl bg-mico-light px-1.5 py-0.5 font-semibold text-navy-950 shadow-xs'
                    : undefined
                }
              >
                {token.value}
              </span>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-brand-200 bg-white p-4">
          <Languages className="h-5 w-5 text-brand-500" />
          <div className="flex-1">
            <p className="text-sm font-extrabold text-navy-900">Trecho selecionado</p>
            <p className="text-sm text-muted-foreground">
              {selectedText || 'Selecione uma palavra ou frase no texto acima para abrir o modo de estudo.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onPlaySelection} disabled={!selectedText}>
            <VolumeX className="h-4 w-4" />
            Ouvir trecho
          </Button>
          <Button size="sm" onClick={onAskInsight} disabled={!selectedText || isAsking}>
            {isAsking ? 'Consultando...' : 'Perguntar para IA'}
          </Button>
        </div>

        {challenge.mentorTip ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[#FFE3A3] bg-[#FFF1CF]/75 p-4 text-sm text-[#0B1437]">
            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-[#8A5200]" />
            <p className="font-semibold leading-relaxed">{challenge.mentorTip}</p>
          </div>
        ) : null}

        {challenge.reflectionQuestion ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-[#FFF3D6]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-mico-dark">
                Quiz rápido de reflexão
              </p>
              <p className="mt-1 text-sm font-bold text-navy-900">{challenge.reflectionQuestion}</p>
            </div>
            {onCompleteQuizStep ? (
              <Button
                type="button"
                variant={quizCompleted ? 'success' : 'mico'}
                size="sm"
                onClick={onCompleteQuizStep}
              >
                <CheckCircle2 className="h-4 w-4" />
                {quizCompleted ? 'Quiz concluído' : 'Responder reflexão'}
              </Button>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-5 border-brand-100 bg-white shadow-card">
        <div>
          <Badge className="border-mico/40 bg-mico-light/60 text-navy-900">
            <Sparkles className="mr-1 h-3 w-3 text-mico-dark" />
            Tutor IA
          </Badge>
          <CardTitle className="mt-3 text-xl font-extrabold text-navy-900">Análise do trecho</CardTitle>
          <CardDescription className="mt-1">
            Traduções, sinônimos, exemplos de uso e contexto aparecem aqui.
          </CardDescription>
        </div>

        {insight ? (
          <div className="space-y-3 text-sm leading-7 text-navy-900">
            <InsightLine label="Trecho" value={insight.term} />
            <InsightLine label="Traducao" value={insight.translation} />
            <InsightLine label="Significado" value={insight.meaning} />
            <InsightLine label="Exemplo" value={insight.example} />
            <InsightLine label="Sinonimos" value={insight.synonyms.join(', ')} />
            <InsightLine label="Pronuncia" value={insight.pronunciation} />
            <InsightLine label="Contexto" value={insight.context} />
          </div>
        ) : (
          <div className="rounded-2xl bg-brand-50/60 p-5 text-sm leading-7 text-muted-foreground">
            Quando você consultar a IA, este painel vai explicar a palavra no contexto do texto do dia.
          </div>
        )}
      </Card>
    </div>
  )
}

function InsightLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-brand-50/50 p-3.5">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium text-navy-900">{value}</p>
    </div>
  )
}

type TextToken = {
  value: string
  start: number
  end: number
  isWhitespace: boolean
}

function tokenizeText(text: string): TextToken[] {
  const matches = text.matchAll(/\S+|\s+/g)
  const tokens: TextToken[] = []

  for (const match of matches) {
    const value = match[0]
    const start = match.index ?? 0
    tokens.push({
      value,
      start,
      end: start + value.length,
      isWhitespace: /^\s+$/.test(value),
    })
  }

  return tokens
}
