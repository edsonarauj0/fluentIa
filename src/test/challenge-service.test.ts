import { buildFallbackChallenge, buildFallbackInsight, normalizeChallengeText } from '@/services/ai-service'

describe('ai-service fallbacks', () => {
  it('respects max characters in fallback challenge', () => {
    const result = buildFallbackChallenge({
      category: 'News',
      level: 'beginner',
      theme: 'sunrise',
      maxCharacters: 120,
    })

    expect(result.text.length).toBeLessThanOrEqual(120)
    expect(result.mode).toBe('fallback')
  })

  it('creates an insight for the selected term', () => {
    const insight = buildFallbackInsight('habit', 'Daily practice creates confidence.')

    expect(insight.term).toBe('habit')
    expect(insight.example).toContain('habit')
    expect(insight.synonyms.length).toBeGreaterThan(0)
  })

  it('normalizes and trims generated text to the requested limit', () => {
    const result = normalizeChallengeText('One   short sentence.   Another sentence here.', 28)

    expect(result).toBe('One short sentence. Another')
    expect(result.length).toBeLessThanOrEqual(28)
  })
})
