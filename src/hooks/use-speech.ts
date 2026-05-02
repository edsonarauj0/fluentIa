import { useEffect, useRef, useState } from 'react'

type SpeechToken = {
  value: string
  start: number
  isWhitespace: boolean
}

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [currentCharIndex, setCurrentCharIndex] = useState<number | null>(null)
  const playbackIdRef = useRef(0)

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  function speak(text: string, rate = 0.9) {
    if (!('speechSynthesis' in window)) return

    const tokens = tokenizeSpeechText(text).filter((token) => !token.isWhitespace)
    if (tokens.length === 0) return

    playbackIdRef.current += 1
    const playbackId = playbackIdRef.current

    window.speechSynthesis.cancel()
    setPaused(false)
    setSpeaking(true)
    setCurrentCharIndex(tokens[0].start)

    tokens.forEach((token, index) => {
      const utterance = new SpeechSynthesisUtterance(token.value)
      utterance.lang = 'en-US'
      utterance.rate = rate
      utterance.pitch = 1
      utterance.onstart = () => {
        if (playbackId !== playbackIdRef.current) return
        setSpeaking(true)
        setCurrentCharIndex(token.start)
      }
      utterance.onend = () => {
        if (playbackId !== playbackIdRef.current) return
        if (index === tokens.length - 1) {
          setSpeaking(false)
          setPaused(false)
          setCurrentCharIndex(null)
        }
      }
      utterance.onerror = () => {
        if (playbackId !== playbackIdRef.current) return
        setSpeaking(false)
        setPaused(false)
        setCurrentCharIndex(null)
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  function pause() {
    if (!('speechSynthesis' in window) || !speaking || paused) return
    window.speechSynthesis.pause()
    setPaused(true)
  }

  function resume() {
    if (!('speechSynthesis' in window) || !paused) return
    window.speechSynthesis.resume()
    setPaused(false)
  }

  function stop() {
    if (!('speechSynthesis' in window)) return
    playbackIdRef.current += 1
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setPaused(false)
    setCurrentCharIndex(null)
  }

  function speakSelection(text: string, rate = 0.82) {
    if (!('speechSynthesis' in window) || !text.trim()) return

    stop()
    const utterance = new SpeechSynthesisUtterance(text.trim())
    utterance.lang = 'en-US'
    utterance.rate = rate
    utterance.pitch = 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => {
      setSpeaking(false)
      setPaused(false)
      setCurrentCharIndex(null)
    }
    utterance.onerror = () => {
      setSpeaking(false)
      setPaused(false)
      setCurrentCharIndex(null)
    }
    window.speechSynthesis.speak(utterance)
  }

  return { speak, pause, resume, stop, speakSelection, speaking, paused, currentCharIndex }
}

function tokenizeSpeechText(text: string): SpeechToken[] {
  const matches = text.matchAll(/\S+|\s+/g)
  const tokens: SpeechToken[] = []

  for (const match of matches) {
    const value = match[0]
    const start = match.index ?? 0
    tokens.push({
      value,
      start,
      isWhitespace: /^\s+$/.test(value),
    })
  }

  return tokens
}
