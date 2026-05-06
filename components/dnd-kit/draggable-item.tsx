'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface Props {
  id: string
  label: string
}

export const DraggableItem = ({ id, label }: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="w-full flex flex-col items-center justify-center bg-accent rounded-md cursor-pointer p-8"
    >
      {label}
    </div>
  )
}
