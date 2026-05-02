import type { Challenge, Difficulty, StudyPreferences, WordInsight } from '@/types/domain'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

export const aiService = {
  async generateChallenge(preferences: StudyPreferences) {
    const prompt = [
      'You are creating a daily English reading challenge for a Brazilian learner.',
      `Category: ${preferences.category}.`,
      `Difficulty: ${preferences.level}.`,
      `Target maximum characters for the text body: ${preferences.maxCharacters}.`,
      'Write natural English only for the title and text body.',
      'Adapt vocabulary, sentence length, and complexity to the requested level.',
      'Keep the text engaging and coherent inside the requested category.',
      'Return valid JSON only with keys: title, text, reflectionQuestion.',
      'The reflectionQuestion must be in Portuguese and help the learner think about the text.',
      'Do not add markdown fences or extra commentary.',
    ].join(' ')

    const result = await callGemini(prompt)

    if (!result) {
      return buildFallbackChallenge(preferences)
    }

    try {
      const parsed = extractJson<{ title: string; text: string; reflectionQuestion: string }>(result)
      const sanitizedText = normalizeChallengeText(parsed.text, preferences.maxCharacters)
      return {
        title: parsed.title.trim(),
        text: sanitizedText,
        reflectionQuestion: parsed.reflectionQuestion.trim(),
        mode: 'gemini' as const,
      }
    } catch {
      return buildFallbackChallenge(preferences)
    }
  },

  async explainSelection(challenge: Challenge, selection: string, level: Difficulty): Promise<WordInsight> {
    const prompt = [
      'You are an English tutor for Brazilian learners.',
      `Explain the term "${selection}" taken from this text: ${challenge.text}`,
      `Difficulty level: ${level}.`,
      'Return valid JSON only with keys: term, translation, meaning, example, synonyms, pronunciation, context.',
      'Keep the translation and explanation in Portuguese and example in English.',
      'Do not add markdown fences or extra commentary.',
    ].join(' ')

    const result = await callGemini(prompt)

    if (!result) {
      return buildFallbackInsight(selection, challenge.text)
    }

    try {
      return extractJson<WordInsight>(result)
    } catch {
      return buildFallbackInsight(selection, challenge.text)
    }
  },
}

async function callGemini(prompt: string): Promise<string | null> {
  const apiKey = globalThis.__FLUENTIA_ENV__?.VITE_GEMINI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!response.ok) return null
    const data = (await response.json()) as GeminiResponse
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? null
  } catch {
    return null
  }
}

function extractJson<T>(payload: string): T {
  const normalized = payload.trim().replace(/^```json\s*/, '').replace(/```$/, '')
  const start = normalized.indexOf('{')
  const end = normalized.lastIndexOf('}')
  const candidate = start >= 0 && end >= 0 ? normalized.slice(start, end + 1) : normalized
  return JSON.parse(candidate) as T
}

function normalizeChallengeText(text: string, maxCharacters: number) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxCharacters) return normalized

  const sliced = normalized.slice(0, maxCharacters)
  const lastSpace = sliced.lastIndexOf(' ')
  return (lastSpace > 0 ? sliced.slice(0, lastSpace) : sliced).trim()
}

export function buildFallbackChallenge(preferences: StudyPreferences) {
  const library: Record<string, { title: string; text: string; reflectionQuestion: string }> = {
    News: {
      title: 'A Small Habit With Big Impact',
      text: 'Every morning, Maya reads one short article in English before checking social media. At first, she understood only a few words, but she kept going. After three months, she noticed that news headlines no longer felt intimidating. The daily habit was simple, yet it changed how confident she felt when meeting new vocabulary.',
      reflectionQuestion: 'What small habit helps you learn something consistently?',
    },
    Poems: {
      title: 'Quiet Morning',
      text: 'The window opens to a gentle light. A bird repeats the same song, and the city wakes up slowly. In that calm moment, I remember that learning a language is not a race. It is more like breathing with attention, one phrase at a time.',
      reflectionQuestion: 'Which line creates the strongest image in your mind?',
    },
  }

  const fallback = library[preferences.category] ?? {
    title: 'The Value of Daily Practice',
    text: 'When Leo decided to practice English every day, he stopped waiting for the perfect plan. Some days he listened to a podcast. On others, he read a short story or wrote three sentences about work. The variety kept the routine alive, and each small session made the next one easier.',
    reflectionQuestion: 'Why can short routines be more effective than perfect plans?',
  }

  return {
    ...fallback,
    text: fallback.text.slice(0, preferences.maxCharacters),
    mode: 'fallback' as const,
  }
}

export function buildFallbackInsight(selection: string, text: string): WordInsight {
  return {
    term: selection,
    translation: 'Traducao aproximada baseada no contexto atual.',
    meaning: `No texto, "${selection}" ajuda a construir a ideia principal da frase e pode ser entendido observando as palavras ao redor.`,
    example: `Example: I can use "${selection}" when I describe a real situation in English.`,
    synonyms: ['related word', 'close meaning'],
    pronunciation: 'Leia em voz alta com foco nas silabas mais fortes.',
    context: `Contexto do texto: ${text.slice(0, 120)}...`,
  }
}
