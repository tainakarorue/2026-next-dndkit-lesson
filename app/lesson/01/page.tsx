'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'

import { DraggableItem } from '@/components/dnd-kit/draggable-item'
import { DroppableZone } from '@/components/dnd-kit/droppable-zone'

type ItemId = 'item-1' | 'item-2' | 'item-3'
type ZoneId = 'zone-1' | 'zone-2'

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    // active: ドラッグされた要素の情報
    // over: ドロップ先の情報（ドロップ先がなければ null）
    if (!over) {
      setItemZones((prev) => ({
        ...prev,
        [active.id]: null,
      }))
    } else {
      setItemZones((prev) => ({
        ...prev,
        [active.id]: over.id as ZoneId,
      }))
    }
  }

  const unassignedItems = ITEMS.filter((item) => itemZones[item.id] === null)

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full h-screen grid grid-cols-3 gap-4 bg-amber-100 p-6 overflow-hidden">
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
      </div>
    </DndContext>
  )
}

export default Page
