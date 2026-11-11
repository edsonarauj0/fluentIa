import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { SubjectIconBadge } from '@/features/subjects/subject-icon'
import { difficultyLabels } from '@/lib/constants'
import {
  MAX_SAVED_SUBJECTS,
  chatModePillLabels,
  useSubjectsStore,
} from '@/stores/subjects-store'
import type { StudySubject } from '@/types/domain'

function computeSubjectPercent(subject: StudySubject): number {
  if (!subject.totalLessons || subject.totalLessons <= 0) {
    return 100
  }
  return Math.min(100, Math.round((subject.currentLessonNumber / subject.totalLessons) * 100))
}

function formatPausedSubtitle(subject: StudySubject): string {
  if (subject.trackType === 'goal' && subject.totalLessons) {
    const pct = computeSubjectPercent(subject)
    return `Lição ${subject.currentLessonNumber} de ${subject.totalLessons} · ${pct}%`
  }
  return `Contínua · ${subject.completedLessonsCount} lições feitas`
}

export function MySubjectsPage() {
  const navigate = useNavigate()
  const { subjects, activateSubject } = useSubjectsStore()

  const activeSubject = subjects.find((s) => s.status === 'active') ?? subjects[0]
  const pausedSubjects = subjects.filter((s) => s.status === 'paused')
  const archivedSubjects = subjects.filter((s) => s.status === 'archived')
  const savedCount = (activeSubject ? 1 : 0) + pausedSubjects.length

  function handleResume(subject: StudySubject) {
    activateSubject(subject.id)
    toast.success(`Assunto "${subject.title}" agora está ativo!`)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-28">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void navigate(-1)}
          aria-label="Voltar"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#DCE7FF] bg-white text-[#0B1437] hover:bg-[#F2F6FF]"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.4]" />
        </button>
        <div>
          <h1 className="font-display text-xl font-black text-[#0B1437] sm:text-2xl">
            Meus assuntos
          </h1>
          <p className="text-[13px] font-semibold text-[#55627A]">
            Um ativo por vez. Você tem {savedCount} de {MAX_SAVED_SUBJECTS}.
          </p>
        </div>
      </header>

      {/* ATIVO Section */}
      {activeSubject ? (
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
            ATIVO
          </h2>

          <div className="rounded-[22px] border-2 border-[#2563FF] bg-white p-4 shadow-[0_4px_0_#B9CFFF] sm:p-5">
            <div className="flex items-center gap-3">
              <SubjectIconBadge icon={activeSubject.icon} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-lg font-black text-[#0B1437]">
                  {activeSubject.title}
                </h3>
                <p className="text-[13px] font-semibold text-[#55627A]">
                  {activeSubject.trackType === 'goal'
                    ? `Trilha com meta${activeSubject.targetDateLabel ? ` · ${activeSubject.targetDateLabel}` : ''}`
                    : 'Trilha contínua'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3.5 mb-1.5 flex items-center justify-between text-[13px] font-extrabold text-[#0B1437]">
              <span>
                {activeSubject.totalLessons
                  ? `${activeSubject.currentLessonNumber} de ${activeSubject.totalLessons} lições`
                  : `${activeSubject.completedLessonsCount} lições concluídas`}
              </span>
              <span className="text-[#55627A]">{computeSubjectPercent(activeSubject)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[#E8EEFB]">
              <motion.div
                className="h-full rounded-full bg-[#2563FF]"
                initial={{ width: 0 }}
                animate={{ width: `${computeSubjectPercent(activeSubject)}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            </div>

            {/* Config Pills */}
            <div className="mt-3 mb-3.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#DCE7FF] px-3 py-1 text-xs font-extrabold text-[#1B4FE0]">
                {difficultyLabels[activeSubject.level]}
              </span>
              <span className="rounded-full bg-[#DCE7FF] px-3 py-1 text-xs font-extrabold text-[#1B4FE0]">
                {activeSubject.durationMinutes} min
              </span>
              <span className="rounded-full bg-[#DCE7FF] px-3 py-1 text-xs font-extrabold text-[#1B4FE0]">
                {chatModePillLabels[activeSubject.chatMode]}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5">
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => void navigate('/')}
                className="h-12 flex-1 rounded-2xl bg-[#2563FF] font-display text-[15px] font-black uppercase tracking-wider text-white shadow-[0_4px_0_#1238A8] hover:bg-[#1B4FE0]"
              >
                CONTINUAR
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => void navigate(`/subjects/${activeSubject.id}`)}
                className="h-12 flex-1 rounded-2xl border-2 border-[#B9CFFF] bg-white font-display text-[15px] font-black uppercase tracking-wider text-[#1B4FE0] shadow-[0_4px_0_#DCE7FF] hover:bg-[#F2F6FF]"
              >
                CONFIGURAR
              </motion.button>
            </div>
          </div>
        </section>
      ) : null}

      {/* PAUSADOS Section */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
          PAUSADOS · {pausedSubjects.length}
        </h2>

        {pausedSubjects.map((subject) => (
          <div
            key={subject.id}
            className="flex items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-white px-3.5 py-3"
          >
            <SubjectIconBadge icon={subject.icon} />
            <button
              type="button"
              onClick={() => void navigate(`/subjects/${subject.id}`)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate font-display text-base font-black text-[#0B1437]">
                {subject.title}
              </p>
              <p className="truncate text-[13px] font-semibold text-[#55627A]">
                {formatPausedSubtitle(subject)}
              </p>
            </button>
            <button
              type="button"
              onClick={() => handleResume(subject)}
              className="shrink-0 rounded-full border-2 border-[#B9CFFF] bg-white px-3.5 py-1.5 text-xs font-black text-[#1B4FE0] hover:bg-[#F2F6FF]"
            >
              Retomar
            </button>
          </div>
        ))}
      </section>

      {/* ARQUIVADOS Section */}
      {archivedSubjects.length > 0 ? (
        <section className="space-y-2.5">
          <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
            ARQUIVADOS · {archivedSubjects.length}
          </h2>

          {archivedSubjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => void navigate(`/subjects/${subject.id}`)}
              className="flex w-full items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-[#F8FAFF] px-3.5 py-3 text-left hover:bg-[#F2F6FF]"
            >
              <SubjectIconBadge icon={subject.icon} status="archived" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-black text-[#475569]">
                  {subject.title}
                </p>
                <p className="truncate text-[13px] font-semibold text-[#55627A]">
                  Vocabulário mantido
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-[#55627A]" />
            </button>
          ))}
        </section>
      ) : null}

      {/* Bottom Sticky Action */}
      <div className="pt-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => void navigate('/subjects/new')}
          className="h-14 w-full rounded-2xl bg-[#FFB020] font-display text-base font-black uppercase tracking-wider text-[#0B1437] shadow-[0_4px_0_#C77F00] hover:brightness-105"
        >
          + NOVO ASSUNTO
        </motion.button>
      </div>
    </div>
  )
}
