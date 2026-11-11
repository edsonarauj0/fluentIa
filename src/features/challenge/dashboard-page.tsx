import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Headphones,
  Layers,
  MessageCircle,
  Smile,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/auth-context'
import { GoalRing, XPBar } from '@/components/gamification/xp-bar'
import { Mascot } from '@/components/mascot/mascot'
import { TutorSheet } from '@/components/tutor/tutor-sheet'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { ChallengeReader } from '@/features/challenge/challenge-reader'
import { celebrate } from '@/lib/celebrate'
import { defaultPreferences, difficultyLabels } from '@/lib/constants'
import { buildWeekProgress } from '@/lib/streak-utils'
import { cn } from '@/lib/utils'
import { challengeService } from '@/services/challenge-service'
import { useGamificationStore } from '@/stores/gamification-store'
import { useSpeech } from '@/hooks/use-speech'
import type { Challenge, MissionStepId, WordInsight } from '@/types/domain'

const MISSION_STEPS: {
  id: MissionStepId
  label: string
  icon: typeof BookOpen
}[] = [
  { id: 'read', label: 'Ler', icon: BookOpen },
  { id: 'listen', label: 'Ouvir', icon: Headphones },
  { id: 'quiz', label: 'Quiz', icon: CheckCircle2 },
]

export function DashboardPage() {
  const { user, updateUser } = useAuth()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [selectedText, setSelectedText] = useState('')
  const [insight, setInsight] = useState<WordInsight | null>(null)
  const [playbackRate, setPlaybackRate] = useState(0.85)
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true)
  const [isAsking, setIsAsking] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const missionRef = useRef<HTMLElement | null>(null)

  const { speak, pause, resume, speakSelection, speaking, paused, currentCharIndex } = useSpeech()

  const {
    xp,
    streak,
    level,
    completedSteps,
    activeStep,
    mascotState,
    vocabPendingCount,
    micosSuperados,
    completeStep,
    markAllStepsCompleted,
    resetSteps,
    setActiveStep,
    setMascotState,
    openTutor,
  } = useGamificationStore()

  const preferences = useMemo(() => user?.preferences ?? defaultPreferences, [user])
  const firstName = useMemo(() => {
    const rawName = user?.name?.trim() || 'Edson'
    return rawName.split(' ')[0]
  }, [user?.name])

  const levelLabel = difficultyLabels[preferences.level]
  const displayStreak = user?.streak ?? streak

  const weekDays = useMemo(
    () => buildWeekProgress(user?.completedChallengeIds ?? [], user?.lastCompletedAt ?? null),
    [user?.completedChallengeIds, user?.lastCompletedAt],
  )

  useEffect(() => {
    if (!user) return

    void loadChallenge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, preferences.category, preferences.maxCharacters, preferences.level])

  async function loadChallenge(force = false) {
    if (!user) return

    setIsLoadingChallenge(true)
    setStatus(null)
    setMascotState('thinking')

    const response = await challengeService.getDailyChallenge(user, force)
    setChallenge(response.challenge)
    setIsLoadingChallenge(false)
    setInsight(null)
    setSelectedText('')

    if (force) {
      resetSteps()
      setStatus('Novo desafio gerado para hoje!')
      toast.success('Novo texto gerado sem mico!')
    } else {
      setMascotState('idle')
    }
  }

  function handleStartMission() {
    setActiveStep('read')
    const earned = completeStep('read')
    if (earned) {
      toast.success('+15 XP! Passo de leitura iniciado.')
    }
    missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleStepClick(stepId: MissionStepId) {
    setActiveStep(stepId)
    if (stepId === 'listen' && challenge) {
      speak(challenge.text, playbackRate)
      const earned = completeStep('listen')
      if (earned) {
        toast.success('+15 XP! Prática de escuta em andamento.')
      }
    } else if (stepId === 'read') {
      const earned = completeStep('read')
      if (earned) {
        toast.success('+15 XP! Leitura iniciada.')
      }
    }
    missionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function askInsight() {
    if (!user || !challenge || !selectedText) return

    setIsAsking(true)
    setMascotState('thinking')
    const nextInsight = await challengeService.explainSelection(challenge, selectedText, preferences.level)
    setInsight(nextInsight)
    setIsAsking(false)
    setMascotState('celebrating')
    completeStep('read')
  }

  function handlePlayAudio() {
    if (!challenge) return
    speak(challenge.text, playbackRate)
    const earned = completeStep('listen')
    if (earned) {
      toast.success('+15 XP! Escuta ativa concluída.')
    }
  }

  function handleCompleteQuizStep() {
    const earned = completeStep('quiz')
    if (earned) {
      toast.success('+15 XP! Reflexão do dia concluída.')
    }
  }

  async function completeChallenge() {
    if (!user || !challenge) return

    markAllStepsCompleted()
    const nextUser = await challengeService.completeChallenge(user, challenge.id)
    await updateUser(nextUser)
    celebrate()
    setStatus('Desafio marcado como concluido. Sua streak foi atualizada.')
    toast.success('+45 XP! Missão do dia concluída! Sem mico! 🏆')
  }

  const missionProgressPercent = Math.round((completedSteps.length / 3) * 100)

  return (
    <div className="space-y-8">
      {/* Top Greeting & Gamification Pills */}
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy-900 md:text-[32px]">
            Bora, {firstName}?
          </h1>
          <p className="mt-1 hidden text-sm text-muted-foreground md:block">
            Sua missão de hoje leva uns 8 minutos.
          </p>
          <p className="mt-1 text-sm text-muted-foreground md:hidden">
            Missão de hoje: uns 8 minutos.
          </p>
        </div>

        {/* Desktop Gamification Badges */}
        <div className="hidden items-center gap-2.5 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-extrabold text-navy-900 shadow-2xs">
            <Flame className="h-4 w-4 fill-streak/20 text-streak" />
            <span>{displayStreak} dias</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-extrabold text-navy-900 shadow-2xs">
            <Zap className="h-4 w-4 fill-xp/20 text-xp" />
            <span>{xp} XP</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-xs font-extrabold text-navy-900 shadow-2xs">
            <span>
              Lv. {level} · {levelLabel}
            </span>
          </div>
        </div>
      </section>

      {/* Main Hero Grid: Missão do Dia + Meta de Hoje */}
      <section className="grid gap-6 lg:grid-cols-[1.68fr_1fr]">
        {/* Dark Navy Mission Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#070E2C] via-[#102672] to-[#081238] p-6 text-white shadow-soft sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_38%_28%,_rgba(37,99,255,0.42),_transparent_62%)]"
          />

          <div className="relative flex h-full flex-col justify-between gap-6">
            {/* Top Badge Row */}
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center rounded-full border border-brand-400/35 bg-navy-900/60 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-100">
                MISSÃO DO DIA
              </span>
              <span className="hidden rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-navy-900 shadow-sm sm:inline-flex">
                Sem mico, prometo!
              </span>
            </div>

            {/* Title, Meta & Mico Mascot */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {challenge?.title ?? 'Quiet Morning'}
                </h2>
                <p className="hidden text-sm font-medium text-brand-100/85 sm:block">
                  {preferences.category} · {levelLabel} · até {preferences.maxCharacters} caracteres
                </p>
                <p className="text-sm font-medium text-brand-100/85 sm:hidden">
                  {preferences.category} · {levelLabel}
                </p>
              </div>

              <Mascot
                state={mascotState}
                className="h-20 w-20 shrink-0 sm:h-28 sm:w-28"
              />
            </div>

            {/* Desktop Stepper (Icon on top, label below) */}
            <div className="hidden items-center gap-3 sm:flex">
              {MISSION_STEPS.map((step, index) => {
                const Icon = step.icon
                const isDone = completedSteps.includes(step.id)
                const isCurrent = activeStep === step.id || (index === 0 && completedSteps.length === 0)

                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleStepClick(step.id)}
                      className="group flex flex-col items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-full transition-colors',
                          isDone || isCurrent
                            ? 'bg-brand-500 text-white shadow-[0_0_20px_rgba(37,99,255,0.65)]'
                            : 'border border-brand-400/25 bg-navy-900/75 text-brand-200 group-hover:border-brand-300/50',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span
                        className={cn(
                          'text-xs font-bold',
                          isDone || isCurrent ? 'text-white' : 'text-brand-200/80',
                        )}
                      >
                        {step.label}
                      </span>
                    </button>

                    {index < MISSION_STEPS.length - 1 ? (
                      <div className="-mt-5 h-[2px] w-9 rounded-full bg-brand-400/30" />
                    ) : null}
                  </div>
                )
              })}
            </div>

            {/* Mobile Stepper (Horizontal inline) */}
            <div className="flex items-center justify-between gap-2 sm:hidden">
              {MISSION_STEPS.map((step, index) => {
                const Icon = step.icon
                const isDone = completedSteps.includes(step.id)
                const isCurrent = activeStep === step.id || (index === 0 && completedSteps.length === 0)

                return (
                  <div key={step.id} className="flex flex-1 items-center gap-2 last:flex-initial">
                    <button
                      type="button"
                      onClick={() => handleStepClick(step.id)}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                          isDone || isCurrent
                            ? 'bg-brand-500 text-white shadow-[0_0_16px_rgba(37,99,255,0.65)]'
                            : 'border border-brand-400/25 bg-navy-900/75 text-brand-200',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span
                        className={cn(
                          'text-xs font-extrabold',
                          isDone || isCurrent ? 'text-white' : 'text-brand-200/85',
                        )}
                      >
                        {step.label}
                      </span>
                    </button>

                    {index < MISSION_STEPS.length - 1 ? (
                      <div className="h-[2px] flex-1 rounded-full bg-brand-400/30" />
                    ) : null}
                  </div>
                )
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col items-stretch gap-3.5 pt-1 sm:flex-row sm:items-center">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={handleStartMission}
                className="inline-flex h-13 items-center justify-center rounded-2xl bg-mico px-7 text-sm font-extrabold uppercase tracking-wider text-navy-950 shadow-chunky-mico hover:brightness-105"
              >
                COMEÇAR MISSÃO
              </motion.button>

              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => void loadChallenge(true)}
                className="hidden h-13 items-center justify-center rounded-2xl border border-brand-300/30 bg-navy-900/45 px-6 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-white/10 sm:inline-flex"
              >
                GERAR OUTRO TEXTO
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Card: Meta de Hoje */}
        <div className="flex flex-col justify-between gap-6 rounded-[28px] border border-brand-100 bg-white p-6 shadow-card sm:p-7">
          <div className="space-y-5">
            <h2 className="font-display text-lg font-extrabold text-navy-900">Meta de hoje</h2>

            <div className="flex items-center gap-4">
              <GoalRing completed={completedSteps.length} total={3} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-navy-900">Ler, ouvir e quiz</p>
                <p className="mt-0.5 text-xs text-muted-foreground">+45 XP ao concluir a missão</p>
                <XPBar value={missionProgressPercent} className="mt-3" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-muted-foreground">Sua semana</p>
            <div className="grid grid-cols-7 gap-2 text-center">
              {weekDays.map((day) => (
                <div key={day.key} className="flex flex-col items-center gap-2">
                  <span
                    className={cn(
                      'text-[11px] font-extrabold',
                      day.status === 'today' ? 'text-brand-600' : 'text-muted-foreground',
                    )}
                  >
                    {day.label}
                  </span>
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      day.completed
                        ? 'border-2 border-brand-500 bg-brand-500 text-white'
                        : day.status === 'today'
                          ? 'border-2 border-brand-500 bg-brand-50/70'
                          : day.status === 'past'
                            ? 'border border-brand-100 bg-brand-50/50'
                            : 'border border-dashed border-brand-200 bg-transparent',
                    )}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quer ir mais fundo? Section */}
      <section id="deep-dive-section" className="space-y-4">
        <h2 className="font-display text-lg font-extrabold text-navy-900">Quer ir mais fundo?</h2>

        {/* Desktop 3-card Grid */}
        <div className="hidden gap-5 md:grid md:grid-cols-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => openTutor('Conversation practice: ordering coffee at the airport')}
            className="flex flex-col items-start rounded-[24px] border border-brand-100 bg-white p-5 text-left shadow-card hover:border-brand-200"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking/12 text-speaking">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base font-extrabold text-navy-900">
              Praticar conversa
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Café, aeroporto, entrevista. Texto ou voz.
            </p>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => openTutor('gentle light')}
            className="flex flex-col items-start rounded-[24px] border border-brand-100 bg-white p-5 text-left shadow-card hover:border-brand-200"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vocab/12 text-vocab">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base font-extrabold text-navy-900">
              Revisar flashcards
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {vocabPendingCount} palavras para hoje · 3 min
            </p>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => openTutor()}
            className="flex flex-col items-start rounded-[24px] border border-brand-100 bg-white p-5 text-left shadow-card hover:border-brand-200"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mico/20 text-mico-dark">
              <Smile className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-display text-base font-extrabold text-navy-900">
              Mico do dia
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {micosSuperados > 0
                ? `${micosSuperados} micos superados hoje. Continue praticando!`
                : 'Ainda sem micos hoje. Erre à vontade.'}
            </p>
          </motion.button>
        </div>

        {/* Mobile 2-card Grid */}
        <div className="grid grid-cols-2 gap-3.5 md:hidden">
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => openTutor('Conversation practice')}
            className="flex flex-col items-start rounded-[24px] border border-brand-100 bg-white p-4 text-left shadow-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-speaking/12 text-speaking">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="mt-3.5 font-display text-base font-extrabold text-navy-900">
              Conversar
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Cenários com voz ou texto
            </p>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => openTutor('gentle light')}
            className="flex flex-col items-start rounded-[24px] border border-brand-100 bg-white p-4 text-left shadow-card"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vocab/12 text-vocab">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="mt-3.5 font-display text-base font-extrabold text-navy-900">
              Revisar
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {vocabPendingCount} palavras · 3 min
            </p>
          </motion.button>
        </div>
      </section>

      {/* Interactive Mission Workspace */}
      <section ref={missionRef} id="mission-workspace" className="space-y-6 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-extrabold text-navy-900">Seu desafio de hoje</h2>
            <p className="text-sm text-muted-foreground">
              Leia o texto da missão, ouça a pronúncia e clique nas palavras para tirar dúvidas com o Mico.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadChallenge(true)}
            className="sm:hidden"
          >
            Gerar outro texto
          </Button>
        </div>

        {status ? (
          <p className="rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm font-medium text-navy-900">
            {status}
          </p>
        ) : null}

        {isLoadingChallenge || !challenge ? (
          <Card className="border-brand-100 bg-white shadow-card">
            <p className="text-sm text-muted-foreground">Gerando seu texto do dia...</p>
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
            onPlayAudio={handlePlayAudio}
            onPauseAudio={pause}
            onResumeAudio={resume}
            onPlaySelection={() => speakSelection(selectedText, Math.max(0.65, playbackRate - 0.05))}
            onPlaybackRateChange={setPlaybackRate}
            onSelection={(text) => {
              setSelectedText(text)
              if (text) {
                completeStep('read')
              }
            }}
            onAskInsight={() => void askInsight()}
            onCompleteQuizStep={handleCompleteQuizStep}
            quizCompleted={completedSteps.includes('quiz')}
          />
        )}

        <Card className="flex flex-col gap-4 border-brand-100 bg-white shadow-card md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-extrabold text-navy-900">
              Fechou o ritual de hoje?
            </CardTitle>
            <CardDescription className="mt-1">
              Marque o desafio como concluído para ganhar +45 XP e atualizar sua ofensiva.
            </CardDescription>
          </div>
          <Button
            variant="mico"
            size="lg"
            onClick={() => void completeChallenge()}
            disabled={!challenge}
          >
            Marcar como concluido
          </Button>
        </Card>
      </section>

      {/* Floating Tutor Bottom Sheet */}
      <TutorSheet
        challenge={challenge}
        level={preferences.level}
        externalInsight={insight}
        selectedText={selectedText}
      />
    </div>
  )
}
