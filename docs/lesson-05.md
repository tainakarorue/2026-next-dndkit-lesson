# Lesson 05: ソータブルグリッド

## 目標

`rectSortingStrategy` を使い、グリッドレイアウト内でカードを並び替える。
縦リストとの戦略の違いと、グリッド特有のレイアウト管理を学ぶ。

## インストール

```bash
npm install @dnd-kit/sortable @dnd-kit/utilities
```

## 学習トピック

### 1. rectSortingStrategy

グリッド（2D）配置に対応したソートストラテジー。
要素の矩形（rect）情報をもとにドロップ先を判定する。

```tsx
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'

;<SortableContext items={ids} strategy={rectSortingStrategy}>
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
    }}
  >
    {items.map((item) => (
      <SortableGridItem key={item.id} id={item.id} />
    ))}
  </div>
</SortableContext>
```

縦リストと違い、**グリッドのラッパーに CSS Grid を設定するだけ**で 2D 並び替えに対応できる。

### 2. SortableGridItem コンポーネント

`useSortable` の使い方は縦リストと同じ。
グリッドセルのサイズを固定しておくと見た目が安定する。

```tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type SortableGridItemProps = { id: string }

function SortableGridItem({ id }: SortableGridItemProps) {
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
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        aspectRatio: '1 / 1', // 正方形
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
      {...listeners}
      {...attributes}
    >
      {id}
    </div>
  )
}
```

### 3. DragOverlay との組み合わせ

グリッドでは DragOverlay を使わないと、ドラッグ中にグリッドが崩れる場合がある。
元のセルを `visibility: hidden` にして見た目のサイズを保つ。

```tsx
function SortableGridItem({ id }: SortableGridItemProps) {
  const { ..., isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        visibility: isDragging ? 'hidden' : 'visible',  // サイズは残してコンテンツを隠す
      }}
      {...listeners}
      {...attributes}
    >
      {id}
    </div>
  );
}
```

### 4. レスポンシブグリッド

CSS Grid の `auto-fill` / `auto-fit` と組み合わせても動作する。

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}
```

## Step 構成（ページ内）

| Step   | 内容                                                             |
| ------ | ---------------------------------------------------------------- |
| Step 1 | 固定 3 列グリッドでの並び替え                                    |
| Step 2 | DragOverlay を追加してドラッグ中の表示を改善                     |
| Step 3 | グリッドの列数をコントロールで変更し、ストラテジーへの影響を確認 |
| Step 4 | レスポンシブ（`auto-fill`）グリッドで動作確認                    |

## 完成イメージ

- 画像カード（またはカラーカード）が 3 列グリッドで並んでいる
- ドラッグすると他のカードがスムーズに動いて空きスペースを作る
- ドラッグ中は元の位置に薄い「穴」が見える
- DragOverlay で浮かんでいるカードが影付きで表示される

## 注意点

- `rectSortingStrategy` は要素の実際の座標（getBoundingClientRect）を参照するため、
  CSS の `transform` 以外でレイアウトを変えると誤動作する可能性がある
- グリッドセルのサイズが全て同じである必要はないが、異なる場合はドロップ判定がずれやすい
- `rectSwappingStrategy` も試してみると良い（ギャップなしに隣と入れ替わる挙動）

## サンプル: app/lesson/05/page.tsx 全体

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
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Item = { id: string; color: string }

const COLORS = [
  '#ffd6d6',
  '#ffecd6',
  '#fffbd6',
  '#d6ffd6',
  '#d6f0ff',
  '#e8d6ff',
  '#ffd6f0',
  '#d6fff0',
  '#f0f0f0',
]

const initialItems: Item[] = COLORS.map((color, i) => ({
  id: `item-${i + 1}`,
  color,
}))

type SortableGridItemProps = { id: string; color: string }

function SortableGridItem({ id, color }: SortableGridItemProps) {
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
        aspectRatio: '1 / 1',
        background: color,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'grab',
        transform: CSS.Transform.toString(transform),
        transition,
        visibility: isDragging ? 'hidden' : 'visible', // サイズを保ちつつ ghost を消す
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {id}
    </div>
  )
}

type OverlayItemProps = { id: string; color: string }

function OverlayItem({ id, color }: OverlayItemProps) {
  return (
    <div
      style={{
        aspectRatio: '1 / 1',
        background: color,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'grabbing',
        boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
      }}
    >
      {id}
    </div>
  )
}

export default function Page() {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
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
      <div style={{ padding: '2rem' }}>
        <h2>グリッド並び替え</h2>
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 120px)',
              gap: 16,
            }}
          >
            {items.map((item) => (
              <SortableGridItem key={item.id} id={item.id} color={item.color} />
            ))}
          </div>
        </SortableContext>
      </div>
      <DragOverlay>
        {activeItem ? (
          <OverlayItem id={activeItem.id} color={activeItem.color} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### ポイント解説

- `rectSortingStrategy` を使うと CSS Grid の行・列をまたいだ並び替えが可能になる
- `visibility: 'hidden'` を使うと元の場所のサイズが保たれ、グリッドレイアウトが崩れない（`opacity: 0` と異なりクリックも無効になる）
- `DragOverlay` でドラッグ中のプレビューを別レイヤーに描画し、グリッドの gap を保持する
