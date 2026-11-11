import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Maximize2, Minimize2, Send, Sparkles, Volume2, X } from 'lucide-react'
import { Mascot } from '@/components/mascot/mascot'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useGamificationStore } from '@/stores/gamification-store'
import { useSubjectsStore } from '@/stores/subjects-store'
import { challengeService } from '@/services/challenge-service'
import { useSpeech } from '@/hooks/use-speech'
import type { Challenge, Difficulty, WordInsight } from '@/types/domain'

type TutorSheetProps = {
  challenge?: Challenge | null
  level?: Difficulty
  externalInsight?: WordInsight | null
  selectedText?: string
}

const DEFAULT_FALLBACK_CHALLENGE: Challenge = {
  id: 'tutor-context',
  date: new Date().toISOString(),
  category: 'Poema',
  title: 'Quiet Morning',
  text: 'The window opens to a gentle light. A bird repeats the same song, and the city wakes up slowly.',
  reflectionQuestion: 'Which line creates the strongest image in your mind?',
  source: 'fallback',
  completed: false,
}

export function TutorSheet({
  challenge,
  level = 'beginner',
  externalInsight = null,
  selectedText = '',
}: TutorSheetProps) {
  const {
    isTutorOpen,
    tutorInitialTerm,
    closeTutor,
    setMascotState,
    incrementMicoSuperado,
  } = useGamificationStore()

  const activeSubject = useSubjectsStore((state) =>
    state.subjects.find((s) => s.status === 'active') ?? state.subjects[0],
  )
  const quickSuggestions =
    activeSubject?.keywords?.slice(0, 4) ?? [
      'gentle light',
      'wakes up slowly',
      'breathing with attention',
    ]

  const defaultSeedTerm = tutorInitialTerm || selectedText
  const [customQuery, setCustomQuery] = useState<string | null>(null)
  const [localInsight, setLocalInsight] = useState<WordInsight | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { speakSelection } = useSpeech()

  const query = customQuery ?? defaultSeedTerm
  const insight = localInsight ?? externalInsight

  function handleClose() {
    setCustomQuery(null)
    closeTutor()
  }

  useEffect(() => {
    if (!isTutorOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeTutor()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isTutorOpen, closeTutor])

  async function handleAsk(customTerm?: string) {
    const term = (customTerm ?? query).trim()
    if (!term) return

    setIsAsking(true)
    setMascotState('thinking')

    const activeChallenge = challenge ?? DEFAULT_FALLBACK_CHALLENGE
    const result = await challengeService.explainSelection(
      activeChallenge,
      term,
      level,
      activeSubject,
    )

    setLocalInsight(result)
    setIsAsking(false)
    setMascotState('celebrating')
    incrementMicoSuperado()
  }

  return (
    <AnimatePresence>
      {isTutorOpen ? (
        <>
          <motion.div
            key="tutor-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-navy-950/45 backdrop-blur-xs"
            aria-hidden="true"
          />

          <motion.div
            key="tutor-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Tutor Mico"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 110 || info.velocity.y > 500) {
                handleClose()
              } else if (info.offset.y < -60) {
                setIsExpanded(true)
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className={`fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-2xl flex-col rounded-t-3xl border border-brand-100 bg-white shadow-2xl safe-bottom ${
              isExpanded ? 'max-h-[90dvh]' : 'max-h-[72dvh]'
            }`}
          >
            {/* Drag Handle */}
            <div className="flex flex-col items-center pt-3 pb-1">
              <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-brand-100 px-6 py-3.5">
              <div className="flex items-center gap-3">
                <Mascot
                  state={isAsking ? 'thinking' : insight ? 'celebrating' : 'idle'}
                  className="h-12 w-12"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-extrabold text-navy-900">
                      Pergunte ao Mico
                    </h3>
                    <span className="rounded-full bg-mico-light px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-navy-900">
                      Tutor IA
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Dúvida de vocabulário ou pronúncia? Errar aqui é parte do jogo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-brand-50 hover:text-navy-900"
                  aria-label={isExpanded ? 'Reduzir painel' : 'Expandir painel'}
                >
                  {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-brand-50 hover:text-navy-900"
                  aria-label="Fechar tutor"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleAsk()
                }}
                className="flex gap-2"
              >
                <Input
                  value={query}
                  onChange={(event) => setCustomQuery(event.target.value)}
                  placeholder="Digite uma palavra ou expressão do texto..."
                  aria-label="Palavra ou trecho para o Mico explicar"
                  className="flex-1 rounded-2xl border-brand-100 bg-brand-50/50"
                />
                <Button type="submit" variant="primary" size="md" disabled={!query.trim() || isAsking}>
                  <Send className="h-4 w-4" />
                  {isAsking ? 'Pensando...' : 'Perguntar'}
                </Button>
              </form>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Sugestões da área:</span>
                {quickSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setCustomQuery(suggestion)
                      void handleAsk(suggestion)
                    }}
                    className="rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600 hover:bg-brand-100"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Insight Result */}
              {insight ? (
                <div className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-600">
                        Termo analisado
                      </span>
                      <h4 className="font-display text-xl font-extrabold text-navy-900">
                        {insight.term}
                      </h4>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => speakSelection(insight.term, 0.8)}
                    >
                      <Volume2 className="h-4 w-4" />
                      Ouvir
                    </Button>
                  </div>

                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div className="rounded-xl bg-white p-3 shadow-2xs">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Tradução
                      </p>
                      <p className="mt-1 text-sm font-semibold text-navy-900">{insight.translation}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3 shadow-2xs">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        Pronúncia
                      </p>
                      <p className="mt-1 text-sm font-semibold text-navy-900">{insight.pronunciation}</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-2xs">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Significado sem mico
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-navy-900">{insight.meaning}</p>
                  </div>

                  <div className="rounded-xl bg-white p-3 shadow-2xs">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      Exemplo prático
                    </p>
                    <p className="mt-1 text-sm italic text-navy-900">{insight.example}</p>
                  </div>

                  {insight.synonyms.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Sparkles className="h-3.5 w-3.5 text-mico-dark" />
                      <span className="text-xs font-bold text-muted-foreground">Sinônimos:</span>
                      {insight.synonyms.map((syn) => (
                        <span
                          key={syn}
                          className="rounded-full border border-brand-100 bg-white px-2.5 py-0.5 text-xs font-semibold text-navy-900"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/30 p-5 text-center text-sm text-muted-foreground">
                  Selecione qualquer palavra no texto da missão ou digite acima para o Mico te explicar na hora!
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
