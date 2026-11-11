import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, ChevronRight, CloudCheck, GraduationCap, RefreshCw, Trash2 } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { difficultyLabels } from '@/lib/constants'
import { aiService } from '@/services/ai-service'
import {
  chatModeLabels,
  useSubjectsStore,
} from '@/stores/subjects-store'
import type { Difficulty, SubjectChatMode } from '@/types/domain'

const LEVEL_ORDER: Difficulty[] = ['beginner', 'intermediate', 'advanced']
const DURATION_ORDER = [5, 8, 12, 15]
const CHAT_MODE_ORDER: SubjectChatMode[] = ['optional', 'always', 'off']

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const {
    subjects,
    isSyncing,
    storageMode,
    activateSubject,
    pauseSubject,
    archiveSubject,
    deleteSubject,
    updateSubjectConfig,
    setSubjectLessons,
  } = useSubjectsStore()

  const [showCompletedLessons, setShowCompletedLessons] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const subject =
    subjects.find((item) => item.id === subjectId) ??
    subjects.find((item) => item.status === 'active') ??
    subjects[0]

  if (!subject) {
    return null
  }

  const percent =
    subject.totalLessons && subject.totalLessons > 0
      ? Math.min(100, Math.round((subject.currentLessonNumber / subject.totalLessons) * 100))
      : 100

  const completedLessons = subject.lessons.filter((l) => l.status === 'completed')
  const upcomingLessons = subject.lessons.filter((l) => l.status !== 'completed')

  function handleCycleLevel() {
    const currentIndex = LEVEL_ORDER.indexOf(subject.level)
    const nextLevel = LEVEL_ORDER[(currentIndex + 1) % LEVEL_ORDER.length]
    updateSubjectConfig(subject.id, { level: nextLevel })
    toast.success(`Nível alterado para ${difficultyLabels[nextLevel]}.`)
  }

  function handleCycleDuration() {
    const currentIndex = DURATION_ORDER.indexOf(subject.durationMinutes)
    const nextDuration = DURATION_ORDER[(currentIndex + 1) % DURATION_ORDER.length]
    updateSubjectConfig(subject.id, { durationMinutes: nextDuration })
    toast.success(`Duração alterada para ${nextDuration} min.`)
  }

  function handleCycleChatMode() {
    const currentIndex = CHAT_MODE_ORDER.indexOf(subject.chatMode)
    const nextMode = CHAT_MODE_ORDER[(currentIndex + 1) % CHAT_MODE_ORDER.length]
    updateSubjectConfig(subject.id, { chatMode: nextMode })
    toast.success(`Chat na missão: ${chatModeLabels[nextMode]}.`)
  }

  function handleStartTodayLesson() {
    if (subject.status !== 'active') {
      activateSubject(subject.id)
    }
    void navigate('/')
  }

  function handlePauseOrResume() {
    if (subject.status === 'active') {
      pauseSubject(subject.id)
      toast.info(`Assunto "${subject.title}" pausado.`)
    } else {
      activateSubject(subject.id)
      toast.success(`Assunto "${subject.title}" retomado como ativo!`)
    }
  }

  function handleArchive() {
    archiveSubject(subject.id)
    toast.info(`Assunto "${subject.title}" arquivado e salvo no banco. Seu vocabulário foi mantido.`)
    void navigate('/subjects')
  }

  function handleDelete() {
    deleteSubject(subject.id)
    toast.success(`Assunto "${subject.title}" removido do banco.`)
    void navigate('/subjects')
  }

  async function handleRegenerate() {
    setIsRegenerating(true)
    const result = await aiService.regenerateSubjectSyllabus(subject)
    setSubjectLessons(subject.id, result.lessons)
    setIsRegenerating(false)
    toast.success(
      result.mode === 'gemini'
        ? 'Próximas lições regeneradas pela IA do Google com foco na sua área!'
        : 'Próximas lições da trilha atualizadas!',
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-16">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void navigate('/subjects')}
          aria-label="Voltar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#DCE7FF] bg-white text-[#0B1437] hover:bg-[#F2F6FF]"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.4]" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-black text-[#0B1437] sm:text-xl">
            {subject.title}
          </h1>
          <p className="text-[13px] font-semibold text-[#55627A]">
            {subject.trackType === 'goal'
              ? `Trilha com meta${subject.targetDateLabel ? ` · ${subject.targetDateLabel}` : ''}`
              : 'Trilha contínua'}
          </p>
        </div>
        <span
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#DCE7FF] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#1B4FE0]"
          title={
            storageMode === 'firebase'
              ? 'Sincronizado com o banco Firebase Firestore'
              : 'Sincronizado com o armazenamento local do perfil'
          }
        >
          <CloudCheck className="h-3.5 w-3.5" />
          {isSyncing
            ? 'Salvando...'
            : storageMode === 'firebase'
              ? 'Salvo no banco'
              : 'Salvo no perfil'}
        </span>
      </header>

      {/* Specialist Professor Banner */}
      {subject.expertPersona ? (
        <div className="flex items-center gap-2.5 rounded-[18px] border border-[#FFE3A3] bg-[#FFF1CF] px-4 py-2.5 text-xs font-extrabold text-[#8A5200]">
          <GraduationCap className="h-4 w-4 shrink-0" />
          <span>Professor Especialista IA: {subject.expertPersona}</span>
        </div>
      ) : null}

      {/* Progress Box */}
      <div className="rounded-[18px] border-2 border-[#DCE7FF] bg-white px-4 py-3.5">
        <div className="mb-1.5 flex items-center justify-between text-[13px] font-extrabold text-[#0B1437]">
          <span>
            {subject.totalLessons
              ? `${subject.currentLessonNumber} de ${subject.totalLessons} lições`
              : `${subject.completedLessonsCount} lições concluídas`}
          </span>
          <span className="text-[#55627A]">{percent}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[#E8EEFB]">
          <motion.div
            className="h-full rounded-full bg-[#2563FF]"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* TRILHA Section */}
      <section className="space-y-2">
        <h2 className="pt-1 text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
          TRILHA
        </h2>

        {/* Grouped Completed Lessons */}
        {subject.completedLessonsCount > 0 ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCompletedLessons((prev) => !prev)}
              className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-[#F8FAFF] px-3.5 py-3 text-left hover:bg-[#F2F6FF]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-[#0B1437]">
                <Check className="h-4 w-4 stroke-[2.6]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-black text-[#0B1437]">
                  {subject.completedLessonsCount} lições feitas
                </p>
                <p className="truncate text-[13px] font-semibold text-[#55627A]">
                  {subject.completedLessonsSummary}
                </p>
              </div>
              {showCompletedLessons ? (
                <ChevronDown className="h-5 w-5 shrink-0 text-[#55627A]" />
              ) : (
                <ChevronRight className="h-5 w-5 shrink-0 text-[#55627A]" />
              )}
            </button>

            {showCompletedLessons && completedLessons.length > 0 ? (
              <div className="space-y-1.5 pl-4">
                {completedLessons.map((lesson) => (
                  <div
                    key={lesson.number}
                    className="flex items-center gap-3 rounded-2xl border border-[#DCE7FF] bg-white/80 px-3.5 py-2.5 text-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#22C55E]/20 text-xs font-black text-[#15803D]">
                      {lesson.number}
                    </span>
                    <span className="flex-1 font-bold text-[#0B1437]">{lesson.title}</span>
                    <span className="text-xs font-semibold text-[#55627A]">Concluída</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Today & Upcoming Ready Lessons */}
        {upcomingLessons.map((lesson) => {
          const isToday = lesson.status === 'today'
          return (
            <div
              key={lesson.number}
              className={`flex items-center gap-3 rounded-[18px] border-2 bg-white px-3.5 py-3 ${
                isToday ? 'border-[#2563FF]' : 'border-[#DCE7FF]'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                  isToday
                    ? 'bg-[#2563FF] text-white'
                    : 'bg-[#E8EEFB] text-[#55627A]'
                }`}
              >
                {lesson.number}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-black text-[#0B1437]">
                  {lesson.title}
                </p>
                <p className="text-[13px] font-semibold text-[#55627A]">
                  {lesson.subtitle}
                </p>
              </div>

              {isToday ? (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStartTodayLesson}
                  className="h-10 shrink-0 rounded-2xl bg-[#2563FF] px-3.5 font-display text-[13px] font-black uppercase tracking-wider text-white shadow-[0_3px_0_#1238A8] hover:bg-[#1B4FE0]"
                >
                  IR
                </motion.button>
              ) : null}
            </div>
          )
        })}

        {/* Dashed Progressive Generation Notice */}
        <div className="rounded-[18px] border-2 border-dashed border-[#B9CFFF] p-3 text-center text-[13px] font-bold text-[#55627A]">
          As próximas lições são geradas conforme o seu progresso.
        </div>
      </section>

      {/* CONFIGURAR ESTE ASSUNTO Section */}
      <section className="space-y-2 pt-2">
        <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
          CONFIGURAR ESTE ASSUNTO
        </h2>

        <button
          type="button"
          onClick={handleCycleLevel}
          className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-white px-3.5 py-3 text-left hover:bg-[#F2F6FF]"
        >
          <span className="flex-1 font-display text-[15px] font-black text-[#0B1437]">
            Nível
          </span>
          <span className="text-[13px] font-extrabold text-[#1B4FE0]">
            {difficultyLabels[subject.level]}
          </span>
          <ChevronRight className="h-5 w-5 text-[#0B1437]" />
        </button>

        <button
          type="button"
          onClick={handleCycleDuration}
          className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-white px-3.5 py-3 text-left hover:bg-[#F2F6FF]"
        >
          <span className="flex-1 font-display text-[15px] font-black text-[#0B1437]">
            Duração da lição
          </span>
          <span className="text-[13px] font-extrabold text-[#1B4FE0]">
            {subject.durationMinutes} min
          </span>
          <ChevronRight className="h-5 w-5 text-[#0B1437]" />
        </button>

        <button
          type="button"
          onClick={handleCycleChatMode}
          className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-white px-3.5 py-3 text-left hover:bg-[#F2F6FF]"
        >
          <span className="flex-1 font-display text-[15px] font-black text-[#0B1437]">
            Chat na missão
          </span>
          <span className="text-[13px] font-extrabold text-[#1B4FE0]">
            {chatModeLabels[subject.chatMode]}
          </span>
          <ChevronRight className="h-5 w-5 text-[#0B1437]" />
        </button>

        {/* Actions: Pausar · Regenerar · Arquivar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={handlePauseOrResume}
            className="rounded-xl border-2 border-[#B9CFFF] bg-white px-3.5 py-2 text-xs font-black text-[#1B4FE0] hover:bg-[#F2F6FF]"
          >
            {subject.status === 'active' ? 'Pausar assunto' : 'Retomar assunto'}
          </button>

          <button
            type="button"
            disabled={isRegenerating}
            onClick={() => void handleRegenerate()}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#DCE7FF] bg-white px-3.5 py-2 text-xs font-black text-[#1B4FE0] hover:bg-[#F2F6FF] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Gerando com IA...' : 'Regenerar'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleArchive}
              className="rounded-xl border-2 border-[#DCE7FF] bg-white px-3.5 py-2 text-xs font-black text-[#55627A] hover:bg-slate-100"
            >
              Arquivar
            </button>
            {subjects.length > 1 ? (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Excluir assunto"
                title="Excluir assunto do banco"
                className="inline-flex items-center gap-1 rounded-xl border-2 border-red-200 bg-white px-2.5 py-2 text-xs font-black text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <p className="pt-1 text-center text-xs font-semibold text-[#55627A]">
          Mudanças valem para as próximas lições.
        </p>
      </section>
    </div>
  )
}
