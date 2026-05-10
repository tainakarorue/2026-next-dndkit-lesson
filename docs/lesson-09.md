# Lesson 09: アクセシビリティ

## 目標

キーボードだけでドラッグ＆ドロップを操作できるようにする。
スクリーンリーダーへの ARIA アナウンスを適切に設定する。

## インストール

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

## 学習トピック

### 1. キーボードセンサーの設定

`KeyboardSensor` を有効にするだけで基本的なキーボード操作に対応する。

```tsx
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

export default function Page() {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates, // ソータブルリスト向けの座標計算
    }),
  )

  return <DndContext sensors={sensors}>{/* ... */}</DndContext>
}
```

**キーボード操作のデフォルト動作:**

| キー              | 動作                               |
| ----------------- | ---------------------------------- |
| `Space` / `Enter` | ドラッグ開始 / ドロップ            |
| `↑` `↓` `←` `→`   | ドラッグ中の移動                   |
| `Escape`          | ドラッグキャンセル                 |
| `Tab`             | フォーカス移動（ドラッグ中は無効） |

`sortableKeyboardCoordinates` を使うと矢印キーで隣のアイテムへ移動できる。

### 2. ARIA 属性（useDraggable が自動付与）

`useDraggable` の `attributes` には以下が含まれる：

```html
role="button" tabIndex="0" aria-disabled="false" aria-pressed="false"
<!-- ドラッグ中は true -->
aria-roledescription="draggable" aria-describedby="dnd-live-region"
<!-- スクリーンリーダー向けの説明要素 -->
```

これらは `{...attributes}` で自動的に DOM に付与される。

### 3. スクリーンリーダーへのアナウンス

`DndContext` の `accessibility` プロップで、各イベント時の読み上げ文言を設定する。

```tsx
<DndContext
  accessibility={{
    announcements: {
      onDragStart({ active }) {
        return `${active.id} をドラッグ開始しました。矢印キーで移動、Space でドロップ、Escape でキャンセルできます。`;
      },
      onDragOver({ active, over }) {
        if (over) {
          return `${active.id} を ${over.id} の上に移動しました。`;
        }
        return `${active.id} はドロップ可能な場所の外にあります。`;
      },
      onDragEnd({ active, over }) {
        if (over) {
          return `${active.id} を ${over.id} にドロップしました。`;
        }
        return `ドロップをキャンセルしました。${active.id} は元の位置に戻りました。`;
      },
      onDragCancel({ active }) {
        return `ドラッグをキャンセルしました。${active.id} は元の位置に戻りました。`;
      },
    },
    screenReaderInstructions: {
      draggable: 'このアイテムはドラッグ可能です。Space または Enter でドラッグを開始してください。',
    },
  }}
>
```

### 4. フォーカス管理

`useDraggable` はドロップ後に元の要素にフォーカスを戻す。
カスタムのフォーカス復元が必要な場合：

```tsx
const { attributes } = useDraggable({
  id,
  attributes: {
    roleDescription: 'ソート可能なアイテム',
  },
})
```

### 5. ハイコントラスト・視覚的フィードバック

キーボードユーザー向けに明確なフォーカスリングを維持する。

```css
/* outline を消さない */
[role='button']:focus-visible {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* ドラッグ中の視覚的状態 */
[aria-pressed='true'] {
  background: #e3f2fd;
  box-shadow: 0 0 0 2px #0066cc;
}
```

## Step 構成（ページ内）

| Step   | 内容                                                      |
| ------ | --------------------------------------------------------- |
| Step 1 | `KeyboardSensor` を追加してキーボード操作を確認           |
| Step 2 | 日本語の ARIA アナウンス文言を設定                        |
| Step 3 | フォーカスリングのスタイルを整備                          |
| Step 4 | スクリーンリーダー（NVDA / JAWS）でのアナウンス内容を確認 |

## 完成イメージ

- Tab でアイテムにフォーカス → Space でドラッグ開始
- 矢印キーで順番を変更 → Space でドロップ
- 操作ごとにスクリーンリーダーが自然な日本語でアナウンス
- フォーカスリングが常に明確に表示される

## 注意点

- `sortableKeyboardCoordinates` は `SortableContext` 内でのみ正しく動作する
- `accessibility.announcements` の各関数は**文字列を返す**必要がある（JSX 不可）
- `role="button"` が自動付与されるため、`<button>` タグで包むと `role` が重複する。
  `<div>` または `<li>` に `useDraggable` を使うのが自然
- iOS VoiceOver は `aria-pressed` の読み上げが不安定なため、実機テストが必要

## サンプル: app/lesson/09/page.tsx 全体

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
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
        padding: '12px 16px',
        background: isDragging ? '#e3f2fd' : '#fff',
        border: `2px solid ${isDragging ? '#0066cc' : '#ddd'}`,
        borderRadius: 8,
        cursor: 'grab',
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {label}
    </div>
  )
}

export default function Page() {
  const [items, setItems] = useState<Item[]>(initialItems)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd({ active, over }: DragEndEvent) {
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
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            return `${active.id} をドラッグ開始しました。矢印キーで移動、Space でドロップ、Escape でキャンセルできます。`
          },
          onDragOver({ active, over }) {
            if (over) {
              return `${active.id} を ${over.id} の上に移動しました。`
            }
            return `${active.id} はドロップ可能な場所の外にあります。`
          },
          onDragEnd({ active, over }) {
            if (over) {
              return `${active.id} を ${over.id} にドロップしました。`
            }
            return `ドロップをキャンセルしました。${active.id} は元の位置に戻りました。`
          },
          onDragCancel({ active }) {
            return `ドラッグをキャンセルしました。${active.id} は元の位置に戻りました。`
          },
        },
        screenReaderInstructions: {
          draggable:
            'このアイテムはドラッグ可能です。Space または Enter でドラッグを開始してください。',
        },
      }}
    >
      <div style={{ padding: '2rem', maxWidth: 400 }}>
        <h2>アクセシブルなソータブルリスト</h2>
        <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          Tab でフォーカス → Space でドラッグ開始 → ↑↓ で移動 → Space でドロップ
        </p>
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
    </DndContext>
  )
}
```

### ポイント解説

- `KeyboardSensor` + `sortableKeyboardCoordinates` を追加するだけでキーボード操作が有効になる
- `accessibility.announcements` の各関数は必ず**文字列を返す**（JSX は使えない）
- ドラッグ中のアイテムに `border` や `background` の変化を付けることでキーボードユーザーへの視覚的フィードバックを提供する
- `aria-pressed="true"` が自動付与されるため、CSS セレクタ `[aria-pressed="true"]` でドラッグ中スタイルを指定することもできる
