import { useEffect } from 'react'
import { useRive } from '@rive-app/react-canvas-lite'
import { cn } from '@/lib/utils'
import type { MascotState } from '@/types/domain'

export type RiveMascotProps = {
  rivSrc: string
  state?: MascotState
  stateMachine?: string
  className?: string
}

export default function RiveMascot({
  rivSrc,
  state = 'idle',
  stateMachine = 'Main',
  className,
}: RiveMascotProps) {
  const { rive, RiveComponent } = useRive({
    src: rivSrc,
    stateMachines: stateMachine,
    autoplay: true,
  })

  useEffect(() => {
    if (!rive) return
    const inputs = rive.stateMachineInputs(stateMachine)
    if (!inputs) return

    for (const input of inputs) {
      if (input.name === 'thinking') input.value = state === 'thinking'
      if (input.name === 'celebrating') input.value = state === 'celebrating'
      if (input.name === 'blushing') input.value = state === 'blushing'
    }
  }, [rive, state, stateMachine])

  return <RiveComponent className={cn('h-24 w-24', className)} />
}
