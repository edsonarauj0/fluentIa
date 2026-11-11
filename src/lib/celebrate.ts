import confetti from 'canvas-confetti'

export function triggerHaptic(durationMs = 10) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(durationMs)
    }
  } catch {
    // Ignore on unsupported browsers (e.g. iOS Safari or JSDOM)
  }
}

export function celebrate() {
  triggerHaptic(15)

  try {
    void confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#2563FF', '#FFB020', '#22D3EE', '#F25CA8'],
      disableForReducedMotion: true,
    })
  } catch {
    // Safe fallback in test/non-canvas environments
  }
}
