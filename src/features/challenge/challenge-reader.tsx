import { useMemo } from 'react'
import { Languages, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { Challenge, WordInsight } from '@/types/domain'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'

type Props = {
  challenge: Challenge
  insight: WordInsight | null
  selectedText: string
  isPlaying: boolean
  isPaused: boolean
  currentCharIndex: number | null
  isAsking: boolean
  onPlayAudio: () => void
  onPauseAudio: () => void
  onResumeAudio: () => void
  onPlaySelection: () => void
  onSelection: (value: string) => void
  onAskInsight: () => void
}

export function ChallengeReader({
  challenge,
  insight,
  selectedText,
  isPlaying,
  isPaused,
  currentCharIndex,
  isAsking,
  onPlayAudio,
  onPauseAudio,
  onResumeAudio,
  onPlaySelection,
  onSelection,
  onAskInsight,
}: Props) {
  const tokens = useMemo(() => tokenizeText(challenge.text), [challenge.text])

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge>{challenge.category}</Badge>
            <CardTitle className="mt-4">{challenge.title}</CardTitle>
            <CardDescription className="mt-2">
              Leia com calma, selecione uma palavra ou frase e pergunte para a IA.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
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
          className="rounded-[28px] bg-slate-50 p-6 text-lg leading-9 text-slate-700 whitespace-pre-wrap"
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
                    ? 'rounded-xl bg-lime-300/80 px-1 py-0.5 text-slate-950 shadow-[0_8px_24px_-12px_rgba(132,204,22,0.8)] transition duration-150'
                    : undefined
                }
              >
                {token.value}
              </span>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-[24px] border border-dashed border-slate-200 bg-white p-4">
          <Languages className="h-5 w-5 text-lime-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Trecho selecionado</p>
            <p className="text-sm text-slate-500">
              {selectedText || 'Selecione uma palavra ou frase no texto acima para abrir o modo de estudo.'}
            </p>
          </div>
          <Button variant="outline" onClick={onPlaySelection} disabled={!selectedText}>
            <VolumeX className="h-4 w-4" />
            Ouvir trecho
          </Button>
          <Button onClick={onAskInsight} disabled={!selectedText || isAsking}>
            {isAsking ? 'Consultando...' : 'Perguntar para IA'}
          </Button>
        </div>
      </Card>

      <Card className="space-y-5">
        <div>
          <Badge className="bg-lime-100 text-lime-900">Tutor IA</Badge>
          <CardTitle className="mt-4 text-xl">Analise do trecho</CardTitle>
          <CardDescription className="mt-2">
            Traducoes, sinonimos, exemplos de uso e contexto aparecem aqui.
          </CardDescription>
        </div>

        {insight ? (
          <div className="space-y-4 text-sm leading-7 text-slate-700">
            <InsightLine label="Trecho" value={insight.term} />
            <InsightLine label="Traducao" value={insight.translation} />
            <InsightLine label="Significado" value={insight.meaning} />
            <InsightLine label="Exemplo" value={insight.example} />
            <InsightLine label="Sinonimos" value={insight.synonyms.join(', ')} />
            <InsightLine label="Pronuncia" value={insight.pronunciation} />
            <InsightLine label="Contexto" value={insight.context} />
          </div>
        ) : (
          <div className="rounded-[24px] bg-slate-50 p-5 text-sm leading-7 text-slate-500">
            Quando voce consultar a IA, este painel vai explicar a palavra no contexto do texto do dia.
          </div>
        )}
      </Card>
    </div>
  )
}

function InsightLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2">{value}</p>
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
