'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  MouseSensor,
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

type StrategyKey =
  | 'closestCenter'
  | 'closestCorners'
  | 'rectIntersection'
  | 'pointerWithin'

const STRATEGIES: Record<StrategyKey, CollisionDetection> = {
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
}

type Zone = {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
}

const ZONES: Zone[] = [
  { id: 'zone-small', label: '小ゾーン', x: 200, y: 80, width: 80, height: 80 },
  {
    id: 'zone-large',
    label: '大ゾーン',
    x: 360,
    y: 60,
    width: 200,
    height: 160,
  },
  { id: 'zone-tall', label: '縦長', x: 600, y: 40, width: 80, height: 220 },
]

type DroppableBoxProps = Zone & { isOver: boolean }

function DroppableBox({
  id,
  label,
  x,
  y,
  width,
  height,
  isOver,
}: DroppableBoxProps) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        background: isOver ? '#d0f0d0' : '#f0f0f0',
        border: `2px solid ${isOver ? '#4caf50' : '#ccc'}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      {label}
    </div>
  )
}

function DraggableCard() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'drag-card',
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position: 'absolute',
        left: 60,
        top: 120,
        width: 80,
        height: 50,
        background: '#4a90e2',
        color: '#fff',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        fontSize: 13,
        transform: CSS.Translate.toString(transform),
        zIndex: 10,
      }}
    >
      Drag me
    </div>
  )
}

export default function Page() {
  const [strategy, setStrategy] = useState<StrategyKey>('closestCenter')
  const [overId, setOverId] = useState<string | null>(null)
  const [droppedZone, setDroppedZone] = useState<string | null>(null)

  const sensors = useSensors(useSensor(MouseSensor))

  function handleDragOver({ over }: DragOverEvent) {
    setOverId((over?.id as string) ?? null)
  }

  function handleDragEnd({ over }: DragEndEvent) {
    setDroppedZone((over?.id as string) ?? null)
    setOverId(null)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>コリジョン検出デモ</h2>
      <div
        style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}
      >
        {(Object.keys(STRATEGIES) as StrategyKey[]).map((key) => (
          <label
            key={key}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <input
              type="radio"
              name="strategy"
              value={key}
              checked={strategy === key}
              onChange={() => {
                setStrategy(key)
                setDroppedZone(null)
              }}
            />
            {key}
          </label>
        ))}
      </div>
      {droppedZone && (
        <p style={{ color: '#4caf50', marginBottom: 12 }}>
          最後のドロップ先: <strong>{droppedZone}</strong>
        </p>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={STRATEGIES[strategy]}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            position: 'relative',
            height: 320,
            border: '1px solid #ddd',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {ZONES.map((zone) => (
            <DroppableBox key={zone.id} {...zone} isOver={overId === zone.id} />
          ))}
          <DraggableCard />
        </div>
      </DndContext>
    </div>
  )
}
