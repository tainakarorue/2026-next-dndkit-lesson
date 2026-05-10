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
type Container = { id: string; title: string; itemIds: string[] }

const initialItems: Record<string, Item> = {
  'item-1': { id: 'item-1', label: 'タスク A' },
  'item-2': { id: 'item-2', label: 'タスク B' },
  'item-3': { id: 'item-3', label: 'タスク C' },
  'item-4': { id: 'item-4', label: 'タスク D' },
  'item-5': { id: 'item-5', label: 'タスク E' },
}

const initialContainers: Container[] = [
  { id: 'todo', title: 'TODO', itemIds: ['item-1', 'item-2', 'item-3'] },
  { id: 'in-progress', title: '進行中', itemIds: ['item-4'] },
  { id: 'done', title: '完了', itemIds: ['item-5'] },
]

interface SortableItemProps {
  id: string
  label: string
}

const SortableItem = ({ id, label }: SortableItemProps) => {
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
      suppressHydrationWarning
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grab',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        fontSize: 14,
      }}
    >
      {label}
    </div>
  )
}

interface OverlayItemProps {
  label: string
}

const OverlayItem = ({ label }: OverlayItemProps) => {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grabbing',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        fontSize: 14,
      }}
    >
      {label}
    </div>
  )
}

const ContainerColumn = ({ container }: { container: Container }) => {
  const { setNodeRef, isOver } = useDroppable({ id: container.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        width: 220,
        minHeight: 300,
        background: isOver ? '#e8f4ff' : '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        border: '1px solid #e0e0e0',
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>
        {container.title}
      </h3>
      <SortableContext
        items={container.itemIds}
        strategy={verticalListSortingStrategy}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {container.itemIds.map((id) => (
            <SortableItem
              key={id}
              id={id}
              label={initialItems[id]?.label ?? id}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

const Pages = () => {
  const [containers, setContainers] = useState<Container[]>(initialContainers)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function findContainerByItemId(itemId: string): Container | undefined {
    return containers.find((c) => c.itemIds.includes(itemId))
  }

  function findContainerById(containerId: string): Container | undefined {
    return containers.find((c) => c.id === containerId)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeContainer = findContainerByItemId(activeId)
    const overContainer =
      findContainerByItemId(overId) ?? findContainerById(overId)

    if (!activeContainer || !overContainer) return
    if (activeContainer.id === overContainer.id) return

    setContainers((prev) =>
      prev.map((c) => {
        if (c.id === activeContainer.id) {
          return { ...c, itemIds: c.itemIds.filter((id) => id !== activeId) }
        }
        if (c.id === overContainer.id) {
          const overIndex = c.itemIds.indexOf(overId)
          const newIndex = overIndex >= 0 ? overIndex : c.itemIds.length
          const newIds = [...c.itemIds]
          newIds.splice(newIndex, 0, activeId)
          return { ...c, itemIds: newIds }
        }
        return c
      }),
    )
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string
    const container = findContainerByItemId(activeId)
    if (!container) return

    setContainers((prev) =>
      prev.map((c) => {
        if (c.id !== container.id) return c
        const oldIndex = c.itemIds.indexOf(activeId)
        const newIndex = c.itemIds.indexOf(overId)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return c
        return { ...c, itemIds: arrayMove(c.itemIds, oldIndex, newIndex) }
      }),
    )
  }

  const activeItem = activeId ? initialItems[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ padding: '2rem' }}>
        <h2>カンバンボード</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {containers.map((container) => (
            <ContainerColumn key={container.id} container={container} />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeItem ? <OverlayItem label={activeItem.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}

export default Pages
