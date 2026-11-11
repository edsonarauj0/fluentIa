import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { SubjectIconBadge } from '@/features/subjects/subject-icon'
import { MAX_SAVED_SUBJECTS, useSubjectsStore } from '@/stores/subjects-store'
import type { StudySubject } from '@/types/domain'

function formatSelectorSubtitle(subject: StudySubject): string {
  if (subject.status === 'active') {
    if (subject.trackType === 'goal' && subject.totalLessons) {
      return `Trilha com meta · lição ${subject.currentLessonNumber} de ${subject.totalLessons}`
    }
    return `Contínua · lição ${subject.currentLessonNumber}`
  }

  if (subject.trackType === 'goal' && subject.totalLessons) {
    return `Pausado · lição ${subject.currentLessonNumber} de ${subject.totalLessons}`
  }

  return `Pausado · contínua · ${subject.completedLessonsCount} lições`
}

export function SubjectSelectorSheet() {
  const navigate = useNavigate()
  const {
    subjects,
    isSelectorOpen,
    closeSelector,
    activateSubject,
  } = useSubjectsStore()

  const activeSubjects = subjects.filter((s) => s.status === 'active')
  const pausedSubjects = subjects.filter((s) => s.status === 'paused')

  useEffect(() => {
    if (!isSelectorOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeSelector()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelectorOpen, closeSelector])

  function handleResume(subject: StudySubject) {
    activateSubject(subject.id)
    toast.success(`Assunto "${subject.title}" ativado!`)
  }

  function handleOpenNewSubject() {
    closeSelector()
    void navigate('/subjects/new')
  }

  function handleManageSubjects() {
    closeSelector()
    void navigate('/subjects')
  }

  return (
    <AnimatePresence>
      {isSelectorOpen ? (
        <>
          <motion.div
            key="subject-selector-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSelector}
            className="fixed inset-0 z-40 bg-[#0B1437]/50 backdrop-blur-[1px]"
            aria-hidden="true"
          />

          <motion.section
            key="subject-selector-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Seus assuntos"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_event, info) => {
              if (info.offset.y > 90 || info.velocity.y > 450) {
                closeSelector()
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-lg rounded-t-[28px] border-2 border-[#DCE7FF] bg-white pt-2.5 pb-6 shadow-2xl safe-bottom"
          >
            {/* Drag Handle */}
            <div className="mx-auto mb-3 h-[5px] w-10 rounded-full bg-[#DCE7FF]" />

            {/* Sheet Header */}
            <div className="flex items-start justify-between gap-3 px-5 pb-3">
              <div>
                <h2 className="font-display text-[22px] font-black text-[#0B1437]">
                  Seus assuntos
                </h2>
                <p className="text-[13px] font-semibold text-[#55627A]">
                  {activeSubjects.length} ativo · {pausedSubjects.length} pausados · até {MAX_SAVED_SUBJECTS} guardados
                </p>
              </div>

              <button
                type="button"
                onClick={handleManageSubjects}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#DCE7FF] bg-[#F2F6FF] px-3 py-1.5 text-xs font-black text-[#1B4FE0] hover:bg-[#DCE7FF]"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Gerenciar
              </button>
            </div>

            {/* Subject List */}
            <div className="max-h-[60dvh] space-y-2.5 overflow-y-auto px-5">
              {/* Active Subject */}
              {activeSubjects.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => {
                    closeSelector()
                    void navigate(`/subjects/${subject.id}`)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      closeSelector()
                      void navigate(`/subjects/${subject.id}`)
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-[#2563FF] bg-[#F2F6FF] px-3.5 py-3 transition-colors hover:bg-[#DCE7FF]/60"
                >
                  <SubjectIconBadge icon={subject.icon} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-black text-[#0B1437]">
                      {subject.title}
                    </p>
                    <p className="truncate text-[13px] font-semibold text-[#55627A]">
                      {formatSelectorSubtitle(subject)}
                    </p>
                  </div>
                  <div
                    aria-label="Ativo"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563FF] text-white"
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </div>
                </div>
              ))}

              {/* Paused Subjects */}
              {pausedSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-white px-3.5 py-3"
                >
                  <SubjectIconBadge icon={subject.icon} />
                  <button
                    type="button"
                    onClick={() => {
                      closeSelector()
                      void navigate(`/subjects/${subject.id}`)
                    }}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate font-display text-base font-black text-[#0B1437]">
                      {subject.title}
                    </p>
                    <p className="truncate text-[13px] font-semibold text-[#55627A]">
                      {formatSelectorSubtitle(subject)}
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

              {/* + Novo assunto */}
              <button
                type="button"
                onClick={handleOpenNewSubject}
                className="w-full rounded-[18px] border-2 border-dashed border-[#B9CFFF] p-3.5 text-center font-display text-[15px] font-black text-[#1B4FE0] hover:bg-[#F2F6FF]"
              >
                + Novo assunto
              </button>
            </div>

            {/* Footer Note */}
            <div className="px-5 pt-3 text-center">
              <p className="text-[13px] font-semibold leading-snug text-[#55627A]">
                Cada assunto guarda o seu progresso. Streak, XP e Mico são os mesmos em todos.
              </p>
              <button
                type="button"
                onClick={handleManageSubjects}
                className="mt-1.5 text-xs font-black text-[#1B4FE0] underline-offset-2 hover:underline"
              >
                Ver todos e arquivados em Meus assuntos →
              </button>
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  )
}
