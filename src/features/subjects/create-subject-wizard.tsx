import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, GraduationCap, Pencil, Sparkles, X } from 'lucide-react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Mascot } from '@/components/mascot/mascot'
import { SubjectIconBadge } from '@/features/subjects/subject-icon'
import { BRAND_ASSETS } from '@/lib/assets'
import { celebrate } from '@/lib/celebrate'
import { difficultyLabels } from '@/lib/constants'
import { aiService } from '@/services/ai-service'
import { buildDraftFromPrompt, useSubjectsStore } from '@/stores/subjects-store'
import type {
  Difficulty,
  StudySubject,
  SubjectScenario,
  SubjectTone,
  SubjectTrackType,
} from '@/types/domain'

const EXAMPLE_PROMPTS: { label: string; prompt: string }[] = [
  {
    label: 'Entrevista de emprego',
    prompt: 'Vou fazer uma entrevista para dev backend em uma empresa americana daqui a 2 meses.',
  },
  {
    label: 'Viagem',
    prompt: 'Vou viajar para os Estados Unidos de férias e quero me virar no aeroporto, hotel e restaurante.',
  },
  {
    label: 'Trabalho em tecnologia',
    prompt: 'Trabalho como desenvolvedor em um time global e preciso explicar decisões técnicas e pull requests.',
  },
  {
    label: 'Atendimento ao cliente',
    prompt: 'Atendo clientes estrangeiros por chat e chamada e quero resolver problemas com clareza.',
  },
  {
    label: 'Reuniões',
    prompt: 'Participo de reuniões semanais com líderes de produto e preciso apresentar resultados.',
  },
  {
    label: 'Dia a dia',
    prompt: 'Quero destravar conversas casuais do dia a dia, pedir café e fazer amizades em inglês.',
  },
]

export function CreateSubjectWizardPage() {
  const navigate = useNavigate()
  const { createSubject } = useSubjectsStore()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [prompt, setPrompt] = useState(
    'Vou fazer uma entrevista para dev backend em uma empresa americana daqui a 2 meses.',
  )
  const [level, setLevel] = useState<Difficulty>('intermediate')
  const [durationMinutes, setDurationMinutes] = useState<number>(8)
  const [tone, setTone] = useState<SubjectTone>('Formal')
  const [trackType, setTrackType] = useState<SubjectTrackType>('goal')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationSource, setGenerationSource] = useState<'gemini' | 'fallback'>('fallback')

  // Step 3 editable draft state
  const [draft, setDraft] = useState<Omit<StudySubject, 'id' | 'createdAt' | 'status'>>(() =>
    buildDraftFromPrompt(
      'Vou fazer uma entrevista para dev backend em uma empresa americana daqui a 2 meses.',
    ),
  )
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  function handleContinueFromStep1() {
    if (!prompt.trim()) {
      toast.error('Conte em uma frase sobre o que você quer treinar.')
      return
    }
    setStep(2)
  }

  async function handleBuildPreview() {
    setIsGenerating(true)
    const response = await aiService.generateSubjectBlueprint({
      prompt,
      level,
      durationMinutes,
      trackType,
      tone,
    })
    setDraft(response.draft)
    setGenerationSource(response.mode)
    setIsGenerating(false)
    setStep(3)

    if (response.mode === 'gemini') {
      toast.success('Trilha criada pela IA do Google com foco especialista!')
    }
  }

  function handleRemoveScenario(scenarioId: string) {
    setDraft((prev) => ({
      ...prev,
      chatScenarios: prev.chatScenarios.filter((item: SubjectScenario) => item.id !== scenarioId),
    }))
  }

  function handleCreateSubject() {
    const created = createSubject(draft)
    celebrate()
    toast.success(`Assunto "${created.title}" criado e definido como ativo!`)
    void navigate('/')
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-xl flex-col justify-between pb-10">
      <div className="space-y-5">
        {/* Wizard Header with 3-step Progress */}
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void navigate(-1)}
            aria-label="Cancelar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#DCE7FF] bg-white text-[#0B1437] hover:bg-[#F2F6FF]"
          >
            <X className="h-5 w-5 stroke-[2.4]" />
          </button>

          <div className="flex flex-1 gap-1.5">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`h-2.5 flex-1 rounded-full ${
                  idx <= step ? 'bg-[#2563FF]' : 'bg-[#DCE7FF]'
                }`}
              />
            ))}
          </div>

          <b className="font-display text-sm font-black text-[#0B1437]">{step}/3</b>
        </header>

        {/* STEP 1: Prompt & Examples */}
        {step === 1 ? (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-[26px] font-black leading-[1.15] text-[#0B1437]">
                Sobre o que você quer treinar?
              </h1>
              <p className="mt-1 text-[13px] font-semibold text-[#55627A]">
                Conte em uma frase. O Mico monta o resto.
              </p>
            </div>

            <div className="relative rounded-[20px] border-2 border-[#2563FF] bg-white p-4">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value.slice(0, 300))}
                rows={4}
                maxLength={300}
                aria-label="Sobre o que você quer treinar?"
                placeholder="Ex.: Vou fazer uma entrevista para dev backend em uma empresa americana daqui a 2 meses."
                className="w-full resize-none border-0 bg-transparent pb-5 font-sans text-lg font-semibold leading-relaxed text-[#0F172A] focus:outline-none focus:ring-0"
              />
              <span className="absolute right-3.5 bottom-2.5 text-xs font-bold text-[#55627A]">
                {prompt.length}/300
              </span>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
                OU COMECE POR UM EXEMPLO
              </h2>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setPrompt(item.prompt)}
                    className="rounded-full border-2 border-[#DCE7FF] bg-white px-3.5 py-2 text-sm font-extrabold text-[#0B1437] hover:border-[#2563FF] hover:bg-[#F2F6FF]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mico Privacy & Detail Tip */}
            <div className="flex items-center gap-3 rounded-[18px] bg-[#FFF1CF] px-3.5 py-3">
              <img
                src={BRAND_ASSETS.mascotAvatar}
                alt="Mico"
                className="h-12 w-12 shrink-0 object-contain"
              />
              <p className="text-sm font-bold leading-snug text-[#0B1437]">
                Quanto mais detalhe, melhor a trilha. Não coloque dados pessoais nem sigilosos da empresa.
              </p>
            </div>
          </div>
        ) : null}

        {/* STEP 2: Level, Duration & Track Type */}
        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <h1 className="font-display text-[26px] font-black leading-[1.15] text-[#0B1437]">
                Qual seu ritmo para esse assunto?
              </h1>
              <p className="mt-1 text-[13px] font-semibold text-[#55627A]">
                A IA do Google assume o papel de um professor sênior na sua área e monta tudo sob medida.
              </p>
            </div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-[#DCE7FF] bg-white p-8 text-center">
                <Mascot state="thinking" className="h-24 w-24" />
                <div className="space-y-1">
                  <p className="font-display text-lg font-black text-[#0B1437]">
                    O Mico Especialista está montando sua trilha...
                  </p>
                  <p className="text-xs font-semibold text-[#55627A]">
                    Afunilando lições, cenários reais e jargões da área com a IA do Google.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Nível */}
                <div className="space-y-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
                    NÍVEL DO INGLÊS NESTE ASSUNTO
                  </h2>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        className={`rounded-2xl border-2 p-3 text-center text-sm font-black transition-colors ${
                          level === lvl
                            ? 'border-[#2563FF] bg-[#DCE7FF] text-[#1B4FE0]'
                            : 'border-[#DCE7FF] bg-white text-[#0B1437] hover:bg-[#F2F6FF]'
                        }`}
                      >
                        {difficultyLabels[lvl]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tempo diário */}
                <div className="space-y-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
                    DURAÇÃO DA LIÇÃO DIÁRIA
                  </h2>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[5, 8, 12, 15].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setDurationMinutes(mins)}
                        className={`rounded-2xl border-2 p-3 text-center text-sm font-black transition-colors ${
                          durationMinutes === mins
                            ? 'border-[#2563FF] bg-[#DCE7FF] text-[#1B4FE0]'
                            : 'border-[#DCE7FF] bg-white text-[#0B1437] hover:bg-[#F2F6FF]'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tom e Formato */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
                      TOM DAS SITUAÇÕES
                    </h2>
                    <div className="flex gap-2">
                      {(['Formal', 'Casual', 'Técnico'] as SubjectTone[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`flex-1 rounded-2xl border-2 py-2.5 text-xs font-black ${
                            tone === t
                              ? 'border-[#2563FF] bg-[#DCE7FF] text-[#1B4FE0]'
                              : 'border-[#DCE7FF] bg-white text-[#0B1437]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
                      TIPO DE TRILHA
                    </h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTrackType('goal')}
                        className={`flex-1 rounded-2xl border-2 py-2.5 text-xs font-black ${
                          trackType === 'goal'
                            ? 'border-[#2563FF] bg-[#DCE7FF] text-[#1B4FE0]'
                            : 'border-[#DCE7FF] bg-white text-[#0B1437]'
                        }`}
                      >
                        Com meta (14 lições)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrackType('continuous')}
                        className={`flex-1 rounded-2xl border-2 py-2.5 text-xs font-black ${
                          trackType === 'continuous'
                            ? 'border-[#2563FF] bg-[#DCE7FF] text-[#1B4FE0]'
                            : 'border-[#DCE7FF] bg-white text-[#0B1437]'
                        }`}
                      >
                        Contínua
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* STEP 3: Preview (Olha o que o Mico montou) */}
        {step === 3 ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="font-display text-[26px] font-black leading-[1.15] text-[#0B1437]">
                  Olha o que o Mico montou
                </h1>
                <p className="mt-1 text-[13px] font-semibold text-[#55627A]">
                  Ajuste o que quiser antes de criar.
                </p>
              </div>
              {generationSource === 'gemini' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#DCE7FF] px-3 py-1 text-xs font-black text-[#1B4FE0]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Google Gemini
                </span>
              ) : null}
            </div>

            {/* Editable Subject Preview Card */}
            <div className="flex items-start gap-3 rounded-[18px] border-2 border-[#2563FF] bg-white p-3.5">
              <SubjectIconBadge icon={draft.icon} />
              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, title: event.target.value }))
                      }
                      aria-label="Título do assunto"
                      className="w-full rounded-xl border border-[#2563FF] px-2.5 py-1 font-display text-lg font-black text-[#0B1437] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(false)}
                      aria-label="Salvar título"
                      className="rounded-lg bg-[#2563FF] p-1.5 text-white"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display text-lg font-black text-[#0B1437]">
                      {draft.title}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingTitle(true)}
                      aria-label="Editar título do assunto"
                      className="rounded-lg p-1 text-[#1B4FE0] hover:bg-[#DCE7FF]"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <p className="mt-1 mb-2 text-[13px] font-semibold leading-snug text-[#55627A]">
                  {draft.summary}
                </p>

                {draft.expertPersona ? (
                  <div className="mb-2.5 flex items-center gap-1.5 rounded-xl bg-[#FFF1CF] px-2.5 py-1.5 text-xs font-extrabold text-[#8A5200]">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    <span>Professor IA: {draft.expertPersona}</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#DCE7FF] px-3 py-1 text-xs font-extrabold text-[#1B4FE0]">
                    {difficultyLabels[draft.level]}
                  </span>
                  <span className="rounded-full bg-[#DCE7FF] px-3 py-1 text-xs font-extrabold text-[#1B4FE0]">
                    {draft.tone}
                  </span>
                  <span className="rounded-full bg-[#DCE7FF] px-3 py-1 text-xs font-extrabold text-[#1B4FE0]">
                    {draft.totalLessons ? `${draft.totalLessons} lições` : 'Contínua'}
                  </span>
                </div>
              </div>
            </div>

            {/* CENÁRIOS DO CHAT */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
                CENÁRIOS DO CHAT
              </h2>

              {draft.chatScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className="flex items-center gap-3 rounded-[18px] border-2 border-[#DCE7FF] bg-white px-3.5 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[15px] font-black text-[#0B1437]">
                      {scenario.title}
                    </p>
                    <p className="text-[13px] font-semibold text-[#55627A]">
                      {scenario.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveScenario(scenario.id)}
                    aria-label="Remover cenário"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#DCE7FF] bg-white text-[#0B1437] hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X className="h-4 w-4 stroke-[2.2]" />
                  </button>
                </div>
              ))}
            </div>

            {/* PALAVRAS-CHAVE */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-[0.08em] text-[#55627A]">
                PALAVRAS-CHAVE · {draft.keywords.length} DE {draft.totalKeywordsPool}
              </h2>
              <div className="flex flex-wrap gap-2">
                {draft.keywords.map((word) => (
                  <span
                    key={word}
                    className="rounded-full bg-[#DCE7FF] px-3 py-1.5 text-[13px] font-extrabold text-[#1B4FE0]"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom Sticky Action Buttons */}
      <div className="mt-6 border-t-2 border-[#DCE7FF] pt-4">
        {step === 1 ? (
          <div className="flex gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleContinueFromStep1}
              className="h-14 flex-1 rounded-2xl bg-[#FFB020] font-display text-base font-black uppercase tracking-wider text-[#0B1437] shadow-[0_4px_0_#C77F00] hover:brightness-105"
            >
              CONTINUAR
            </motion.button>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={isGenerating}
              onClick={() => setStep(1)}
              className="h-14 flex-1 rounded-2xl border-2 border-[#B9CFFF] bg-white font-display text-[15px] font-black uppercase tracking-wider text-[#1B4FE0] shadow-[0_4px_0_#DCE7FF] disabled:opacity-50"
            >
              VOLTAR
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              disabled={isGenerating}
              onClick={() => void handleBuildPreview()}
              className="h-14 flex-[1.4] rounded-2xl bg-[#FFB020] font-display text-[15px] font-black uppercase tracking-wider text-[#0B1437] shadow-[0_4px_0_#C77F00] hover:brightness-105 disabled:opacity-50"
            >
              {isGenerating ? 'MONTANDO COM IA...' : 'VER PRÉVIA'}
            </motion.button>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex gap-2.5">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(1)}
              className="h-14 flex-1 rounded-2xl border-2 border-[#B9CFFF] bg-white font-display text-[15px] font-black uppercase tracking-wider text-[#1B4FE0] shadow-[0_4px_0_#DCE7FF] hover:bg-[#F2F6FF]"
            >
              AJUSTAR
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleCreateSubject}
              className="h-14 flex-[1.4] rounded-2xl bg-[#FFB020] font-display text-[15px] font-black uppercase tracking-wider text-[#0B1437] shadow-[0_4px_0_#C77F00] hover:brightness-105"
            >
              CRIAR ASSUNTO
            </motion.button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
