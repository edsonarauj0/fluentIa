jest.mock('@/services/ai-service', () => ({
  aiService: {
    generateChallenge: jest.fn(),
    explainSelection: jest.fn(),
  },
}))

jest.mock('@/services/firebase', () => ({
  getFirestoreDb: jest.fn(() => null),
}))

import { aiService } from '@/services/ai-service'
import { challengeService } from '@/services/challenge-service'
import type { Challenge, UserProfile } from '@/types/domain'

const mockedGenerateChallenge = jest.mocked(aiService.generateChallenge)

describe('challengeService cache compatibility', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-07-01T12:00:00.000Z'))
    localStorage.clear()
    mockedGenerateChallenge.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
    localStorage.clear()
  })

  it('regenerates the challenge when the saved text was created with old preferences', async () => {
    const user: UserProfile = {
      id: 'demo-user',
      name: 'Edson',
      email: 'edson@example.com',
      preferences: {
        category: 'Noticias',
        level: 'intermediate',
        theme: 'sunrise',
        maxCharacters: 1200,
      },
      streak: 0,
      completedChallengeIds: [],
      lastCompletedAt: null,
    }

    const key = 'demo-user:2026-07-01'
    localStorage.setItem(
      'sem-mico.challenges',
      JSON.stringify({
        [key]: {
          id: key,
          date: '2026-07-01T10:00:00.000Z',
          category: 'Noticias',
          title: 'Texto antigo',
          text: 'x'.repeat(300),
          reflectionQuestion: 'Pergunta antiga',
          source: 'gemini',
          completed: false,
        },
      }),
    )

    mockedGenerateChallenge.mockResolvedValue({
      title: 'Texto novo',
      text: 'A fresh text that respects the latest limit.',
      reflectionQuestion: 'O que voce percebeu nesse novo texto?',
      mode: 'gemini',
    })

    const result = await challengeService.getDailyChallenge(user)

    expect(mockedGenerateChallenge).toHaveBeenCalledWith(user.preferences)
    expect(result.challenge.title).toBe('Texto novo')
    expect(result.challenge.preferencesSnapshot).toEqual({
      category: 'Noticias',
      level: 'intermediate',
      maxCharacters: 1200,
    })

    const stored = JSON.parse(localStorage.getItem('sem-mico.challenges') ?? '{}') as Record<string, Challenge>
    expect(stored[key].title).toBe('Texto novo')
  })
})
