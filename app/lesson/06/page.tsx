'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  snapCenterToCursor,
} from '@dnd-kit/modifiers'

// | モディファイア | 効果 |
// | `restrictToVerticalAxis` | Y 方向のみ移動可能（X を 0 に固定） |
// | `restrictToHorizontalAxis` | X 方向のみ移動可能 |
// | `restrictToWindowEdges` | ウィンドウ外に出ないよう制限 |
// | `restrictToParentElement` | 親要素の境界内に制限 |
// | `restrictToFirstScrollableAncestor` | 最初のスクロール可能祖先の境界内に制限 |
// | `snapCenterToCursor` | ドラッグ要素の中心をカーソルに合わせる |

import { OverlayCard } from '@/components/dnd-kit/overlay-card'
import { SortableGridItem } from '@/components/dnd-kit/sortable-grid-item'

type Item = { id: string; label: string }

const initialItems: Item[] = [
  { id: 'item-1', label: 'タスク A' },
  { id: 'item-2', label: 'タスク B' },
  { id: 'item-3', label: 'タスク C' },
  { id: 'item-4', label: 'タスク D' },
]

const Page = () => {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const activeItem = activeId
    ? (items.find((item) => item.id === activeId) ?? null)
    : null

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <div className="w-full h-screen grid grid-cols-4 gap-4 bg-amber-100 p-6 overflow-hidden">
        <div className="flex flex-col gap-2 rounded-md p-4 bg-emerald-200">
          <h2>タスクリスト</h2>
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <SortableGridItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeItem ? <OverlayCard label={activeItem.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default Page
