import { Briefcase, Coffee, MessageCircle, Plane, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SubjectIconName, SubjectStatus } from '@/types/domain'

const ICON_COMPONENTS: Record<SubjectIconName, typeof Briefcase> = {
  briefcase: Briefcase,
  plane: Plane,
  coffee: Coffee,
  message: MessageCircle,
  sparkles: Sparkles,
}

const ICON_STYLES: Record<SubjectIconName, string> = {
  briefcase: 'bg-[#DCE7FF] text-[#1B4FE0]',
  plane: 'bg-[#FFE6DE] text-[#A83A1A]',
  coffee: 'bg-[#FFF1CF] text-[#8A5200]',
  message: 'bg-[#EDE9FE] text-[#7C5CFF]',
  sparkles: 'bg-[#DCE7FF] text-[#1B4FE0]',
}

export function SubjectIconBadge({
  icon,
  status,
  className,
}: {
  icon: SubjectIconName
  status?: SubjectStatus
  className?: string
}) {
  const Icon = ICON_COMPONENTS[icon] ?? Briefcase
  const isArchived = status === 'archived'

  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]',
        isArchived ? 'bg-[#E8EEFB] text-[#55627A]' : ICON_STYLES[icon],
        className,
      )}
    >
      <Icon className="h-[22px] w-[22px]" />
    </div>
  )
}

export function SubjectInlineIcon({
  icon,
  className,
}: {
  icon: SubjectIconName
  className?: string
}) {
  const Icon = ICON_COMPONENTS[icon] ?? Briefcase
  return <Icon className={cn('h-4 w-4 shrink-0', className)} />
}
