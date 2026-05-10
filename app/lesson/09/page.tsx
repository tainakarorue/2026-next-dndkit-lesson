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
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Item = { id: string; label: string }

const initialItems: Item[] = [
  { id: 'item-1', label: 'タスク A' },
  { id: 'item-2', label: 'タスク B' },
  { id: 'item-3', label: 'タスク C' },
  { id: 'item-4', label: 'タスク D' },
]

type SortableItemProps = { id: string; label: string }

function SortableItem({ id, label }: SortableItemProps) {
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
        padding: '12px 16px',
        background: isDragging ? '#e3f2fd' : '#fff',
        border: `2px solid ${isDragging ? '#0066cc' : '#ddd'}`,
        borderRadius: 8,
        cursor: 'grab',
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {label}
    </div>
  )
}

export default function Page() {
  const [items, setItems] = useState<Item[]>(initialItems)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id)
      const newIndex = prev.findIndex((item) => item.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            return `${active.id} をドラッグ開始しました。矢印キーで移動、Space でドロップ、Escape でキャンセルできます。`
          },
          onDragOver({ active, over }) {
            if (over) {
              return `${active.id} を ${over.id} の上に移動しました。`
            }
            return `${active.id} はドロップ可能な場所の外にあります。`
          },
          onDragEnd({ active, over }) {
            if (over) {
              return `${active.id} を ${over.id} にドロップしました。`
            }
            return `ドロップをキャンセルしました。${active.id} は元の位置に戻りました。`
          },
          onDragCancel({ active }) {
            return `ドラッグをキャンセルしました。${active.id} は元の位置に戻りました。`
          },
        },
        screenReaderInstructions: {
          draggable:
            'このアイテムはドラッグ可能です。Space または Enter でドラッグを開始してください。',
        },
      }}
    >
      <div style={{ padding: '2rem', maxWidth: 400 }}>
        <h2>アクセシブルなソータブルリスト</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Tab でフォーカス → Space でドラッグ開始 → ↑↓ で移動 → Space でドロップ
        </p>
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id} label={item.label} />
            ))}
          </div>
        </SortableContext>
      </div>
    </DndContext>
  )
}
