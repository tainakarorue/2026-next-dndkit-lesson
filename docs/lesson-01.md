# Lesson 01: はじめてのドラッグ&ドロップ

## 目標

`@dnd-kit/core` の最小構成を理解し、要素をドラッグして別の場所にドロップできるようにする。

## インストール

```bash
npm install @dnd-kit/core
```

## 学習トピック

### 1. DndContext

すべての dnd-kit コンポーネント・フックを包む最上位プロバイダー。
`onDragEnd` コールバックでドロップ結果を受け取る。

```tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';

export default function Page() {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    // active: ドラッグされた要素の情報
    // over: ドロップ先の情報（ドロップ先がなければ null）
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* Draggable / Droppable をここに置く */}
    </DndContext>
  );
}
```

### 2. useDraggable

要素をドラッグ可能にするフック。

```tsx
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type DraggableItemProps = {
  id: string;
  label: string;
};

function DraggableItem({ id, label }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {label}
    </div>
  );
}
```

**返り値の主要プロパティ:**

| プロパティ | 役割 |
|---|---|
| `setNodeRef` | ドラッグ対象 DOM に渡す ref |
| `listeners` | onPointerDown 等のイベントリスナー |
| `attributes` | role / tabIndex 等の ARIA 属性 |
| `transform` | ドラッグ中の移動量（x, y） |
| `isDragging` | ドラッグ中かどうか |

### 3. useDroppable

要素をドロップ先として登録するフック。

```tsx
import { useDroppable } from '@dnd-kit/core';

type DroppableZoneProps = {
  id: string;
  children: React.ReactNode;
};

function DroppableZone({ id, children }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ background: isOver ? '#d0f0d0' : '#f0f0f0' }}
    >
      {children}
    </div>
  );
}
```

**返り値の主要プロパティ:**

| プロパティ | 役割 |
|---|---|
| `setNodeRef` | ドロップ先 DOM に渡す ref |
| `isOver` | ドラッグアイテムがこの上にあるか |

## Step 構成（ページ内）

| Step | 内容 |
|---|---|
| Step 1 | `useDraggable` だけ使い、要素をドラッグして動かす |
| Step 2 | `useDroppable` を追加し、ドロップゾーンを作る |
| Step 3 | `onDragEnd` でアイテムをドロップ先に移動させる状態管理を実装 |

## 完成イメージ

- カード（Draggable）が画面左側に並んでいる
- 右側にドロップゾーンが2つある
- カードをドロップゾーンにドロップすると移動する
- ドロップゾーンはホバー中に色が変わる

## 注意点

- `transform` を CSS で適用しないと要素が視覚的に動かない（`@dnd-kit/utilities` の `CSS.Translate.toString` を使う）
- `listeners` を `div` に付ける場合、`touch-action: none` のスタイルが必要（デフォルトで付与されるが確認すること）
- `useDraggable` の `id` はアプリ内で一意にする

## サンプル: app/lesson/01/page.tsx 全体

```tsx
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

export default function Page() {
  const [itemZones, setItemZones] = useState<Record<ItemId, ZoneId | null>>({
    'item-1': null,
    'item-2': null,
    'item-3': null,
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    setItemZones(prev => ({
      ...prev,
      [active.id]: over.id as ZoneId,
    }))
  }

  const unassignedItems = ITEMS.filter(item => itemZones[item.id] === null)

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2>Items</h2>
          {unassignedItems.map(item => (
            <DraggableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {ZONES.map(zone => (
            <DroppableZone key={zone.id} id={zone.id}>
              <h3>{zone.label}</h3>
              {ITEMS.filter(item => itemZones[item.id] === zone.id).map(item => (
                <DraggableItem key={item.id} id={item.id} label={item.label} />
              ))}
            </DroppableZone>
          ))}
        </div>
      </div>
    </DndContext>
  )
}
```

### ポイント解説

- `itemZones` で各カードがどのゾーンにいるか（`null` = 未配置）を管理する
- `handleDragEnd` で `over` が `null` の場合（ゾーン外でドロップ）は何もしない
- 未配置のカードは左側に表示し、配置済みのカードはそのゾーン内に表示する
