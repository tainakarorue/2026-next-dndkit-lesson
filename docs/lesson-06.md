# Lesson 06: モディファイア

## 目標

`@dnd-kit/modifiers` を使ってドラッグの動きに制約をかける。
軸制限・境界制限・スナップなどの制御を理解する。

## インストール

```bash
npm install @dnd-kit/modifiers
```

## 学習トピック

### 1. モディファイアとは

ドラッグ中の `transform`（移動量）を加工する関数。
`DndContext` か `DragOverlay` の `modifiers` プロップに配列で渡す。

```tsx
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

<DndContext modifiers={[restrictToVerticalAxis]}>
  ...
</DndContext>
```

複数指定した場合、**左から順に適用**される（パイプライン）。

### 2. 組み込みモディファイア一覧

| モディファイア | 効果 |
|---|---|
| `restrictToVerticalAxis` | Y 方向のみ移動可能（X を 0 に固定） |
| `restrictToHorizontalAxis` | X 方向のみ移動可能 |
| `restrictToWindowEdges` | ウィンドウ外に出ないよう制限 |
| `restrictToParentElement` | 親要素の境界内に制限 |
| `restrictToFirstScrollableAncestor` | 最初のスクロール可能祖先の境界内に制限 |
| `snapCenterToCursor` | ドラッグ要素の中心をカーソルに合わせる |

```tsx
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  snapCenterToCursor,
} from '@dnd-kit/modifiers';

// 縦方向制限 + ウィンドウ外に出ない
<DndContext modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>

// カーソルに中心を合わせる
<DragOverlay modifiers={[snapCenterToCursor]}>
```

### 3. カスタムモディファイア

モディファイアは `({ transform, ...args }) => transform` 形式の関数。

```tsx
import type { Modifier } from '@dnd-kit/core';

// 移動量を 1/2 に減衰させるモディファイア
const slowDownModifier: Modifier = ({ transform }) => ({
  ...transform,
  x: transform.x * 0.5,
  y: transform.y * 0.5,
});

// グリッドスナップ（20px 単位）
const createSnapToGrid = (gridSize: number): Modifier =>
  ({ transform }) => ({
    ...transform,
    x: Math.round(transform.x / gridSize) * gridSize,
    y: Math.round(transform.y / gridSize) * gridSize,
  });

<DndContext modifiers={[createSnapToGrid(20)]}>
```

### 4. DragOverlay にだけモディファイアを適用

`DndContext` のモディファイアはセンサーの座標変換にも影響するが、
`DragOverlay` のモディファイアはオーバーレイの表示位置だけに適用される。

```tsx
// センサーは制約なし、オーバーレイだけカーソル中心揃え
<DndContext>
  <DragOverlay modifiers={[snapCenterToCursor]}>
    ...
  </DragOverlay>
</DndContext>
```

## Step 構成（ページ内）

| Step | 内容 |
|---|---|
| Step 1 | `restrictToVerticalAxis` でソータブルリストの横ブレをなくす |
| Step 2 | `restrictToParentElement` でドラッグ範囲をコンテナ内に制限 |
| Step 3 | グリッドスナップモディファイアを実装し、自由配置キャンバスで試す |
| Step 4 | `snapCenterToCursor` を DragOverlay に適用して挙動を確認 |

## 完成イメージ

- Step 1: タスクリストをドラッグしても左右にブレない（縦移動のみ）
- Step 2: カードをドラッグしてもコンテナ外に出ない
- Step 3: 自由配置キャンバス上でカードが 20px グリッドにスナップしながら動く
- Step 4: ドラッグプレビューの中心がカーソルに吸い付くように動く

## 注意点

- `restrictToParentElement` はドラッグ要素の**親要素**を基準にする。
  `DragOverlay` と組み合わせる場合は期待通りに動かないケースがある
- モディファイアは `DndContext` の `modifiers` に渡すとコリジョン検出の座標にも影響する。
  表示だけ変えたい場合は `DragOverlay` の `modifiers` を使う
- カスタムモディファイアの `transform` は `{ x, y, scaleX, scaleY }` の形式

## サンプル: app/lesson/06/page.tsx 全体

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
  snapCenterToCursor,
} from '@dnd-kit/modifiers'
import {
  SortableContext,
  arrayMove,
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px 16px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 8,
        cursor: 'grab',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      {label}
    </div>
  )
}

type OverlayItemProps = { label: string }

function OverlayItem({ label }: OverlayItemProps) {
  return (
    <div
      style={{
        padding: '10px 16px',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: 8,
        cursor: 'grabbing',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        whiteSpace: 'nowrap',
      }}
    >
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
  )

  const activeItem = activeId ? items.find(item => item.id === activeId) ?? null : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return
    setItems(prev => {
      const oldIndex = prev.findIndex(item => item.id === active.id)
      const newIndex = prev.findIndex(item => item.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    // restrictToVerticalAxis: 横ブレなし / restrictToWindowEdges: ウィンドウ外に出ない
    <DndContext
      sensors={sensors}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ padding: '2rem', maxWidth: 400 }}>
        <h2>モディファイアデモ</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          縦方向のみ移動・ウィンドウ外に出ない・オーバーレイ中心がカーソルに追従
        </p>
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map(item => (
              <SortableItem key={item.id} id={item.id} label={item.label} />
            ))}
          </div>
        </SortableContext>
      </div>
      {/* DragOverlay にだけ snapCenterToCursor を適用 */}
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeItem ? <OverlayItem label={activeItem.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### ポイント解説

- `DndContext` の `modifiers` に `restrictToVerticalAxis` を渡すと横方向の移動が完全に抑制される
- `restrictToWindowEdges` をパイプラインに追加すると、ドラッグ要素がビューポート外に出なくなる
- `DragOverlay` の `modifiers` に `snapCenterToCursor` を適用すると、センサー座標には影響せず表示位置だけが中心揃えになる
