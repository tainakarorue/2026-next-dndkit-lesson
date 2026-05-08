'use client'

import { cn } from '@/lib/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  id: string
  label: string
}

export const SortableGridItem = ({ id, label }: Props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      suppressHydrationWarning
      className={cn(
        'w-full flex flex-col items-center justify-center bg-accent rounded-md p-8',
        isDragging ? 'opacity-30 cursor-grabbing' : 'opacity-100 cursor-grab',
      )}
    >
      {label}
    </div>
  )
}
