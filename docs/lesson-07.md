# Lesson 07: コリジョン検出

## 目標

ドラッグしたアイテムが「どのドロップ先に重なっているか」を判定するアルゴリズムを理解する。
組み込み戦略の違いとカスタム実装を学ぶ。

## インストール

```bash
npm install @dnd-kit/core
```

## 学習トピック

### 1. コリジョン検出とは

`DndContext` の `collisionDetection` プロップに渡す関数で、
「ドラッグ中のアイテムがどのドロップ可能要素と衝突しているか」を決定する。

```tsx
import { closestCenter } from '@dnd-kit/core';

<DndContext collisionDetection={closestCenter}>
  ...
</DndContext>
```

### 2. 組み込みコリジョン戦略

#### closestCenter（デフォルト）

ドラッグ要素の中心から最も近いドロップ先の中心を選ぶ。
ソータブルリストに最適。

```
ドラッグ要素中心 → 最近接ドロップ先中心
```

#### closestCorners

ドラッグ要素の 4 隅から最も近いドロップ先を選ぶ。
グリッドやカンバンボードで直感的な動作になりやすい。

#### rectIntersection

重なっている面積が最大のドロップ先を選ぶ。
厳密に「重なっている」必要があるため、小さいドロップ先への投げ込みには不向き。

#### pointerWithin

カーソル位置が内側にある最前面のドロップ先を選ぶ。
ネストしたドロップゾーンで内側を優先したいときに有効。

```tsx
import {
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
} from '@dnd-kit/core';
```

**戦略の選び方:**

| シナリオ | 推奨 |
|---|---|
| 縦 / 横ソータブルリスト | `closestCenter` |
| グリッド並び替え | `closestCenter` or `closestCorners` |
| カンバンボード（コンテナ間移動） | `closestCorners` |
| ネストしたドロップゾーン | `pointerWithin` |
| 大きなドロップゾーン同士 | `rectIntersection` |

### 3. カスタムコリジョン検出

```tsx
import type { CollisionDetection } from '@dnd-kit/core';
import { closestCenter, pointerWithin, rectIntersection } from '@dnd-kit/core';

// カンバンボード向けカスタム戦略の例:
// 1. まずカーソル位置のコンテナを検索
// 2. 見つかればコンテナ内アイテムで closestCenter
// 3. 見つからなければ全体で closestCenter
const customCollision: CollisionDetection = (args) => {
  // コンテナ（id が 'container-' で始まる）だけ候補にして pointerWithin を試す
  const containerCollisions = pointerWithin({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      ({ id }) => String(id).startsWith('container-')
    ),
  });

  if (containerCollisions.length > 0) {
    return containerCollisions;
  }

  // コンテナにヒットしなければ全要素で closestCenter
  return closestCenter(args);
};
```

### 4. コリジョン結果の構造

`collisionDetection` 関数は `Collision[]` を返す。
各 `Collision` は `{ id, data }` の形式で、先頭が「最も衝突している」ドロップ先。

## Step 構成（ページ内）

| Step | 内容 |
|---|---|
| Step 1 | 4 つの戦略を切り替えて挙動の違いを視覚的に比較するデモ |
| Step 2 | ネストしたドロップゾーンで `pointerWithin` vs `closestCenter` を比較 |
| Step 3 | カンバン用カスタムコリジョンを実装して試す |

## 完成イメージ

- 画面に複数のドロップゾーンが配置されている
- ドロップ戦略をセレクトボックスで切り替えられる
- ドラッグ中に「現在の判定先」がハイライトされリアルタイムで可視化される
- 各戦略で判定先がどう変わるか体感できる

## 注意点

- `SortableContext` はデフォルトで `closestCenter` を期待している。
  `rectIntersection` に変えるとソートが不安定になることがある
- `pointerWithin` はカーソル情報が必要なため、キーボードドラッグでは動作しない
- カスタム戦略では `droppableContainers` が全登録ドロップ先を含む点を意識すること

## サンプル: app/lesson/07/page.tsx 全体

```tsx
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

type StrategyKey = 'closestCenter' | 'closestCorners' | 'rectIntersection' | 'pointerWithin'

const STRATEGIES: Record<StrategyKey, CollisionDetection> = {
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin,
}

type Zone = { id: string; label: string; x: number; y: number; width: number; height: number }

const ZONES: Zone[] = [
  { id: 'zone-small', label: '小ゾーン', x: 200, y: 80,  width: 80,  height: 80  },
  { id: 'zone-large', label: '大ゾーン', x: 360, y: 60,  width: 200, height: 160 },
  { id: 'zone-tall',  label: '縦長',    x: 600, y: 40,  width: 80,  height: 220 },
]

type DroppableBoxProps = Zone & { isOver: boolean }

function DroppableBox({ id, label, x, y, width, height, isOver }: DroppableBoxProps) {
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
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'drag-card' })
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
    setOverId(over?.id as string ?? null)
  }

  function handleDragEnd({ over }: DragEndEvent) {
    setDroppedZone(over?.id as string ?? null)
    setOverId(null)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h2>コリジョン検出デモ</h2>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {(Object.keys(STRATEGIES) as StrategyKey[]).map(key => (
          <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              type="radio"
              name="strategy"
              value={key}
              checked={strategy === key}
              onChange={() => { setStrategy(key); setDroppedZone(null) }}
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
          {ZONES.map(zone => (
            <DroppableBox key={zone.id} {...zone} isOver={overId === zone.id} />
          ))}
          <DraggableCard />
        </div>
      </DndContext>
    </div>
  )
}
```

### ポイント解説

- `collisionDetection` プロップに `STRATEGIES[strategy]` を渡すことで、ラジオボタンで戦略をリアルタイムに切り替えられる
- `onDragOver` で `overId` を更新してドロップ先のハイライトを即時反映する
- 同じカードを各ゾーンの端や重なり部分でドラッグすると、戦略によって判定先が変わることを体感できる
