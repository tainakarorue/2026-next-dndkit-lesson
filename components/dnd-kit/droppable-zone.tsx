'use client'

import { cn } from '@/lib/utils'
import { useDroppable } from '@dnd-kit/core'

interface Props {
  id: string
  children: React.ReactNode
}

export const DroppableZone = ({ id, children }: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn('rounded-md p-4 bg-amber-200', isOver && 'bg-amber-400')}
    >
      {children}
    </div>
  )
}
