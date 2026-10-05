import { useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { X, Minus, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WindowProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  initialWidth?: number
  initialHeight?: number
}

export function Window({
  title,
  onClose,
  children,
  initialWidth = 480,
  initialHeight = 360,
}: WindowProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(true)
  const basePos = useRef({ x: 0, y: 0 })

  const bind = useDrag(
    ({ first, last, movement: [mx, my], event }) => {
      const target = event.target as HTMLElement
      if (!target.closest('[data-drag-handle]')) return

      if (first) {
        basePos.current = { x: pos.x, y: pos.y }
      }

      const next = { x: basePos.current.x + mx, y: basePos.current.y + my }
      setPos(next)

      if (last) {
        basePos.current = next
      }
    },
    { filterTaps: true }
  )

  return (
    <div
      {...bind()}
      style={
        maximized
          ? { inset: 0, width: '100%', height: '100%', transform: 'none' }
          : {
              width: initialWidth,
              maxWidth: 'calc(100vw - 32px)',
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
            }
      }
      className={cn(
        'fixed top-1/2 left-1/2 z-50',
        'bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl',
        'flex flex-col overflow-hidden',
        maximized && 'rounded-none top-0 left-0'
      )}
    >
      {/* Title bar */}
      <div
        data-drag-handle
        className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10 cursor-move select-none shrink-0"
      >
        {/* Traffic lights */}
        <button
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
          aria-label="Cerrar"
        />
        <button
          onClick={() => setMinimized((v) => !v)}
          className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
          aria-label="Minimizar"
        >
          <Minus className="w-2 h-2 text-yellow-900 mx-auto hidden" />
        </button>
        <button
          onClick={() => setMaximized((v) => !v)}
          className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
          aria-label="Maximizar"
        >
          <Maximize2 className="w-2 h-2 text-green-900 mx-auto hidden" />
        </button>

        <span className="flex-1 text-center text-sm font-medium text-foreground/80 pointer-events-none">
          {title}
        </span>

        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors ml-auto"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      {!minimized && (
        <div
          style={maximized ? {} : { height: initialHeight }}
          className="overflow-auto p-4"
        >
          {children}
        </div>
      )}
    </div>
  )
}
