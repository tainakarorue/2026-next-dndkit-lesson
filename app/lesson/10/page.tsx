'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { BoardState, CardId, Column, ColumnId } from '@/types/dnd-kit'
import { KanbanColumn } from '@/components/dnd-kit/kanban-column'
import { KanbanCardOverlay } from '@/components/dnd-kit/kanban-card'

// --- 初期データ ---
const initialBoard: BoardState = {
  cards: {
    'card-1': { id: 'card-1', title: 'ユーザー認証の実装', label: 'red' },
    'card-2': {
      id: 'card-2',
      title: 'API エンドポイントの設計',
      label: 'blue',
    },
    'card-3': {
      id: 'card-3',
      title: 'UI コンポーネントの作成',
      label: 'green',
    },
    'card-4': { id: 'card-4', title: 'テストの作成', label: 'yellow' },
    'card-5': { id: 'card-5', title: 'デプロイ設定', label: 'blue' },
  },
  columns: [
    { id: 'todo', title: 'TODO', cardIds: ['card-1', 'card-2'] },
    { id: 'in-progress', title: '進行中', cardIds: ['card-3'] },
    { id: 'done', title: '完了', cardIds: ['card-4', 'card-5'] },
  ],
}

// --- カスタムコリジョン検出 ---
function createKanbanCollision(columns: Column[]): CollisionDetection {
  return (args) => {
    const columnCollisions = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter(({ id }) =>
        columns.some((col) => col.id === id),
      ),
    })
    if (columnCollisions.length > 0) return columnCollisions
    return closestCorners(args)
  }
}

const Page = () => {
  const [board, setBoard] = useState<BoardState>(initialBoard)
  const [activeCardId, setActiveCardId] = useState<CardId | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const collisionDetection = createKanbanCollision(board.columns)

  function findColumnByCardId(cardId: CardId): Column | undefined {
    return board.columns.find((col) => col.cardIds.includes(cardId))
  }

  function findColumnById(columnId: ColumnId): Column | undefined {
    return board.columns.find((col) => col.id === columnId)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveCardId(active.id as CardId)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeId = active.id as CardId
    const overId = over.id as string
    const activeCol = findColumnByCardId(activeId)
    const overCol = findColumnByCardId(overId) ?? findColumnById(overId)
    if (!activeCol || !overCol || activeCol.id === overCol.id) return

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((col) => {
        if (col.id === activeCol.id) {
          return {
            ...col,
            cardIds: col.cardIds.filter((id) => id !== activeId),
          }
        }
        if (col.id === overCol.id) {
          const overIndex = col.cardIds.indexOf(overId)
          const newIndex = overIndex >= 0 ? overIndex : col.cardIds.length
          const newIds = [...col.cardIds]
          newIds.splice(newIndex, 0, activeId)
          return { ...col, cardIds: newIds }
        }
        return col
      }),
    }))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCardId(null)
    if (!over || active.id === over.id) return
    const activeId = active.id as CardId
    const overId = over.id as string
    const col = findColumnByCardId(activeId)
    if (!col) return

    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((c) => {
        if (c.id !== col.id) return c
        const oldIndex = c.cardIds.indexOf(activeId)
        const newIndex = c.cardIds.indexOf(overId)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return c
        return { ...c, cardIds: arrayMove(c.cardIds, oldIndex, newIndex) }
      }),
    }))
  }

  const activeCard = activeCardId ? board.cards[activeCardId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCardId(null)}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            return `${board.cards[active.id as string]?.title ?? active.id} をドラッグ開始しました。`
          },
          onDragOver({ active, over }) {
            if (over) return `${active.id} を ${over.id} の上に移動しました。`
            return `${active.id} はドロップ可能な場所の外にあります。`
          },
          onDragEnd({ active, over }) {
            if (over) return `${active.id} を ${over.id} にドロップしました。`
            return `ドロップをキャンセルしました。`
          },
          onDragCancel({ active }) {
            return `ドラッグをキャンセルしました。${active.id} は元の位置に戻りました。`
          },
        },
      }}
    >
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>カンバンボード</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {board.columns.map((column) => (
            <KanbanColumn key={column.id} column={column} cards={board.cards} />
          ))}
        </div>
      </div>
      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {activeCard ? <KanbanCardOverlay card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default Page
