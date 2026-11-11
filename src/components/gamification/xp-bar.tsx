import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export function XPBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-3.5 rounded-full bg-brand-100 overflow-hidden', className)}
    >
      <motion.div
        className="h-full rounded-full bg-xp"
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      />
    </div>
  )
}

export function GoalRing({
  completed,
  total = 3,
  className,
}: {
  completed: number
  total?: number
  className?: string
}) {
  const size = 84
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = Math.max(0, Math.min(1, completed / total))
  const strokeDashoffset = circumference * (1 - ratio)

  return (
    <div className={cn('relative inline-flex h-[84px] w-[84px] shrink-0 items-center justify-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#DCE7FF"
          strokeWidth={strokeWidth}
        />
        {completed > 0 ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#22D3EE"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        ) : (
          <circle
            cx={size / 2 + radius}
            cy={size / 2}
            r={4.5}
            fill="#22D3EE"
          />
        )}
      </svg>
      <span className="absolute text-lg font-extrabold tracking-tight text-navy-900">
        {completed}/{total}
      </span>
    </div>
  )
}
