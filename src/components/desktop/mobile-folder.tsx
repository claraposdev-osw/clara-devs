import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileFolderProps {
  icon: LucideIcon
  label: string
  color: string
  onClick: () => void
}

export function MobileFolder({ icon: Icon, label, color, onClick }: MobileFolderProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group w-20 select-none"
    >
      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center relative overflow-hidden transition-transform duration-150 group-hover:scale-105 group-active:scale-95 shadow-lg">
        {/* Mini icons grid inside folder */}
        <div className="grid grid-cols-2 gap-1 p-2">
          <div className={cn('w-5 h-5 rounded-md flex items-center justify-center', color)}>
            <Icon className="w-3 h-3 text-white" />
          </div>
          <div className="w-5 h-5 rounded-md bg-white/20" />
          <div className="w-5 h-5 rounded-md bg-white/20" />
          <div className="w-5 h-5 rounded-md bg-white/20" />
        </div>
      </div>
      <span className="text-xs text-white font-medium text-center leading-tight drop-shadow-md">
        {label}
      </span>
    </button>
  )
}
