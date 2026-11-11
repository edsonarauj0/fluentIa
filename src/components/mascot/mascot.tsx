import { Suspense, lazy } from 'react'
import { motion } from 'motion/react'
import { BRAND_ASSETS } from '@/lib/assets'
import { cn } from '@/lib/utils'
import type { MascotState } from '@/types/domain'

const LazyRiveMascot = lazy(() => import('@/components/mascot/rive-mascot'))

type MascotProps = {
  state?: MascotState
  rivSrc?: string
  stateMachine?: string
  className?: string
  alt?: string
}

const stateAnimations: Record<
  MascotState,
  {
    animate: Record<string, number | number[]>
    transition: Record<string, unknown>
  }
> = {
  idle: {
    animate: { y: [0, -4, 0], rotate: [0, 1.5, -1.5, 0] },
    transition: { duration: 3.6, repeat: Infinity, ease: 'easeInOut' },
  },
  thinking: {
    animate: { rotate: [-4, 4, -4], scale: [1, 1.04, 1] },
    transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
  },
  celebrating: {
    animate: { y: [0, -10, 0], scale: [1, 1.1, 1], rotate: [0, -8, 8, 0] },
    transition: { duration: 0.7, repeat: 2, ease: 'easeOut' },
  },
  blushing: {
    animate: { rotate: [-3, 3, -2, 0], scale: [1, 0.97, 1] },
    transition: { duration: 0.9, ease: 'easeInOut' },
  },
  sleeping: {
    animate: { scale: [1, 0.96, 1], opacity: [0.9, 1, 0.9] },
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}

export function Mascot({
  state = 'idle',
  rivSrc,
  stateMachine = 'Main',
  className,
  alt = 'Mascote Mico',
}: MascotProps) {
  if (rivSrc) {
    return (
      <Suspense
        fallback={
          <img
            src={BRAND_ASSETS.mascotAvatar}
            alt={alt}
            className={cn('h-24 w-24 object-contain', className)}
          />
        }
      >
        <LazyRiveMascot
          rivSrc={rivSrc}
          state={state}
          stateMachine={stateMachine}
          className={className}
        />
      </Suspense>
    )
  }

  const preset = stateAnimations[state] ?? stateAnimations.idle

  return (
    <motion.div
      data-mascot-state={state}
      animate={preset.animate}
      transition={preset.transition}
      className={cn('relative inline-flex select-none items-center justify-center', className)}
    >
      <img
        src={BRAND_ASSETS.mascotAvatar}
        alt={alt}
        className="h-full w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.22)]"
        draggable={false}
      />
    </motion.div>
  )
}
