'use client'

import { cn } from '@/lib/utils'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  id: string
  label: string
  /** DragOverlay と併用する場合は true。transform を適用せず ghost として残す */
  ghost?: boolean
}

export const DraggableItem = ({ id, label, ghost }: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id })

  const style = {
    transform: ghost ? undefined : CSS.Translate.toString(transform),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'w-full flex flex-col items-center justify-center bg-accent rounded-md p-8',
        isDragging ? 'opacity-30 cursor-grabbing' : 'opacity-100 cursor-grab',
      )}
    >
      {label}
    </div>
  )
}
