# Lesson 02: センサーとイベント

## 目標

センサーによる入力デバイス対応と、ドラッグのライフサイクルイベントを理解する。

## インストール

```bash
npm install @dnd-kit/core  # Lesson 01 から継続
```

## 学習トピック

### 1. センサー（Sensors）

センサーはドラッグ操作を「どのように開始するか」を定義する抽象層。
`DndContext` の `sensors` プロップに配列で渡す。

```tsx
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

export default function Page() {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 }, // 8px 動かすまでドラッグ開始しない
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 }, // 200ms 長押し後に開始
    }),
    useSensor(KeyboardSensor),
  );

  return <DndContext sensors={sensors}>...</DndContext>;
}
```

**主要センサー:**

| センサー | トリガー | 主な activationConstraint |
|---|---|---|
| `MouseSensor` | マウスポインタ | `distance`（移動距離）/ `delay` |
| `TouchSensor` | タッチ | `delay`（長押し時間）/ `tolerance` |
| `KeyboardSensor` | Space / Enter キー | なし（即時） |
| `PointerSensor` | Pointer Events API（Mouse+Touch統合） | `distance` / `delay` |

#### activationConstraint の使い分け

- `distance`: スクロールとドラッグの誤操作防止に有効
- `delay + tolerance`: モバイルでのスクロール vs ドラッグ判定に有効

### 2. ドラッグライフサイクルイベント

```tsx
<DndContext
  onDragStart={({ active }) => {
    // ドラッグ開始時。active.id でどの要素か判別
  }}
  onDragMove={({ active, delta }) => {
    // ドラッグ中の移動ごとに発火。delta は移動量 { x, y }
  }}
  onDragOver={({ active, over }) => {
    // ドラッグアイテムが別のドロップ可能要素に乗ったとき
    // over が null になる場合もある（ドロップ先から外れたとき）
  }}
  onDragEnd={({ active, over }) => {
    // ドロップ完了。over が null のときはキャンセル扱い
  }}
  onDragCancel={({ active }) => {
    // Escape キー押下や、ドラッグ中断時
  }}
>
```

**イベント発火順序:**

```
onDragStart → (onDragMove × N) → (onDragOver × N) → onDragEnd or onDragCancel
```

### 3. DragStartEvent / DragEndEvent の型

```ts
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return; // ドロップ先なし
  console.log(`${active.id} → ${over.id}`);
}
```

## Step 構成（ページ内）

| Step | 内容 |
|---|---|
| Step 1 | デフォルトセンサーの挙動を確認（センサー未設定） |
| Step 2 | `MouseSensor` に `distance: 8` を設定し、誤操作を防ぐ |
| Step 3 | `TouchSensor` に `delay: 200` を追加してモバイル対応 |
| Step 4 | 各イベントをログに表示し、発火タイミングを可視化 |

## 完成イメージ

- ドラッグ操作ログパネルを画面下部に配置
- `onDragStart` / `onDragOver` / `onDragEnd` / `onDragCancel` のたびにログが追加される
- センサー設定を切り替えるトグルを用意し、挙動の違いを体感できる

## 注意点

- `PointerSensor` は `MouseSensor + TouchSensor` の統合版。シンプルな用途ではこちらで十分
- `KeyboardSensor` は `sortableKeyboardCoordinates` と組み合わせるとソータブルリストでの矢印キー移動が可能になる（Lesson 04 で扱う）
- `onDragMove` は発火頻度が非常に高い。重い処理は入れないこと

## サンプル: app/lesson/02/page.tsx 全体

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
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

export default function Page() {
  const [itemZones, setItemZones] = useState<Record<ItemId, ZoneId | null>>({
    'item-1': null,
    'item-2': null,
    'item-3': null,
  })
  const [logs, setLogs] = useState<LogEntry[]>([])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function addLog(entry: LogEntry) {
    setLogs(prev => [entry, ...prev].slice(0, 10))
  }

  function handleDragStart({ active }: DragStartEvent) {
    addLog({ event: 'onDragStart', detail: `${active.id}` })
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    addLog({ event: 'onDragOver', detail: `${active.id} → ${over?.id ?? 'null'}` })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    addLog({ event: 'onDragEnd', detail: `${active.id} → ${over?.id ?? 'null'}` })
    if (!over) return
    setItemZones(prev => ({ ...prev, [active.id]: over.id as ZoneId }))
  }

  function handleDragCancel({ active }: DragCancelEvent) {
    addLog({ event: 'onDragCancel', detail: `${active.id}` })
  }

  const unassigned = ITEMS.filter(item => itemZones[item.id] === null)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
            <DroppableZone key={zone.id} id={zone.id}>
              <h3>{zone.label}</h3>
              {ITEMS.filter(item => itemZones[item.id] === zone.id).map(item => (
                <DraggableItem key={item.id} id={item.id} label={item.label} />
              ))}
            </DroppableZone>
          ))}
        </div>
        <div style={{ width: 280 }}>
          <h2>イベントログ</h2>
          <ul style={{ fontSize: 12, listStyle: 'none', padding: 0, margin: 0 }}>
            {logs.map((log, i) => (
              <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                <strong>{log.event}</strong>: {log.detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DndContext>
  )
}
```

### ポイント解説

- `useSensors` + `useSensor` でセンサーを組み合わせ、`DndContext` の `sensors` プロップに渡す
- 各イベントハンドラに `DragStartEvent` / `DragOverEvent` / `DragEndEvent` / `DragCancelEvent` の型を付与する
- ログパネルで各イベントの発火タイミングと `active.id` / `over.id` を可視化する
