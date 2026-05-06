'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragCancelEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { DraggableItem } from '@/components/dnd-kit/draggable-item'
import { DroppableZone } from '@/components/dnd-kit/droppable-zone'

type ItemId = 'item-1' | 'item-2' | 'item-3'
type ZoneId = 'zone-1' | 'zone-2'
type LogEntry = { event: string; detail: string }

const ITEMS: { id: ItemId; label: string }[] = [
  { id: 'item-1', label: 'Card 1' },
  { id: 'item-2', label: 'Card 2' },
  { id: 'item-3', label: 'Card 3' },
]

const ZONES: { id: ZoneId; label: string }[] = [
  { id: 'zone-1', label: 'Zone A' },
  { id: 'zone-2', label: 'Zone B' },
]

const Page = () => {
  const [itemZones, setItemZones] = useState<Record<ItemId, ZoneId | null>>({
    'item-1': null,
    'item-2': null,
    'item-3': null,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])

  const sensors = useSensors(
    // 8px 動かすまでドラッグ開始しない
    //クリックとドラッグを区別するため。距離なしだと、ボタンを押した瞬間にドラッグが始まってしまう
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    // 200ms 長押し後に開始
    //待機中に 5px以内のズレは許容（指が微妙に動いてもキャンセルしない）
    //スクロールとドラッグを区別するため。長押し判定がないとページスクロールしようとしただけでドラッグが起動する
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    //キーボード操作
    //Space / Enter でドラッグ開始、矢印キーで移動、Space / Enterで確定、Escape でキャンセル
    //アクセシビリティ対応。マウスやタッチが使えないユーザーへの配慮
    useSensor(KeyboardSensor),
  )

  const addLog = (entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev].slice(0, 10))
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    addLog({ event: 'onDragStart', detail: `${active.id}` })
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    addLog({
      event: 'onDragOver',
      detail: `${active.id} → ${over?.id ?? 'null'}`,
    })
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    addLog({
      event: 'onDragEnd',
      detail: `${active.id} → ${over?.id ?? 'null'}`,
    })
    setItemZones((prev) => ({
      ...prev,
      [active.id]: over ? (over.id as ZoneId) : null,
    }))
  }

  const handleDragCancel = ({ active }: DragCancelEvent) => {
    addLog({ event: 'onDragCancel', detail: `${active.id}` })
  }

  const unassignedItems = ITEMS.filter((item) => itemZones[item.id] === null)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="w-full h-screen grid grid-cols-4 gap-4 bg-amber-100 p-6 overflow-hidden">
        <div className="flex flex-col gap-2 rounded-md p-4 bg-emerald-200">
          <h2>Items</h2>
          {unassignedItems.map((item) => (
            <DraggableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
        {ZONES.map((zone) => (
          <DroppableZone key={zone.id} id={zone.id}>
            <div className="flex flex-col gap-2">
              <h3>{zone.label}</h3>
              {ITEMS.filter((item) => itemZones[item.id] === zone.id).map(
                (item) => (
                  <DraggableItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                  />
                ),
              )}
            </div>
          </DroppableZone>
        ))}

        <div>
          <h2>イベントログ</h2>
          <ul className="space-y-2">
            {logs.map((log, i) => (
              <li key={i}>
                <strong>{log.event}</strong>: {log.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DndContext>
  )
}

export default Page
