# Lesson 04: ソータブルリスト（縦方向）

## 目標

`@dnd-kit/sortable` を使い、縦方向のリストをドラッグで並び替える。
`arrayMove` による状態管理と `useSortable` の使い方を習得する。

## インストール

```bash
npm install @dnd-kit/sortable @dnd-kit/utilities
```

## 学習トピック

### 1. SortableContext

ソート可能なアイテム群を包むコンテキスト。
`items` に現在の順序を表す id 配列を渡す。

```tsx
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

;<DndContext onDragEnd={handleDragEnd}>
  <SortableContext
    items={items.map((item) => item.id)}
    strategy={verticalListSortingStrategy}
  >
    {items.map((item) => (
      <SortableItem key={item.id} id={item.id} label={item.label} />
    ))}
  </SortableContext>
</DndContext>
```

**ソートストラテジー:**

| ストラテジー                    | 用途                         |
| ------------------------------- | ---------------------------- |
| `verticalListSortingStrategy`   | 縦方向リスト                 |
| `horizontalListSortingStrategy` | 横方向リスト                 |
| `rectSortingStrategy`           | グリッド（Lesson 05 で扱う） |
| `rectSwappingStrategy`          | 位置を交換（ギャップなし）   |

### 2. useSortable

`useDraggable` + `useDroppable` を内包したソート専用フック。

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {label}
    </div>
  )
}
```

`useDraggable` との主な違い：

- `transition` が追加される（他のアイテムがスライドする際のアニメーション）
- `CSS.Transform.toString` を使う（`Translate` ではなく `Transform`）

### 3. arrayMove で状態を更新

```tsx
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return

  setItems((prev) => {
    const oldIndex = prev.findIndex((item) => item.id === active.id)
    const newIndex = prev.findIndex((item) => item.id === over.id)
    return arrayMove(prev, oldIndex, newIndex)
  })
}
```

`arrayMove(array, from, to)` は元の配列を変更せず新しい配列を返す。

### 4. ドラッグハンドルの分離

アイテム全体ではなく、特定のハンドル部分だけでドラッグしたい場合：

```tsx
function SortableItem({ id, label }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, ... } =
    useSortable({ id });

  return (
    <div ref={setNodeRef} style={style}>
      {/* ハンドル部分だけに listeners を付ける */}
      <span ref={setActivatorNodeRef} {...listeners} {...attributes}>
        ⠿
      </span>
      {label}
    </div>
  );
}
```

## Step 構成（ページ内）

| Step   | 内容                                                           |
| ------ | -------------------------------------------------------------- |
| Step 1 | 最小構成のソータブルリスト（アイテム全体をハンドルとして使用） |
| Step 2 | `transition` アニメーションの有無を比較                        |
| Step 3 | ドラッグハンドルアイコンを分離して実装                         |
| Step 4 | DragOverlay を組み合わせてプレビューを表示                     |

## 完成イメージ

- タスクカードが縦に並んでいる
- カード左端のハンドルアイコン（⠿）を掴んで並び替え可能
- ドラッグ中は元の場所が半透明になり、他のカードがスムーズにスライドする
- ドロップ後に順序が確定する

## 注意点

- `SortableContext` の `items` は必ず**現在の順序通りの id 配列**にする
- `CSS.Transform.toString` は `null` を受け取っても `undefined` を返さずに空文字を返す
- `transition` を `style` に含めないと、他アイテムのスライドアニメーションが起きない
- ドラッグ中に `isDragging` が `true` のアイテムには `transition: none` が自動的に設定される

## サンプル: app/lesson/04/page.tsx 全体

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
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
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 8,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        style={{ cursor: 'grab', color: '#999', fontSize: 18, lineHeight: 1 }}
      >
        ⠿
      </span>
      {label}
    </div>
  )
}

type OverlayItemProps = { label: string }

function OverlayItem({ label }: OverlayItemProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        cursor: 'grabbing',
      }}
    >
      <span style={{ color: '#999', fontSize: 18, lineHeight: 1 }}>⠿</span>
      {label}
    </div>
  )
}

export default function Page() {
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

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
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
    >
      <div style={{ padding: '2rem', maxWidth: 400 }}>
        <h2>タスクリスト</h2>
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
      <DragOverlay>
        {activeItem ? <OverlayItem label={activeItem.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### ポイント解説

- `setActivatorNodeRef` をハンドル要素（⠿）に渡すことで、アイテム全体ではなくハンドルだけでドラッグが開始される
- `CSS.Transform.toString` は `CSS.Translate.toString` ではなく `Transform` を使う（スケール情報も含む）
- `transition` を `style` に含めることで、他のアイテムがスムーズにスライドするアニメーションが有効になる
- `DragOverlay` と組み合わせる場合、`useSortable` 側は `isDragging` で `opacity` を下げるだけでよい
