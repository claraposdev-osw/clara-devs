import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DesktopIconProps {
  icon: LucideIcon
  label: string
  color: string
  onClick: () => void
}

export function DesktopIcon({ icon: Icon, label, color, onClick }: DesktopIconProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group w-20 select-none"
    >
      <div
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg',
          'transition-transform duration-150 group-hover:scale-110 group-active:scale-95',
          color
        )}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
      <span className="text-xs text-white font-medium text-center leading-tight drop-shadow-md px-1">
        {label}
      </span>
    </button>
  )
}
