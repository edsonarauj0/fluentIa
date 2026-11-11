import { create } from 'zustand'
import { readStorage, writeStorage } from '@/lib/storage'
import { SUBJECTS_STORAGE_KEY, subjectsService } from '@/services/subjects-service'
import type {
  Difficulty,
  StudySubject,
  SubjectChatMode,
  SubjectIconName,
  SubjectLesson,
  SubjectTone,
  SubjectTrackType,
} from '@/types/domain'

export const MAX_SAVED_SUBJECTS = 5

export const INITIAL_SUBJECTS: StudySubject[] = [
  {
    id: 'entrevista-tech',
    title: 'Entrevista de tecnologia',
    summary: 'Prepare-se para falar de projetos, decisões técnicas e trabalho em equipe.',
    prompt: 'Vou fazer uma entrevista para dev backend em uma empresa americana daqui a 2 meses.',
    expertPersona: 'Staff Backend Engineer & Tech Interview Coach nos EUA',
    icon: 'briefcase',
    status: 'active',
    trackType: 'goal',
    targetDateLabel: '10 jan',
    currentLessonNumber: 5,
    completedLessonsCount: 4,
    completedLessonsSummary: 'Apresentação, experiência, habilidades',
    totalLessons: 14,
    level: 'intermediate',
    tone: 'Formal',
    durationMinutes: 8,
    chatMode: 'optional',
    lessons: [
      {
        number: 1,
        title: 'Apresentação pessoal e pitch',
        subtitle: 'Concluída',
        status: 'completed',
        durationMinutes: 8,
      },
      {
        number: 2,
        title: 'Contando sua experiência recente',
        subtitle: 'Concluída',
        status: 'completed',
        durationMinutes: 8,
      },
      {
        number: 3,
        title: 'Destacando habilidades técnicas',
        subtitle: 'Concluída',
        status: 'completed',
        durationMinutes: 8,
      },
      {
        number: 4,
        title: 'Desafios superados na carreira',
        subtitle: 'Concluída',
        status: 'completed',
        durationMinutes: 8,
      },
      {
        number: 5,
        title: 'Falando do seu último projeto',
        subtitle: 'Hoje · 8 min · ler, ouvir, quiz',
        status: 'today',
        durationMinutes: 8,
        readingText:
          'In my last project, I led the backend migration to a scalable service architecture. We had a tight deadline, so I discussed the main trade-offs with every stakeholder before the deploy. Clear feedback during each pull request helped our team take ownership and deliver on time.',
        reflectionQuestion:
          'Como você explicaria em uma frase a decisão técnica mais importante do seu último projeto?',
        mentorTip:
          'Dica do Professor: recrutadores americanos adoram o método STAR. Sempre use "I led" ou "I owned" para a sua parte específica, sem esconder seu impacto atrás de "we".',
      },
      {
        number: 6,
        title: 'Trabalho em equipe',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes: 8,
        readingText:
          'Working with a distributed engineering team requires clear communication and empathy. When we disagree on a technical approach, we focus on data and shared goals rather than personal opinions.',
        reflectionQuestion: 'Qual situação de trabalho em equipe você costuma citar em entrevistas?',
        mentorTip:
          'Dica do Professor: ao falar de conflitos técnicos, mostre como você ouviu o outro lado e usou métricas ("benchmarks", "latency") para decidir.',
      },
      {
        number: 7,
        title: 'Explicando decisões técnicas',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes: 8,
        readingText:
          'Every technical decision involves a trade-off between speed, cost, and maintainability. During an interview, explaining why you rejected an alternative is just as important as explaining what you built.',
        reflectionQuestion: 'Qual trade-off técnico você já precisou defender no trabalho?',
        mentorTip:
          'Dica do Professor: nunca diga que uma tecnologia é "a melhor"; diga "it was the best fit for our constraints at that time".',
      },
    ],
    chatScenarios: [
      {
        id: 'sc-1',
        title: 'Recrutador técnico',
        subtitle: 'Apresentar-se e falar da carreira',
      },
      {
        id: 'sc-2',
        title: 'Gerente de engenharia',
        subtitle: 'Explicar o último projeto',
      },
      {
        id: 'sc-3',
        title: 'Entrevista comportamental',
        subtitle: 'Responder sobre trabalho em equipe',
      },
    ],
    keywords: [
      'deploy',
      'scalable',
      'trade-off',
      'stakeholder',
      'pull request',
      'deadline',
      'feedback',
      'ownership',
    ],
    totalKeywordsPool: 30,
    createdAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'viagem-eua',
    title: 'Viagem para os EUA',
    summary: 'Passe pela imigração, aeroporto, hotel e restaurantes com confiança.',
    prompt: 'Vou viajar para os Estados Unidos de férias e quero treinar situações de aeroporto, hotel e restaurante.',
    expertPersona: 'Mentor de Inglês para Viagens & Imigração nos EUA',
    icon: 'plane',
    status: 'paused',
    trackType: 'goal',
    targetDateLabel: '15 fev',
    currentLessonNumber: 2,
    completedLessonsCount: 2,
    completedLessonsSummary: 'Check-in e embarque',
    totalLessons: 10,
    level: 'beginner',
    tone: 'Casual',
    durationMinutes: 8,
    chatMode: 'optional',
    lessons: [
      {
        number: 1,
        title: 'No balcão de check-in',
        subtitle: 'Concluída',
        status: 'completed',
        durationMinutes: 8,
      },
      {
        number: 2,
        title: 'Passando pela imigração',
        subtitle: 'Hoje · 8 min · ler, ouvir, quiz',
        status: 'today',
        durationMinutes: 8,
        readingText:
          'When you arrive at customs, the officer will ask for your passport and return ticket. Keep your answers short and calm: state the purpose of your trip, where you are staying, and how many days you will visit.',
        reflectionQuestion: 'Como você responderia "What is the purpose of your trip?" em inglês?',
        mentorTip:
          'Dica do Professor: na imigração, menos é mais! Responda exatamente o que foi perguntado ("I am here on vacation for ten days") com calma.',
      },
      {
        number: 3,
        title: 'Chegando no hotel',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes: 8,
      },
      {
        number: 4,
        title: 'Pedindo no restaurante',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes: 8,
      },
    ],
    chatScenarios: [
      {
        id: 'sc-v1',
        title: 'Oficial de imigração',
        subtitle: 'Explicar motivo da viagem e hospedagem',
      },
      {
        id: 'sc-v2',
        title: 'Recepção do hotel',
        subtitle: 'Confirmar reserva e horário do café',
      },
      {
        id: 'sc-v3',
        title: 'Restaurante em Nova York',
        subtitle: 'Pedir prato, bebida e a conta',
      },
    ],
    keywords: [
      'boarding pass',
      'customs',
      'reservation',
      'luggage',
      'gate',
      'check-in',
      'receipt',
      'tip',
    ],
    totalKeywordsPool: 24,
    createdAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'dia-a-dia-trabalho',
    title: 'Dia a dia no trabalho',
    summary: 'Participe de dailies, troque mensagens com o time e alinhe tarefas.',
    prompt: 'Quero praticar inglês contínuo para o dia a dia no trabalho e reuniões rápidas.',
    expertPersona: 'Engineering Manager em Equipes Globais',
    icon: 'coffee',
    status: 'paused',
    trackType: 'continuous',
    currentLessonNumber: 9,
    completedLessonsCount: 9,
    completedLessonsSummary: 'Dailies, mensagens assíncronas e alinhamentos',
    totalLessons: null,
    level: 'intermediate',
    tone: 'Casual',
    durationMinutes: 8,
    chatMode: 'optional',
    lessons: [
      {
        number: 9,
        title: 'Alinhando prioridades da semana',
        subtitle: 'Hoje · 8 min · ler, ouvir, quiz',
        status: 'today',
        durationMinutes: 8,
        readingText:
          'Every Monday morning, our team shares a quick update on priorities. Mentioning any blocker early helps everyone adjust the scope before the end of the sprint.',
        reflectionQuestion: 'Qual é a sua prioridade número um nesta semana?',
        mentorTip:
          'Dica do Professor: em dailies internacionais, use "I am currently focused on..." em vez de traduzir "Eu estou mexendo com...".',
      },
      {
        number: 10,
        title: 'Pedindo ajuda com um bloqueio',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes: 8,
      },
      {
        number: 11,
        title: 'Dando feedback construtivo',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes: 8,
      },
    ],
    chatScenarios: [
      {
        id: 'sc-d1',
        title: 'Daily standup',
        subtitle: 'Contar o que fez ontem e o foco de hoje',
      },
      {
        id: 'sc-d2',
        title: 'Alinhamento no chat',
        subtitle: 'Tirar dúvida sobre prazo e escopo',
      },
    ],
    keywords: ['blocker', 'follow-up', 'sync', 'milestone', 'update', 'scope', 'priority', 'handoff'],
    totalKeywordsPool: 30,
    createdAt: '2026-10-10T10:00:00.000Z',
  },
  {
    id: 'ingles-reunioes',
    title: 'Inglês para reuniões',
    summary: 'Conduza chamadas, peça a palavra e defina próximos passos com clareza.',
    prompt: 'Preciso conduzir reuniões em inglês com parceiros internacionais.',
    expertPersona: 'Consultor Sênior de Comunicação Executiva Internacional',
    icon: 'briefcase',
    status: 'archived',
    trackType: 'goal',
    targetDateLabel: 'Concluído',
    currentLessonNumber: 12,
    completedLessonsCount: 12,
    completedLessonsSummary: 'Abertura, pauta, perguntas e encerramento',
    totalLessons: 12,
    level: 'intermediate',
    tone: 'Formal',
    durationMinutes: 8,
    chatMode: 'optional',
    lessons: [
      {
        number: 12,
        title: 'Definindo próximos passos',
        subtitle: 'Hoje · 8 min · ler, ouvir, quiz',
        status: 'today',
        durationMinutes: 8,
      },
    ],
    chatScenarios: [
      {
        id: 'sc-r1',
        title: 'Líder de projeto',
        subtitle: 'Alinhar cronograma e entregas da semana',
      },
    ],
    keywords: ['agenda', 'action items', 'wrap up', 'takeaway', 'minutes', 'align'],
    totalKeywordsPool: 24,
    createdAt: '2026-09-15T10:00:00.000Z',
  },
]

function loadInitialSubjects(): StudySubject[] {
  const saved = readStorage<StudySubject[]>(SUBJECTS_STORAGE_KEY, [])
  if (Array.isArray(saved) && saved.length > 0) {
    return saved
  }
  writeStorage(SUBJECTS_STORAGE_KEY, INITIAL_SUBJECTS)
  return INITIAL_SUBJECTS
}

export function buildDraftFromPrompt(
  prompt: string,
  options?: {
    level?: Difficulty
    durationMinutes?: number
    trackType?: SubjectTrackType
    tone?: SubjectTone
  },
): Omit<StudySubject, 'id' | 'createdAt' | 'status'> {
  const normalized = prompt.toLowerCase()
  const level = options?.level ?? 'intermediate'
  const durationMinutes = options?.durationMinutes ?? 8
  const trackType = options?.trackType ?? 'goal'
  const totalLessons = trackType === 'goal' ? 14 : null

  const isTravel =
    normalized.includes('viagem') ||
    normalized.includes('viajar') ||
    normalized.includes('aeroporto') ||
    normalized.includes('hotel') ||
    normalized.includes('eua')
  const isMeeting =
    normalized.includes('reuni') ||
    normalized.includes('call') ||
    normalized.includes('apresenta') ||
    normalized.includes('cliente')
  const isSupport =
    normalized.includes('atendimento') || normalized.includes('suporte')
  const isDaily =
    normalized.includes('dia a dia') || normalized.includes('rotina') || normalized.includes('convers')

  if (isTravel) {
    return {
      title: 'Viagem internacional',
      summary: 'Treine imigração, conexões no aeroporto, check-in no hotel e pedidos em restaurantes.',
      prompt,
      expertPersona: 'Mentor Especialista em Inglês para Viagens & Imigração (20+ anos)',
      icon: 'plane',
      trackType,
      targetDateLabel: trackType === 'goal' ? '15 fev' : undefined,
      currentLessonNumber: 1,
      completedLessonsCount: 0,
      completedLessonsSummary: 'Início da trilha',
      totalLessons: trackType === 'goal' ? 10 : null,
      level,
      tone: options?.tone ?? 'Casual',
      durationMinutes,
      chatMode: 'optional',
      lessons: [
        {
          number: 1,
          title: 'Passando pela imigração sem mico',
          subtitle: `Hoje · ${durationMinutes} min · ler, ouvir, quiz`,
          status: 'today',
          durationMinutes,
          readingText:
            'When you arrive at the airport, follow the signs to passport control. Have your boarding pass and hotel address ready so you can answer the officer with confidence.',
          reflectionQuestion: 'Quais documentos você deve ter em mãos na fila da imigração?',
          mentorTip:
            'Dica do Professor: nunca faça piadas na fila da imigração e responda de forma direta: "I am here on vacation".',
        },
        {
          number: 2,
          title: 'Check-in e pedidos no hotel',
          subtitle: 'Pronta',
          status: 'ready',
          durationMinutes,
        },
        {
          number: 3,
          title: 'Pedindo em restaurantes e cafés',
          subtitle: 'Pronta',
          status: 'ready',
          durationMinutes,
        },
      ],
      chatScenarios: [
        { id: 'c1', title: 'Agente de imigração', subtitle: 'Responder sobre estadia e passagem de volta' },
        { id: 'c2', title: 'Recepção do hotel', subtitle: 'Fazer check-in e tirar dúvidas do quarto' },
        { id: 'c3', title: 'Garçom no restaurante', subtitle: 'Pedir sugestões do cardápio e fechar a conta' },
      ],
      keywords: ['boarding pass', 'customs', 'luggage', 'reservation', 'check-in', 'gate', 'receipt', 'tip'],
      totalKeywordsPool: 30,
    }
  }

  if (isMeeting || isSupport) {
    return {
      title: isSupport ? 'Atendimento ao cliente' : 'Reuniões e alinhamentos',
      summary: 'Ganhe segurança para explicar pontos, responder perguntas difíceis e alinhar prazos.',
      prompt,
      expertPersona: isSupport
        ? 'Especialista Sênior em Customer Success & Suporte Global'
        : 'Consultor Sênior de Comunicação Executiva Internacional',
      icon: 'message',
      trackType,
      targetDateLabel: trackType === 'goal' ? '20 jan' : undefined,
      currentLessonNumber: 1,
      completedLessonsCount: 0,
      completedLessonsSummary: 'Início da trilha',
      totalLessons,
      level,
      tone: options?.tone ?? 'Formal',
      durationMinutes,
      chatMode: 'optional',
      lessons: [
        {
          number: 1,
          title: 'Abrindo a conversa e alinhando a pauta',
          subtitle: `Hoje · ${durationMinutes} min · ler, ouvir, quiz`,
          status: 'today',
          durationMinutes,
          readingText:
            'Starting a call with a clear agenda sets expectations for everyone. Summarize the main goal in one sentence and ask if anyone wants to add a topic before diving in.',
          reflectionQuestion: 'Como você costuma abrir uma reunião ou atendimento importante?',
          mentorTip:
            'Dica do Professor: use "Let\'s go over today\'s agenda" para assumir a condução da chamada com naturalidade.',
        },
        {
          number: 2,
          title: 'Pedindo esclarecimentos com naturalidade',
          subtitle: 'Pronta',
          status: 'ready',
          durationMinutes,
        },
        {
          number: 3,
          title: 'Definindo próximos passos e prazos',
          subtitle: 'Pronta',
          status: 'ready',
          durationMinutes,
        },
      ],
      chatScenarios: [
        { id: 'c1', title: 'Cliente internacional', subtitle: 'Entender a necessidade e propor solução' },
        { id: 'c2', title: 'Líder de projeto', subtitle: 'Alinhar entregas e próximos passos' },
        { id: 'c3', title: 'Dúvida ao vivo', subtitle: 'Pedir para repetir ou confirmar entendimento' },
      ],
      keywords: ['agenda', 'follow-up', 'deadline', 'stakeholder', 'clarify', 'action items', 'summary', 'priority'],
      totalKeywordsPool: 30,
    }
  }

  if (isDaily) {
    return {
      title: 'Conversas do dia a dia',
      summary: 'Pratique situações reais de rotina, trabalho e socialização com vocabulário natural.',
      prompt,
      expertPersona: 'Professor Especialista em Fluência & Conversação Natural',
      icon: 'coffee',
      trackType,
      targetDateLabel: trackType === 'goal' ? '18 jan' : undefined,
      currentLessonNumber: 1,
      completedLessonsCount: 0,
      completedLessonsSummary: 'Início da trilha',
      totalLessons,
      level,
      tone: options?.tone ?? 'Casual',
      durationMinutes,
      chatMode: 'optional',
      lessons: [
        {
          number: 1,
          title: 'Quebrando o gelo no início do dia',
          subtitle: `Hoje · ${durationMinutes} min · ler, ouvir, quiz`,
          status: 'today',
          durationMinutes,
          readingText:
            'Small talk before a meeting or at a coffee shop is the easiest way to build rapport. Asking "How is your week going so far?" sounds much more natural than a robotic greeting.',
          reflectionQuestion: 'Qual pergunta leve você gosta de usar para iniciar uma conversa?',
          mentorTip:
            'Dica do Professor: troque o automático "How are you? I am fine" por "How is your week going?" para destravar conversas reais.',
        },
        {
          number: 2,
          title: 'Contando novidades da semana',
          subtitle: 'Pronta',
          status: 'ready',
          durationMinutes,
        },
        {
          number: 3,
          title: 'Fazendo planos e convites',
          subtitle: 'Pronta',
          status: 'ready',
          durationMinutes,
        },
      ],
      chatScenarios: [
        { id: 'c1', title: 'Pausa para o café', subtitle: 'Conversa leve sobre a semana' },
        { id: 'c2', title: 'Novo colega', subtitle: 'Apresentar-se e trocar ideias' },
        { id: 'c3', title: 'Combinando um encontro', subtitle: 'Sugerir horário e local' },
      ],
      keywords: ['catch up', 'schedule', 'routine', 'actually', 'by the way', 'looking forward', 'weekend', 'habit'],
      totalKeywordsPool: 30,
    }
  }

  return {
    title: 'Entrevista de tecnologia',
    summary: 'Prepare-se para falar de projetos, decisões técnicas e trabalho em equipe.',
    prompt,
    expertPersona: 'Staff Backend Engineer & Tech Interview Coach nos EUA',
    icon: 'briefcase' as SubjectIconName,
    trackType,
    targetDateLabel: trackType === 'goal' ? '10 jan' : undefined,
    currentLessonNumber: 1,
    completedLessonsCount: 0,
    completedLessonsSummary: 'Início da trilha',
    totalLessons: trackType === 'goal' ? 14 : null,
    level,
    tone: options?.tone ?? 'Formal',
    durationMinutes,
    chatMode: 'optional',
    lessons: [
      {
        number: 1,
        title: 'Falando do seu último projeto',
        subtitle: `Hoje · ${durationMinutes} min · ler, ouvir, quiz`,
        status: 'today',
        durationMinutes,
        readingText:
          'In my last project, I led the backend migration to a scalable service architecture. We had a tight deadline, so I discussed the main trade-offs with every stakeholder before the deploy. Clear feedback during each pull request helped our team take ownership and deliver on time.',
        reflectionQuestion:
          'Como você explicaria em uma frase a decisão técnica mais importante do seu último projeto?',
        mentorTip:
          'Dica do Professor: em entrevistas de tecnologia nos EUA, destaque claramente o que VOCÊ decidiu ("I designed", "I resolved") e o resultado mensurável.',
      },
      {
        number: 2,
        title: 'Trabalho em equipe',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes,
      },
      {
        number: 3,
        title: 'Explicando decisões técnicas',
        subtitle: 'Pronta',
        status: 'ready',
        durationMinutes,
      },
    ],
    chatScenarios: [
      {
        id: 'sc-new-1',
        title: 'Recrutador técnico',
        subtitle: 'Apresentar-se e falar da carreira',
      },
      {
        id: 'sc-new-2',
        title: 'Gerente de engenharia',
        subtitle: 'Explicar o último projeto',
      },
      {
        id: 'sc-new-3',
        title: 'Entrevista comportamental',
        subtitle: 'Responder sobre trabalho em equipe',
      },
    ],
    keywords: [
      'deploy',
      'scalable',
      'trade-off',
      'stakeholder',
      'pull request',
      'deadline',
      'feedback',
      'ownership',
    ],
    totalKeywordsPool: 30,
  }
}

type SubjectsState = {
  subjects: StudySubject[]
  currentUserId: string | null
  isSyncing: boolean
  storageMode: 'firebase' | 'local'
  lastSavedAt: string | null
  isSelectorOpen: boolean
  openSelector: () => void
  closeSelector: () => void
  syncWithDatabase: (userId?: string | null) => Promise<void>
  getActiveSubject: () => StudySubject
  activateSubject: (id: string) => void
  pauseSubject: (id: string) => void
  archiveSubject: (id: string) => void
  deleteSubject: (id: string) => void
  updateSubjectConfig: (
    id: string,
    patch: Partial<
      Pick<
        StudySubject,
        'title' | 'summary' | 'level' | 'durationMinutes' | 'chatMode' | 'tone' | 'trackType'
      >
    >,
  ) => void
  setSubjectLessons: (id: string, lessons: SubjectLesson[]) => void
  regenerateSubjectLessons: (id: string) => void
  advanceSubjectProgress: (id: string) => void
  createSubject: (draft: Omit<StudySubject, 'id' | 'createdAt' | 'status'>) => StudySubject
}

export const useSubjectsStore = create<SubjectsState>((set, get) => {
  const persistSubjects = (next: StudySubject[]) => {
    const userId = get().currentUserId
    set({ isSyncing: true })
    void subjectsService
      .saveUserSubjects(next, userId)
      .then((mode) => {
        set({
          isSyncing: false,
          storageMode: mode,
          lastSavedAt: new Date().toISOString(),
        })
      })
      .catch(() => {
        set({ isSyncing: false })
      })
  }

  return {
    subjects: loadInitialSubjects(),
    currentUserId: null,
    isSyncing: false,
    storageMode: 'local',
    lastSavedAt: null,
    isSelectorOpen: false,

    openSelector: () => set({ isSelectorOpen: true }),
    closeSelector: () => set({ isSelectorOpen: false }),

    syncWithDatabase: async (userId) => {
      set({ currentUserId: userId ?? null, isSyncing: true })
      const result = await subjectsService.loadUserSubjects(INITIAL_SUBJECTS, userId)
      set({
        subjects: result.subjects,
        storageMode: result.source,
        isSyncing: false,
        lastSavedAt: new Date().toISOString(),
      })
    },

    getActiveSubject: () => {
      const { subjects } = get()
      return (
        subjects.find((item) => item.status === 'active') ??
        subjects.find((item) => item.status === 'paused') ??
        subjects[0] ??
        INITIAL_SUBJECTS[0]
      )
    },

    activateSubject: (id) => {
      const next = get().subjects.map((subject) => {
        if (subject.id === id) {
          return { ...subject, status: 'active' as const }
        }
        if (subject.status === 'active') {
          return { ...subject, status: 'paused' as const }
        }
        return subject
      })
      set({ subjects: next, isSelectorOpen: false })
      persistSubjects(next)
    },

    pauseSubject: (id) => {
      const next = get().subjects.map((subject) =>
        subject.id === id ? { ...subject, status: 'paused' as const } : subject,
      )
      if (!next.some((s) => s.status === 'active')) {
        const candidate = next.find((s) => s.id !== id && s.status === 'paused')
        if (candidate) {
          candidate.status = 'active'
        }
      }
      set({ subjects: next })
      persistSubjects(next)
    },

    archiveSubject: (id) => {
      const next = get().subjects.map((subject) =>
        subject.id === id ? { ...subject, status: 'archived' as const } : subject,
      )
      if (!next.some((s) => s.status === 'active')) {
        const candidate = next.find((s) => s.status === 'paused')
        if (candidate) {
          candidate.status = 'active'
        }
      }
      set({ subjects: next })
      persistSubjects(next)
    },

    deleteSubject: (id) => {
      const remaining = get().subjects.filter((subject) => subject.id !== id)
      const next = remaining.length > 0 ? remaining : [INITIAL_SUBJECTS[0]]
      if (!next.some((s) => s.status === 'active')) {
        const candidate = next.find((s) => s.status === 'paused') ?? next[0]
        if (candidate) {
          candidate.status = 'active'
        }
      }
      set({ subjects: next })
      persistSubjects(next)
    },

    updateSubjectConfig: (id, patch) => {
      const next = get().subjects.map((subject) => {
        if (subject.id !== id) return subject
        const updatedDuration = patch.durationMinutes ?? subject.durationMinutes
        const updatedLessons = subject.lessons.map((lesson) =>
          lesson.status === 'today'
            ? {
                ...lesson,
                durationMinutes: updatedDuration,
                subtitle: `Hoje · ${updatedDuration} min · ler, ouvir, quiz`,
              }
            : { ...lesson, durationMinutes: updatedDuration },
        )
        return {
          ...subject,
          ...patch,
          lessons: updatedLessons,
        }
      })
      set({ subjects: next })
      persistSubjects(next)
    },

    setSubjectLessons: (id, lessons) => {
      const next = get().subjects.map((subject) =>
        subject.id === id ? { ...subject, lessons } : subject,
      )
      set({ subjects: next })
      persistSubjects(next)
    },

    regenerateSubjectLessons: (id) => {
      const next = get().subjects.map((subject) => {
        if (subject.id !== id) return subject
        const currentNo = subject.currentLessonNumber
        const regenerated = subject.lessons.map((lesson) => {
          if (lesson.number === currentNo + 1) {
            return {
              ...lesson,
              title: `${subject.title}: Prática guiada em contexto`,
              status: 'ready' as const,
              subtitle: 'Pronta',
            }
          }
          if (lesson.number === currentNo + 2) {
            return {
              ...lesson,
              title: `${subject.title}: Simulação de vocabulário e fluidez`,
              status: 'ready' as const,
              subtitle: 'Pronta',
            }
          }
          return lesson
        })
        return { ...subject, lessons: regenerated }
      })
      set({ subjects: next })
      persistSubjects(next)
    },

    advanceSubjectProgress: (id) => {
      const next = get().subjects.map((subject) => {
        if (subject.id !== id) return subject
        const nextCompleted = subject.totalLessons
          ? Math.min(subject.totalLessons, subject.completedLessonsCount + 1)
          : subject.completedLessonsCount + 1
        const nextLessonNum = subject.totalLessons
          ? Math.min(subject.totalLessons, subject.currentLessonNumber + 1)
          : subject.currentLessonNumber + 1

        // Atualiza os status das lições da trilha quando o aluno conclui a lição de hoje
        const nextLessons = subject.lessons.map((lesson) => {
          if (lesson.number < nextLessonNum) {
            return { ...lesson, status: 'completed' as const, subtitle: 'Concluída' }
          }
          if (lesson.number === nextLessonNum) {
            return {
              ...lesson,
              status: 'today' as const,
              subtitle: `Hoje · ${subject.durationMinutes} min · ler, ouvir, quiz`,
            }
          }
          return lesson
        })

        return {
          ...subject,
          completedLessonsCount: nextCompleted,
          currentLessonNumber: nextLessonNum,
          lessons: nextLessons,
        }
      })
      set({ subjects: next })
      persistSubjects(next)
    },

    createSubject: (draft) => {
      const newSubject: StudySubject = {
        ...draft,
        id: `subject-${Date.now()}`,
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      const demoted = get().subjects.map((item) =>
        item.status === 'active' ? { ...item, status: 'paused' as const } : item,
      )
      const next = [newSubject, ...demoted]
      set({ subjects: next, isSelectorOpen: false })
      persistSubjects(next)

      return newSubject
    },
  }
})

export const chatModeLabels: Record<SubjectChatMode, string> = {
  optional: 'Opcional',
  always: 'Sempre na missão',
  off: 'Desativado',
}

export const chatModePillLabels: Record<SubjectChatMode, string> = {
  optional: 'Chat opcional',
  always: 'Chat ativo',
  off: 'Sem chat',
}
