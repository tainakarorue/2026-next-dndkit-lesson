import { Card, CardId, Column } from '@/types/dnd-kit'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'

interface KanbanColumnProps {
  column: Column
  cards: Record<CardId, Card>
}

export const KanbanColumn = ({ column, cards }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 240,
        minHeight: 400,
        background: isOver ? '#e8f4ff' : '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        border: '1px solid #e0e0e0',
        transition: 'background 0.1s',
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
        {column.title}
      </h3>
      <SortableContext
        items={column.cardIds}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {column.cardIds.map((id) => (
            <KanbanCard key={id} id={id} card={cards[id]} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
