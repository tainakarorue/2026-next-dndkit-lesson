# Lesson 03: DragOverlay

## 目標

ドラッグ中に元の要素とは独立した「フローティングプレビュー」を表示する。
DragOverlay の仕組みと、ドロップ後のアニメーションを理解する。

## インストール

```bash
npm install @dnd-kit/core
```

## 学習トピック

### 1. DragOverlay とは

通常の `useDraggable` では要素そのものが変形（transform）して動く。
`DragOverlay` を使うと：

- 元の要素は**その場に残る**（ghostとして）
- 別の DOM（ポータル）にドラッグプレビューが描画される
- **ドロップ時にアニメーション**を付けられる

```tsx
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';

export default function Page() {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DndContext
      onDragStart={({ active }) => setActiveId(active.id as string)}
      onDragEnd={() => setActiveId(null)}
      onDragCancel={() => setActiveId(null)}
    >
      {/* ドラッグ可能な要素群 */}
      <DragOverlay>
        {activeId ? <OverlayCard id={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### 2. ドロップアニメーション

`DragOverlay` の `dropAnimation` プロップでアニメーションを設定する。

```tsx
import { defaultDropAnimation, DragOverlay } from '@dnd-kit/core';

// デフォルトのドロップアニメーション
<DragOverlay dropAnimation={defaultDropAnimation}>
  ...
</DragOverlay>

// アニメーションなし
<DragOverlay dropAnimation={null}>
  ...
</DragOverlay>

// カスタム
<DragOverlay
  dropAnimation={{
    duration: 300,
    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  }}
>
  ...
</DragOverlay>
```

### 3. useDraggable との組み合わせ

DragOverlay を使う場合、`useDraggable` 側のスタイルは「元の場所に ghost を残す」用途になる。

```tsx
type DraggableItemProps = { id: string; label: string };

function DraggableItem({ id, label }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.3 : 1,   // ドラッグ中は薄く表示（ghost）
        // transform は不要 — DragOverlay が動く
      }}
    >
      {label}
    </div>
  );
}

// オーバーレイ用コンポーネント（transform なし、見た目だけ）
type OverlayCardProps = { label: string };

function OverlayCard({ label }: OverlayCardProps) {
  return (
    <div style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.2)', cursor: 'grabbing' }}>
      {label}
    </div>
  );
}
```

### 4. active.data でオーバーレイにデータを渡す

`useDraggable` の `data` オプションに任意のデータを渡すと、
`onDragStart` の `active.data.current` で取得できる。

```tsx
const { ... } = useDraggable({
  id,
  data: { label, color, type: 'card' },
});

// DndContext 側
onDragStart={({ active }) => {
  setActiveItem(active.data.current as { label: string; color: string; type: string });
}}
```

## Step 構成（ページ内）

| Step | 内容 |
|---|---|
| Step 1 | DragOverlay なし ／ ありの見た目の違いを横並びで比較 |
| Step 2 | `dropAnimation` を無効 / デフォルト / カスタムで切り替える |
| Step 3 | `active.data.current` を使ってオーバーレイに元カードの情報を反映 |

## 完成イメージ

- カードをドラッグすると元の場所が半透明になり、カーソルに追従するプレビューが表示される
- プレビューには影（box-shadow）と `cursor: grabbing` が付く
- ドロップ時にバウンスアニメーションで着地する

## 注意点

- `DragOverlay` は `DndContext` の**直接の子孫**に置くこと（深くネストしない）
- PointerSensor 使用時は `DragOverlay` 内の要素に `pointer-events: none` が自動付与される
- `onDragEnd` と `onDragCancel` の両方で `activeId` をリセットすること（片方を忘れるとオーバーレイが消えない）

## サンプル: app/lesson/03/page.tsx 全体

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'

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

type DraggableItemProps = { id: string; label: string }

function DraggableItem({ id, label }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #ddd',
        cursor: 'grab',
        opacity: isDragging ? 0.3 : 1, // ghost: サイズを保ちつつコンテンツを薄く
      }}
    >
      {label}
    </div>
  )
}

type OverlayCardProps = { label: string }

function OverlayCard({ label }: OverlayCardProps) {
  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #ddd',
        cursor: 'grabbing',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      {label}
    </div>
  )
}

type DroppableZoneProps = { id: string; label: string; children: React.ReactNode }

function DroppableZone({ id, label, children }: DroppableZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        minWidth: 160,
        minHeight: 120,
        padding: 12,
        background: isOver ? '#d0f0d0' : '#f0f0f0',
        borderRadius: 8,
        border: '2px dashed #ccc',
      }}
    >
      <h3 style={{ margin: '0 0 8px' }}>{label}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

export default function Page() {
  const [itemZones, setItemZones] = useState<Record<ItemId, ZoneId | null>>({
    'item-1': null,
    'item-2': null,
    'item-3': null,
  })
  const [activeId, setActiveId] = useState<ItemId | null>(null)

  const activeItem = activeId ? ITEMS.find(item => item.id === activeId) ?? null : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as ItemId)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over) return
    setItemZones(prev => ({ ...prev, [active.id]: over.id as ZoneId }))
  }

  const unassigned = ITEMS.filter(item => itemZones[item.id] === null)

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ display: 'flex', gap: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2>Items</h2>
          {unassigned.map(item => (
            <DraggableItem key={item.id} id={item.id} label={item.label} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {ZONES.map(zone => (
            <DroppableZone key={zone.id} id={zone.id} label={zone.label}>
              {ITEMS.filter(item => itemZones[item.id] === zone.id).map(item => (
                <DraggableItem key={item.id} id={item.id} label={item.label} />
              ))}
            </DroppableZone>
          ))}
        </div>
      </div>
      <DragOverlay
        dropAnimation={{
          duration: 300,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeItem ? <OverlayCard label={activeItem.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### ポイント解説

- `activeId` を `useState` で管理し、`onDragStart` でセット・`onDragEnd` / `onDragCancel` の両方でリセットする
- `useDraggable` 側は `transform` を適用せず `opacity` だけ変更（ghost として残す）
- `DragOverlay` はポータルに描画されるため、ドラッグ中に元要素の ghost とオーバーレイが共存する
- `dropAnimation` でバウンスアニメーションを設定する
