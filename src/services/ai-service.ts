import type {
  Challenge,
  Difficulty,
  StudyPreferences,
  StudySubject,
  SubjectIconName,
  SubjectLesson,
  SubjectScenario,
  SubjectTone,
  SubjectTrackType,
  WordInsight,
} from '@/types/domain'
import { buildDraftFromPrompt } from '@/stores/subjects-store'

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
] as const

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

export type SubjectBlueprintParams = {
  prompt: string
  level: Difficulty
  durationMinutes: number
  trackType: SubjectTrackType
  tone: SubjectTone
}

type RawBlueprintResponse = {
  title: string
  summary: string
  expertPersona: string
  icon: SubjectIconName
  lessons: Array<{
    number: number
    title: string
    readingText: string
    reflectionQuestion: string
    mentorTip: string
  }>
  chatScenarios: Array<{
    title: string
    subtitle: string
  }>
  keywords: string[]
  totalKeywordsPool?: number
}

/**
 * Monta a System Instruction que afunila a IA gratuita do Google (Gemini)
 * para agir como um professor e mentor ultraexperiente na área exata do aluno.
 */
export function buildExpertSystemInstruction(contextPrompt?: string, expertPersona?: string, tone?: string): string {
  return [
    'Você é o Mico Expert, um professor de inglês de elite e mentor sênior com mais de 20 anos de experiência prática internacional exatamente na área descrita pelo aluno.',
    contextPrompt ? `Contexto específico do aluno: "${contextPrompt}".` : '',
    expertPersona ? `Sua persona especialista: ${expertPersona}.` : '',
    tone ? `Tom de comunicação exigido no contexto: ${tone}.` : '',
    'Sua missão pedagógica:',
    '1. Afunilar 100% do conteúdo para o nicho real do aluno (nunca use frases genéricas de cursinho; use jargões reais, situações autênticas e vocabulário que nativos da área realmente usam).',
    '2. Ensinar brasileiros a falarem com naturalidade, apontando armadilhas comuns ("micos", falsos cognatos, traduções literais ou vícios de pronúncia) que brasileiros cometem nesse cenário específico.',
    '3. Ser didático, encorajador ("errar aqui é parte do jogo") e direto ao ponto, como um mentor sênior preparando alguém para brilhar na vida real.',
  ]
    .filter(Boolean)
    .join(' ')
}

export const aiService = {
  async generateChallenge(
    preferences: StudyPreferences,
    activeSubject?: StudySubject | null,
  ): Promise<{
    title: string
    text: string
    reflectionQuestion: string
    mentorTip?: string
    mode: 'gemini' | 'fallback'
  }> {
    const todayLesson = activeSubject?.lessons.find((l) => l.status === 'today')
    const systemInstruction = buildExpertSystemInstruction(
      activeSubject?.prompt ?? `Interesse em ${preferences.category}`,
      activeSubject?.expertPersona,
      activeSubject?.tone,
    )

    const prompt = [
      'Crie uma lição prática de leitura em inglês para um estudante brasileiro.',
      activeSubject
        ? `Assunto ativo: "${activeSubject.title}". Contexto detalhado do aluno: "${activeSubject.prompt}".`
        : `Categoria solicitada: ${preferences.category}.`,
      todayLesson ? `Foco específico da lição de hoje (Lição ${todayLesson.number}): "${todayLesson.title}".` : '',
      activeSubject?.keywords?.length
        ? `Incorpore naturalmente algumas destas palavras-chave da área no texto: ${activeSubject.keywords.slice(0, 5).join(', ')}.`
        : '',
      `Nível de inglês do aluno: ${activeSubject?.level ?? preferences.level}.`,
      `O corpo do texto em inglês (text) deve ter no máximo ${preferences.maxCharacters} caracteres (incluindo espaços).`,
      'Escreva apenas inglês autêntico e natural da área para o "title" e o "text".',
      'Adapte a complexidade gramatical ao nível pedido, mas mantenha o vocabulário profissional/autêntico do nicho.',
      'A "reflectionQuestion" deve ser em português, fazendo o aluno pensar em como aplicaria aquilo na situação real dele.',
      'A "mentorTip" deve ser uma dica curta em português (1 a 2 frases) de professor veterano da área sobre como soar natural e não pagar mico nesse tópico.',
      'Retorne APENAS JSON válido com as chaves: title, text, reflectionQuestion, mentorTip.',
    ]
      .filter(Boolean)
      .join(' ')

    const result = await callGemini(prompt, systemInstruction)

    if (!result) {
      return buildFallbackChallenge(preferences, activeSubject)
    }

    try {
      const parsed = extractJson<{
        title: string
        text: string
        reflectionQuestion: string
        mentorTip?: string
      }>(result)
      const sanitizedText = normalizeChallengeText(parsed.text, preferences.maxCharacters)
      return {
        title: parsed.title.trim(),
        text: sanitizedText,
        reflectionQuestion: parsed.reflectionQuestion.trim(),
        mentorTip: parsed.mentorTip?.trim(),
        mode: 'gemini' as const,
      }
    } catch {
      return buildFallbackChallenge(preferences, activeSubject)
    }
  },

  async explainSelection(
    challenge: Challenge,
    selection: string,
    level: Difficulty,
    activeSubject?: StudySubject | null,
  ): Promise<WordInsight> {
    const systemInstruction = buildExpertSystemInstruction(
      activeSubject?.prompt ?? challenge.category,
      activeSubject?.expertPersona,
      activeSubject?.tone,
    )

    const prompt = [
      `Explique o termo ou expressão "${selection}" retirado deste texto da área: "${challenge.text}".`,
      activeSubject
        ? `O aluno está treinando para: "${activeSubject.prompt}" (Assunto: ${activeSubject.title}).`
        : '',
      `Nível do aluno: ${level}.`,
      'Aja como um professor mega experiente nessa área específica:',
      '- Em "translation", dê a tradução exata usada pelos profissionais/nativos nesse contexto.',
      '- Em "meaning", explique em português como esse termo funciona na prática da área e qual "mico" (erro comum de brasileiros) evitar.',
      '- Em "example", crie uma frase em inglês ultra-realista do contexto do aluno usando o termo.',
      '- Em "pronunciation", escreva uma dica fonética amigável para brasileiros (ex: como soa a sílaba tônica).',
      'Retorne APENAS JSON válido com as chaves: term, translation, meaning, example, synonyms (array de strings), pronunciation, context.',
    ]
      .filter(Boolean)
      .join(' ')

    const result = await callGemini(prompt, systemInstruction)

    if (!result) {
      return buildFallbackInsight(selection, challenge.text, activeSubject)
    }

    try {
      return extractJson<WordInsight>(result)
    } catch {
      return buildFallbackInsight(selection, challenge.text, activeSubject)
    }
  },

  /**
   * Usa a IA gratuita do Google (Gemini) para criar toda a estrutura do assunto
   * (título, persona do professor especialista, trilha de lições, cenários de chat e palavras-chave)
   * afunilando 100% no contexto descrito pelo aluno.
   */
  async generateSubjectBlueprint(
    params: SubjectBlueprintParams,
  ): Promise<{
    draft: Omit<StudySubject, 'id' | 'createdAt' | 'status'>
    mode: 'gemini' | 'fallback'
  }> {
    const fallbackDraft = buildDraftFromPrompt(params.prompt, {
      level: params.level,
      durationMinutes: params.durationMinutes,
      trackType: params.trackType,
      tone: params.tone,
    })

    const systemInstruction = buildExpertSystemInstruction(params.prompt, undefined, params.tone)
    const totalLessons = params.trackType === 'goal' ? 14 : null

    const prompt = [
      `O aluno descreveu o seguinte objetivo de estudo em inglês: "${params.prompt}".`,
      `Nível escolhido: ${params.level}. Duração diária: ${params.durationMinutes} minutos. Tom: ${params.tone}.`,
      `Tipo de trilha: ${params.trackType === 'goal' ? 'Trilha com meta de 14 lições' : 'Trilha contínua'}.`,
      'Como um professor mega experiente e mentor sênior exatamente nessa área, monte o plano completo e afunilado para esse aluno.',
      'Retorne APENAS JSON válido com o seguinte formato:',
      '{',
      '  "title": "Título curto e específico do assunto em português (máx 35 caracteres)",',
      '  "summary": "Resumo motivador em português (1 frase) explicando o foco prático da trilha",',
      '  "expertPersona": "Cargo/perfil do professor especialista desta trilha em português (ex: Senior Staff Engineer & Tech Recruiter nos EUA)",',
      '  "icon": "briefcase" | "plane" | "coffee" | "message" | "sparkles",',
      '  "lessons": [',
      '    // Gere as 4 primeiras lições progressivas e ultra-específicas da área (numbers 1, 2, 3, 4):',
      '    {',
      '      "number": 1,',
      '      "title": "Título específico da lição em português",',
      '      "readingText": "Texto prático e autêntico em inglês (250 a 420 caracteres) simulando uma situação real desse nicho",',
      '      "reflectionQuestion": "Pergunta prática em português que faz o aluno formular uma resposta pessoal na área",',
      '      "mentorTip": "Dica de ouro em português do professor especialista sobre como não pagar mico nessa situação"',
      '    }',
      '  ],',
      '  "chatScenarios": [',
      '    // 3 cenários de roleplay com interlocutores reais dessa área:',
      '    { "title": "Papel do interlocutor em português", "subtitle": "O que o aluno vai praticar nessa conversa" }',
      '  ],',
      '  "keywords": ["8 termos ou expressões em inglês indispensáveis nesse nicho específico"],',
      '  "totalKeywordsPool": 30',
      '}',
    ].join('\n')

    const result = await callGemini(prompt, systemInstruction)

    if (!result) {
      return { draft: fallbackDraft, mode: 'fallback' }
    }

    try {
      const parsed = extractJson<RawBlueprintResponse>(result)
      const validIcons: SubjectIconName[] = ['briefcase', 'plane', 'coffee', 'message', 'sparkles']
      const icon: SubjectIconName = validIcons.includes(parsed.icon)
        ? parsed.icon
        : fallbackDraft.icon

      const lessons: SubjectLesson[] =
        Array.isArray(parsed.lessons) && parsed.lessons.length > 0
          ? parsed.lessons.map((lesson, idx) => ({
              number: idx + 1,
              title: lesson.title?.trim() || `Lição ${idx + 1}`,
              subtitle:
                idx === 0
                  ? `Hoje · ${params.durationMinutes} min · ler, ouvir, quiz`
                  : 'Pronta',
              status: idx === 0 ? ('today' as const) : ('ready' as const),
              durationMinutes: params.durationMinutes,
              readingText: lesson.readingText?.trim(),
              reflectionQuestion: lesson.reflectionQuestion?.trim(),
              mentorTip: lesson.mentorTip?.trim(),
            }))
          : fallbackDraft.lessons

      const chatScenarios: SubjectScenario[] =
        Array.isArray(parsed.chatScenarios) && parsed.chatScenarios.length > 0
          ? parsed.chatScenarios.slice(0, 4).map((sc, idx) => ({
              id: `ai-sc-${idx + 1}`,
              title: sc.title?.trim() || `Cenário ${idx + 1}`,
              subtitle: sc.subtitle?.trim() || 'Prática guiada em contexto',
            }))
          : fallbackDraft.chatScenarios

      const keywords =
        Array.isArray(parsed.keywords) && parsed.keywords.length > 0
          ? parsed.keywords.slice(0, 10).map((k) => k.trim())
          : fallbackDraft.keywords

      return {
        draft: {
          ...fallbackDraft,
          title: parsed.title?.trim() || fallbackDraft.title,
          summary: parsed.summary?.trim() || fallbackDraft.summary,
          expertPersona: parsed.expertPersona?.trim() || fallbackDraft.expertPersona,
          icon,
          totalLessons,
          lessons,
          chatScenarios,
          keywords,
          totalKeywordsPool: parsed.totalKeywordsPool ?? 30,
        },
        mode: 'gemini',
      }
    } catch {
      return { draft: fallbackDraft, mode: 'fallback' }
    }
  },

  /**
   * Regenera as próximas lições da trilha de um assunto usando a IA do Google
   * com base no progresso atual e nas configurações do assunto.
   */
  async regenerateSubjectSyllabus(subject: StudySubject): Promise<{
    lessons: SubjectLesson[]
    mode: 'gemini' | 'fallback'
  }> {
    const systemInstruction = buildExpertSystemInstruction(
      subject.prompt,
      subject.expertPersona,
      subject.tone,
    )

    const currentNo = subject.currentLessonNumber
    const prompt = [
      `O aluno está estudando o assunto "${subject.title}" (Contexto: "${subject.prompt}").`,
      `Nível atual: ${subject.level}. Duração: ${subject.durationMinutes} min. Tom: ${subject.tone}.`,
      `Ele está na lição ${currentNo}. Gere a lição ${currentNo} (hoje) e as próximas 2 lições (${currentNo + 1} e ${currentNo + 2}) com foco ultra-específico na área.`,
      'Retorne APENAS JSON válido no formato:',
      '{',
      '  "lessons": [',
      '    {',
      `      "number": ${currentNo},`,
      '      "title": "Título específico da lição em português",',
      '      "readingText": "Texto autêntico em inglês (250 a 420 caracteres) da área",',
      '      "reflectionQuestion": "Pergunta de reflexão prática em português",',
      '      "mentorTip": "Dica do professor especialista em português"',
      '    }',
      '  ]',
      '}',
    ].join('\n')

    const result = await callGemini(prompt, systemInstruction)

    if (result) {
      try {
        const parsed = extractJson<{
          lessons: Array<{
            number: number
            title: string
            readingText: string
            reflectionQuestion: string
            mentorTip?: string
          }>
        }>(result)

        if (Array.isArray(parsed.lessons) && parsed.lessons.length > 0) {
          const completed = subject.lessons.filter((l) => l.status === 'completed')
          const generatedUpcoming: SubjectLesson[] = parsed.lessons.map((item, idx) => ({
            number: currentNo + idx,
            title: item.title.trim(),
            subtitle:
              idx === 0
                ? `Hoje · ${subject.durationMinutes} min · ler, ouvir, quiz`
                : 'Pronta',
            status: idx === 0 ? ('today' as const) : ('ready' as const),
            durationMinutes: subject.durationMinutes,
            readingText: item.readingText?.trim(),
            reflectionQuestion: item.reflectionQuestion?.trim(),
            mentorTip: item.mentorTip?.trim(),
          }))

          return {
            lessons: [...completed, ...generatedUpcoming],
            mode: 'gemini',
          }
        }
      } catch {
        // Fallback below
      }
    }

    // Fallback: atualiza as lições mantendo o contexto do assunto
    const updatedLessons = subject.lessons.map((lesson) => {
      if (lesson.number === currentNo) {
        return {
          ...lesson,
          subtitle: `Hoje · ${subject.durationMinutes} min · ler, ouvir, quiz`,
          status: 'today' as const,
        }
      }
      if (lesson.number === currentNo + 1) {
        return {
          ...lesson,
          title: `${subject.title}: Simulação prática de situações reais`,
          status: 'ready' as const,
          subtitle: 'Pronta',
        }
      }
      if (lesson.number === currentNo + 2) {
        return {
          ...lesson,
          title: `${subject.title}: Dominando perguntas difíceis sem mico`,
          status: 'ready' as const,
          subtitle: 'Pronta',
        }
      }
      return lesson
    })

    return { lessons: updatedLessons, mode: 'fallback' }
  },
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string | null> {
  const apiKey = globalThis.__SEM_MICO_ENV__?.VITE_GEMINI_API_KEY
  if (!apiKey) return null

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(systemInstruction
            ? {
                systemInstruction: {
                  parts: [{ text: systemInstruction }],
                },
              }
            : {}),
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.75,
          },
          contents: [{ parts: [{ text: prompt }] }],
        }),
      })

      if (!response.ok) continue
      const data = (await response.json()) as GeminiResponse
      const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? null
      if (text) return text
    } catch {
      continue
    }
  }

  return null
}

function extractJson<T>(payload: string): T {
  const normalized = payload.trim().replace(/^```json\s*/, '').replace(/```$/, '')
  const start = normalized.indexOf('{')
  const end = normalized.lastIndexOf('}')
  const candidate = start >= 0 && end >= 0 ? normalized.slice(start, end + 1) : normalized
  return JSON.parse(candidate) as T
}

export function normalizeChallengeText(text: string, maxCharacters: number) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxCharacters) return normalized

  const sliced = normalized.slice(0, maxCharacters)
  const lastSpace = sliced.lastIndexOf(' ')
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim()
}

export function buildFallbackChallenge(
  preferences: StudyPreferences,
  activeSubject?: StudySubject | null,
) {
  if (activeSubject) {
    const todayLesson =
      activeSubject.lessons.find((l) => l.status === 'today') ?? activeSubject.lessons[0]
    if (todayLesson?.readingText) {
      return {
        title: todayLesson.title,
        text: normalizeChallengeText(todayLesson.readingText, preferences.maxCharacters),
        reflectionQuestion:
          todayLesson.reflectionQuestion ??
          `Como você aplicaria o vocabulário de "${activeSubject.title}" hoje?`,
        mentorTip:
          todayLesson.mentorTip ??
          `Dica do professor (${activeSubject.expertPersona ?? 'Especialista na área'}): foque em frases curtas e diretas usando as palavras-chave da trilha.`,
        mode: 'fallback' as const,
      }
    }
  }

  const library: Record<string, { title: string; text: string; reflectionQuestion: string }> = {
    Noticias: {
      title: 'A Small Habit With Big Impact',
      text: 'Every morning, Maya reads one short article in English before checking social media. At first, she understood only a few words, but she kept going. After three months, she noticed that news headlines no longer felt intimidating. The daily habit was simple, yet it changed how confident she felt when meeting new vocabulary.',
      reflectionQuestion: 'What small habit helps you learn something consistently?',
    },
    Poema: {
      title: 'Quiet Morning',
      text: 'The window opens to a gentle light. A bird repeats the same song, and the city wakes up slowly. In that calm moment, I remember that learning a language is not a race. It is more like breathing with attention, one phrase at a time.',
      reflectionQuestion: 'Which line creates the strongest image in your mind?',
    },
    Conto: {
      title: 'The Key in the Drawer',
      text: 'Elena found a small silver key in her grandmother\'s desk. It looked old, but it shone under the afternoon light. She tried it on every box in the house until she opened a tiny wooden chest filled with letters from another country. Each letter told a story about courage, distance, and hope.',
      reflectionQuestion: 'Como o objeto encontrado muda a curiosidade da personagem?',
    },
    Historia: {
      title: 'A New Student in Town',
      text: 'When Daniel moved to a new town, everything felt unfamiliar. The streets were quiet, the school was bigger, and even the bus route seemed confusing. On his first day, a classmate named Ruby offered to show him the library. That small act of kindness made the new place feel less strange.',
      reflectionQuestion: 'Qual gesto faz a historia ficar mais acolhedora?',
    },
    'Historias de terror': {
      title: 'The Light Upstairs',
      text: 'Mila was alone at home when she noticed a thin line of light under the attic door. The house was silent, and she knew no one else should be there. She climbed the stairs slowly, hearing the wood creak beneath her feet. When she touched the handle, the light suddenly disappeared.',
      reflectionQuestion: 'Qual detalhe cria mais suspense nesse texto?',
    },
    Cronicas: {
      title: 'The Bus Stop at Seven',
      text: 'Every morning at seven, the same people gather at the bus stop. A baker wipes flour from his hands, a nurse checks the time, and a teenager finishes the last lines of homework. Nobody speaks much, yet the group shares a quiet rhythm. It feels like a small city ritual before the noise of the day begins.',
      reflectionQuestion: 'Que aspecto cotidiano faz essa cronica funcionar bem?',
    },
  }

  const fallback = library[preferences.category] ?? {
    title: 'The Value of Daily Practice',
    text: 'When Leo decided to practice English every day, he stopped waiting for the perfect plan. Some days he listened to a podcast. On others, he read a short story or wrote three sentences about work. The variety kept the routine alive, and each small session made the next one easier.',
    reflectionQuestion: 'Why can short routines be more effective than perfect plans?',
  }

  return {
    ...fallback,
    text: normalizeChallengeText(fallback.text, preferences.maxCharacters),
    mentorTip: undefined as string | undefined,
    mode: 'fallback' as const,
  }
}

export function buildFallbackInsight(
  selection: string,
  text: string,
  activeSubject?: StudySubject | null,
): WordInsight {
  const areaContext = activeSubject
    ? `no contexto de "${activeSubject.title}" (${activeSubject.expertPersona ?? 'Mentor Especialista'})`
    : 'no contexto atual'

  return {
    term: selection,
    translation: `Tradução aplicada ${areaContext}.`,
    meaning: `Na área de ${activeSubject?.title ?? 'estudo'}, "${selection}" é usado por profissionais para transmitir precisão e naturalidade. Evite traduzir ao pé da letra.`,
    example: `Example: In a real ${activeSubject?.title?.toLowerCase() ?? 'conversation'} scenario, I use "${selection}" to sound clear and confident.`,
    synonyms: ['domain expression', 'natural alternative'],
    pronunciation: 'Leia em voz alta destacando a sílaba tônica com ritmo natural.',
    context: `Contexto do texto: ${text.slice(0, 120)}...`,
  }
}
