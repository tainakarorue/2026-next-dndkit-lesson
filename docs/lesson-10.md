# Lesson 10: カンバンボード（応用）

## 目標

Lesson 01〜09 で学んだすべての要素を組み合わせ、実用的なカンバンボードを完成させる。
DragOverlay / 複数コンテナ / カスタムコリジョン / アクセシビリティを統合する。

## インストール

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities
```

## 完成機能一覧

| 機能 | 使用技術 |
|---|---|
| カード並び替え（同列内） | `useSortable` + `arrayMove` |
| カード移動（列間） | `onDragOver` + `SortableContext` |
| ドラッグプレビュー | `DragOverlay` |
| 空列へのドロップ | `useDroppable` |
| コリジョン最適化 | カスタム `collisionDetection` |
| 縦方向制限（オーバーレイ） | `restrictToWindowEdges` |
| キーボード操作 | `KeyboardSensor` + `sortableKeyboardCoordinates` |
| アクセシビリティ | ARIA アナウンス（日本語） |

## アーキテクチャ

### ファイル構成

```
app/lesson/10/
├── page.tsx                  # メインページ（DndContext 配置）
├── components/
│   ├── KanbanBoard.tsx       # ボード全体（列の並びと状態管理）
│   ├── KanbanColumn.tsx      # 1 列（SortableContext + useDroppable）
│   ├── KanbanCard.tsx        # ソート可能なカード（useSortable）
│   └── CardOverlay.tsx       # DragOverlay 用コンポーネント
└── types.ts                  # 型定義
```

### 型定義

```ts
// types.ts
export type CardId = string;
export type ColumnId = string;

export type Card = {
  id: CardId;
  title: string;
  description?: string;
  label?: 'red' | 'yellow' | 'green' | 'blue';
};

export type Column = {
  id: ColumnId;
  title: string;
  cardIds: CardId[];
};

export type BoardState = {
  cards: Record<CardId, Card>;
  columns: Column[];
};
```

### 状態管理

```tsx
// KanbanBoard.tsx（抜粋）
const [board, setBoard] = useState<BoardState>(initialBoard);
const [activeCardId, setActiveCardId] = useState<CardId | null>(null);

const activeCard = activeCardId ? board.cards[activeCardId] : null;

// ヘルパー: カード ID からカラム ID を逆引き
function findColumnByCardId(cardId: CardId): Column | undefined {
  return board.columns.find((col) => col.cardIds.includes(cardId));
}
```

### カスタムコリジョン検出

```tsx
import { closestCorners, pointerWithin, rectIntersection } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';

const kanbanCollision: CollisionDetection = (args) => {
  // 1. カーソルがコンテナ（列）の内側にあれば優先
  const pointerCollisions = pointerWithin({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      ({ id }) => board.columns.some((col) => col.id === id)
    ),
  });
  if (pointerCollisions.length > 0) return pointerCollisions;

  // 2. カード同士の接近を判定
  return closestCorners(args);
};
```

## Step 構成（ページ内）

| Step | 内容 |
|---|---|
| Step 1 | 同列内のカード並び替えのみ |
| Step 2 | 列間移動 + 空列ドロップ対応 |
| Step 3 | DragOverlay でドラッグプレビューを追加 |
| Step 4 | カスタムコリジョン + モディファイアを適用 |
| Step 5 | キーボード操作 + ARIA アナウンスで完成 |

## 実装の注意点

### onDragOver と onDragEnd の役割分担

```
onDragOver  → コンテナ間移動のプレビュー（即時反映）
onDragEnd   → 同一コンテナ内の最終順序確定
```

`onDragOver` で先にカードを移動済みにしているため、
`onDragEnd` では**コンテナが変わっていないケース**だけ `arrayMove` を実行すれば良い。

### ドラッグ中の状態リセット

```tsx
// onDragEnd と onDragCancel の両方で必ずリセット
const handleDragEnd = (event: DragEndEvent) => {
  setActiveCardId(null);
  // ... 並び替え処理
};

const handleDragCancel = () => {
  setActiveCardId(null);
};
```

### パフォーマンス

- `onDragOver` 内の `setBoard` 呼び出しは条件分岐で最小化する
- `useMemo` で `columnIds` や `cardIds` の変換をメモ化する
- カードコンポーネントは `memo()` でラップするとドラッグ中の再レンダリングを減らせる

## 拡張アイデア（レッスン後の課題）

- カードの追加・削除・編集
- 列の追加・削除・名前変更
- `localStorage` への永続化
- ドラッグ中に新しい列を作れる「+ 列を追加」ゾーン
- カードの色ラベルによるフィルタリング
- タッチデバイス専用の長押しメニュー

## 完成イメージ

3〜4 列のカンバンボードで以下がすべて動作する：
- マウス・タッチ・キーボードでカードを並び替え・移動
- ドラッグ中は影付きプレビューがカーソルに追従
- スクリーンリーダーが操作を日本語でアナウンス
- 空の列にもスムーズにドロップできる

## サンプル: app/lesson/10/page.tsx 全体

```tsx
'use client'

import { memo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'

// --- 型定義 ---
type CardId = string
type ColumnId = string

type Card = {
  id: CardId
  title: string
  label?: 'red' | 'yellow' | 'green' | 'blue'
}

type Column = {
  id: ColumnId
  title: string
  cardIds: CardId[]
}

type BoardState = {
  cards: Record<CardId, Card>
  columns: Column[]
}

// --- 初期データ ---
const initialBoard: BoardState = {
  cards: {
    'card-1': { id: 'card-1', title: 'ユーザー認証の実装', label: 'red' },
    'card-2': { id: 'card-2', title: 'API エンドポイントの設計', label: 'blue' },
    'card-3': { id: 'card-3', title: 'UI コンポーネントの作成', label: 'green' },
    'card-4': { id: 'card-4', title: 'テストの作成', label: 'yellow' },
    'card-5': { id: 'card-5', title: 'デプロイ設定', label: 'blue' },
  },
  columns: [
    { id: 'todo',        title: 'TODO',  cardIds: ['card-1', 'card-2'] },
    { id: 'in-progress', title: '進行中', cardIds: ['card-3'] },
    { id: 'done',        title: '完了',   cardIds: ['card-4', 'card-5'] },
  ],
}

const LABEL_COLORS: Record<string, string> = {
  red: '#ffd6d6', yellow: '#fffbd6', green: '#d6ffd6', blue: '#d6f0ff',
}

// --- カードコンポーネント ---
type KanbanCardProps = { id: CardId; card: Card }

const KanbanCard = memo(function KanbanCard({ id, card }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '10px 12px',
        background: card.label ? LABEL_COLORS[card.label] : '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grab',
        fontSize: 13,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
    >
      {card.title}
    </div>
  )
})

// --- オーバーレイカード ---
type CardOverlayProps = { card: Card }

function CardOverlay({ card }: CardOverlayProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: card.label ? LABEL_COLORS[card.label] : '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grabbing',
        fontSize: 13,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      {card.title}
    </div>
  )
}

// --- カラムコンポーネント ---
type KanbanColumnProps = { column: Column; cards: Record<CardId, Card> }

function KanbanColumn({ column, cards }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        width: 240,
        minHeight: 400,
        background: isOver ? '#e8f4ff' : '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        border: '1px solid #e0e0e0',
        transition: 'background 0.1s',
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>{column.title}</h3>
      <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {column.cardIds.map(id => (
            <KanbanCard key={id} id={id} card={cards[id]} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// --- カスタムコリジョン検出 ---
function createKanbanCollision(columns: Column[]): CollisionDetection {
  return (args) => {
    const columnCollisions = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter(
        ({ id }) => columns.some(col => col.id === id)
      ),
    })
    if (columnCollisions.length > 0) return columnCollisions
    return closestCorners(args)
  }
}

// --- メインページ ---
export default function Page() {
  const [board, setBoard] = useState<BoardState>(initialBoard)
  const [activeCardId, setActiveCardId] = useState<CardId | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const collisionDetection = createKanbanCollision(board.columns)

  function findColumnByCardId(cardId: CardId): Column | undefined {
    return board.columns.find(col => col.cardIds.includes(cardId))
  }

  function findColumnById(columnId: ColumnId): Column | undefined {
    return board.columns.find(col => col.id === columnId)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveCardId(active.id as CardId)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const activeId = active.id as CardId
    const overId = over.id as string
    const activeCol = findColumnByCardId(activeId)
    const overCol = findColumnByCardId(overId) ?? findColumnById(overId)
    if (!activeCol || !overCol || activeCol.id === overCol.id) return

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(col => {
        if (col.id === activeCol.id) {
          return { ...col, cardIds: col.cardIds.filter(id => id !== activeId) }
        }
        if (col.id === overCol.id) {
          const overIndex = col.cardIds.indexOf(overId)
          const newIndex = overIndex >= 0 ? overIndex : col.cardIds.length
          const newIds = [...col.cardIds]
          newIds.splice(newIndex, 0, activeId)
          return { ...col, cardIds: newIds }
        }
        return col
      }),
    }))
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCardId(null)
    if (!over || active.id === over.id) return
    const activeId = active.id as CardId
    const overId = over.id as string
    const col = findColumnByCardId(activeId)
    if (!col) return

    setBoard(prev => ({
      ...prev,
      columns: prev.columns.map(c => {
        if (c.id !== col.id) return c
        const oldIndex = c.cardIds.indexOf(activeId)
        const newIndex = c.cardIds.indexOf(overId)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return c
        return { ...c, cardIds: arrayMove(c.cardIds, oldIndex, newIndex) }
      }),
    }))
  }

  const activeCard = activeCardId ? board.cards[activeCardId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCardId(null)}
      accessibility={{
        announcements: {
          onDragStart({ active }) {
            return `${board.cards[active.id as string]?.title ?? active.id} をドラッグ開始しました。`
          },
          onDragOver({ active, over }) {
            if (over) return `${active.id} を ${over.id} の上に移動しました。`
            return `${active.id} はドロップ可能な場所の外にあります。`
          },
          onDragEnd({ active, over }) {
            if (over) return `${active.id} を ${over.id} にドロップしました。`
            return `ドロップをキャンセルしました。`
          },
          onDragCancel({ active }) {
            return `ドラッグをキャンセルしました。${active.id} は元の位置に戻りました。`
          },
        },
      }}
    >
      <div style={{ padding: '2rem' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>カンバンボード</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {board.columns.map(column => (
            <KanbanColumn key={column.id} column={column} cards={board.cards} />
          ))}
        </div>
      </div>
      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {activeCard ? <CardOverlay card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### ポイント解説

- `memo()` でカードコンポーネントをラップし、ドラッグ中の不要な再レンダリングを抑制する
- カスタムコリジョン検出で `pointerWithin`（列判定）→ `closestCorners`（カード判定）の 2 段階フォールバックを実装する
- `DragOverlay` に `restrictToWindowEdges` を適用してオーバーレイがビューポート外に出ないようにする
- `onDragOver` と `onDragEnd` の役割を分離：前者はコンテナ間移動、後者は同列内の順序確定
