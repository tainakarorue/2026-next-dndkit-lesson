import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Card, CardId } from '@/types/dnd-kit'

const LABEL_COLORS: Record<string, string> = {
  red: '#ffd6d6',
  yellow: '#fffbd6',
  green: '#d6ffd6',
  blue: '#d6f0ff',
}

interface KanbanCardProps {
  id: CardId
  card: Card
}

export const KanbanCard = memo(({ id, card }: KanbanCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px 12px',
        background: card.label ? LABEL_COLORS[card.label] : '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grab',
        fontSize: 13,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      {card.title}
    </div>
  )
})

KanbanCard.displayName = 'KanbanCard'

interface KanbanCardOverlayProps {
  card: Card
}

export const KanbanCardOverlay = ({ card }: KanbanCardOverlayProps) => {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: card.label ? LABEL_COLORS[card.label] : '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grabbing',
        fontSize: 13,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      {card.title}
    </div>
  )
}
