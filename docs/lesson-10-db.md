# Lesson 10 補足: DB 永続化パターン

DnD Kit で実装した UI の並び順・カード位置・テーブル行順をデータベースに保存する際のパターンをまとめる。

## 共通設計方針

ドラッグ操作の結果を `position` カラム（整数）で管理する。
ドラッグ中は UI のみ更新し、`onDragEnd` 確定後に DB へ一括送信する。

```
┌──────┬─────────────┬──────────┐
│  id  │    title    │ position │
├──────┼─────────────┼──────────┤
│ a    │ タスク A    │    0     │
│ b    │ タスク B    │    1     │
│ c    │ タスク C    │    2     │
└──────┴─────────────┴──────────┘
```

---

## 1. ソータブルリスト (Sortable List)

縦並びリストの行順を保存するケース（Lesson 04〜06 の応用）。

### Prisma スキーマ

```prisma
model SortableItem {
  id       String @id @default(cuid())
  label    String
  position Int

  @@index([position])
}
```

### Drizzle スキーマ (PostgreSQL)

```ts
import { pgTable, text, integer, index } from 'drizzle-orm/pg-core'

export const sortableItems = pgTable(
  'sortable_items',
  {
    id:       text('id').primaryKey(),
    label:    text('label').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [index('sortable_items_position_idx').on(table.position)],
)
```

### TypeScript 型定義

```ts
// DB から取得した行の型
export type SortableItemRow = {
  id: string
  label: string
  position: number
}

// 並び替え保存に渡す型（id と position のみ）
export type SaveOrderInput = { id: string; position: number }[]
```

### DB 操作関数

```ts
// --- Prisma 版 ---
export async function saveSortOrder(items: SaveOrderInput) {
  await prisma.$transaction(
    items.map(({ id, position }) =>
      prisma.sortableItem.update({ where: { id }, data: { position } }),
    ),
  )
}

// --- Drizzle 版 ---
import { eq } from 'drizzle-orm'

export async function saveSortOrder(items: SaveOrderInput) {
  await db.transaction(async (tx) => {
    for (const { id, position } of items) {
      await tx
        .update(sortableItems)
        .set({ position })
        .where(eq(sortableItems.id, id))
    }
  })
}
```

---

## 2. カンバンカード (Kanban Card)

列 (Column) をまたいで移動するカードを保存するケース（Lesson 10 の応用）。

### Prisma スキーマ

```prisma
model KanbanColumn {
  id       String       @id @default(cuid())
  title    String
  position Int
  cards    KanbanCard[]

  @@index([position])
}

model KanbanCard {
  id       String       @id @default(cuid())
  title    String
  label    String?      // 'red' | 'yellow' | 'green' | 'blue'
  position Int
  column   KanbanColumn @relation(fields: [columnId], references: [id], onDelete: Cascade)
  columnId String

  @@index([columnId, position])
}
```

### Drizzle スキーマ (PostgreSQL)

```ts
import { pgTable, text, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const kanbanColumns = pgTable(
  'kanban_columns',
  {
    id:       text('id').primaryKey(),
    title:    text('title').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [index('kanban_columns_position_idx').on(table.position)],
)

export const kanbanCards = pgTable(
  'kanban_cards',
  {
    id:       text('id').primaryKey(),
    title:    text('title').notNull(),
    label:    text('label'),
    position: integer('position').notNull(),
    columnId: text('column_id')
      .notNull()
      .references(() => kanbanColumns.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('kanban_cards_column_position_idx').on(table.columnId, table.position),
  ],
)

export const kanbanColumnsRelations = relations(kanbanColumns, ({ many }) => ({
  cards: many(kanbanCards),
}))

export const kanbanCardsRelations = relations(kanbanCards, ({ one }) => ({
  column: one(kanbanColumns, {
    fields: [kanbanCards.columnId],
    references: [kanbanColumns.id],
  }),
}))
```

### TypeScript 型定義

```ts
// DB から取得した行の型
export type KanbanColumnRow = {
  id: string
  title: string
  position: number
}

export type KanbanCardRow = {
  id: string
  title: string
  label: string | null
  position: number
  columnId: string
}

// カード 1 枚を移動する（列間 or 列内）
export type MoveCardInput = {
  cardId: string
  toColumnId: string
  position: number
}

// ボード全体を一括保存する
export type SaveBoardInput = {
  columns: Array<{
    id: string
    position: number
    cards: Array<{
      id: string
      position: number
      columnId: string
    }>
  }>
}
```

### DB 操作関数

```ts
// --- Prisma 版 --- カード 1 枚移動
export async function moveCard({ cardId, toColumnId, position }: MoveCardInput) {
  await prisma.kanbanCard.update({
    where: { id: cardId },
    data: { columnId: toColumnId, position },
  })
}

// --- Prisma 版 --- ボード全体保存
export async function saveBoard({ columns }: SaveBoardInput) {
  await prisma.$transaction(
    columns.flatMap(({ id: columnId, position: columnPosition, cards }) => [
      prisma.kanbanColumn.update({
        where: { id: columnId },
        data: { position: columnPosition },
      }),
      ...cards.map(({ id, position }) =>
        prisma.kanbanCard.update({
          where: { id },
          data: { columnId, position },
        }),
      ),
    ]),
  )
}

// --- Drizzle 版 --- ボード全体保存
import { eq } from 'drizzle-orm'

export async function saveBoard({ columns }: SaveBoardInput) {
  await db.transaction(async (tx) => {
    for (const { id: columnId, position: columnPosition, cards } of columns) {
      await tx
        .update(kanbanColumns)
        .set({ position: columnPosition })
        .where(eq(kanbanColumns.id, columnId))

      for (const { id, position } of cards) {
        await tx
          .update(kanbanCards)
          .set({ columnId, position })
          .where(eq(kanbanCards.id, id))
      }
    }
  })
}
```

---

## 3. テーブル行ソート (Table Row Sort)

データテーブルの行をドラッグで並び替えるケース。

### Prisma スキーマ

```prisma
model TableRow {
  id       String @id @default(cuid())
  name     String
  value    String
  position Int

  @@index([position])
}
```

### Drizzle スキーマ (PostgreSQL)

```ts
export const tableRows = pgTable(
  'table_rows',
  {
    id:       text('id').primaryKey(),
    name:     text('name').notNull(),
    value:    text('value').notNull(),
    position: integer('position').notNull(),
  },
  (table) => [index('table_rows_position_idx').on(table.position)],
)
```

### TypeScript 型定義

```ts
export type TableRowData = {
  id: string
  name: string
  value: string
  position: number
}

// ソータブルリストと同じ構造で共通化できる
export type SaveTableOrderInput = { id: string; position: number }[]
```

### DB 操作関数

```ts
// --- Prisma 版 ---
export async function saveTableOrder(rows: SaveTableOrderInput) {
  await prisma.$transaction(
    rows.map(({ id, position }) =>
      prisma.tableRow.update({ where: { id }, data: { position } }),
    ),
  )
}

// --- Drizzle 版 ---
export async function saveTableOrder(rows: SaveTableOrderInput) {
  await db.transaction(async (tx) => {
    for (const { id, position } of rows) {
      await tx.update(tableRows).set({ position }).where(eq(tableRows.id, id))
    }
  })
}
```

---

## 4. Zustand 状態管理（オプション）

**使う基準:**

| 状況 | 推奨 |
|---|---|
| 単一ページ・シンプルなリスト | `useState` + DB 関数を直接呼ぶ |
| 複数コンポーネントで状態を共有 | Zustand ストアに集約 |
| 楽観的更新・ローディング管理が必要 | Zustand の `isSaving` フラグを活用 |

以下は Zustand を追加するパターン。DB 操作関数 (`saveSortOrder` / `saveBoard`) 自体は変わらないため、Zustand を外しても DB 関数はそのまま使える。

### ソータブルリスト用ストア

```ts
import { create } from 'zustand'
import { arrayMove } from '@dnd-kit/sortable'
import { saveSortOrder, type SaveOrderInput } from '@/lib/db/sortable'

type Item = { id: string; label: string; position: number }

type SortableStore = {
  items: Item[]
  isSaving: boolean
  setItems: (items: Item[]) => void
  reorder: (oldIndex: number, newIndex: number) => void
  syncToDb: () => Promise<void>
}

export const useSortableStore = create<SortableStore>((set, get) => ({
  items: [],
  isSaving: false,

  setItems: (items) => set({ items }),

  reorder: (oldIndex, newIndex) =>
    set((state) => ({
      items: arrayMove(state.items, oldIndex, newIndex).map((item, i) => ({
        ...item,
        position: i,
      })),
    })),

  syncToDb: async () => {
    set({ isSaving: true })
    try {
      const input: SaveOrderInput = get().items.map(({ id, position }) => ({ id, position }))
      await saveSortOrder(input)
    } finally {
      set({ isSaving: false })
    }
  },
}))
```

### カンバンボード用ストア

```ts
import { create } from 'zustand'
import { saveBoard, type SaveBoardInput } from '@/lib/db/kanban'

type Card = { id: string; title: string; label?: string }
type Column = { id: string; title: string; cardIds: string[] }
type BoardState = { cards: Record<string, Card>; columns: Column[] }

type KanbanStore = {
  board: BoardState
  isSaving: boolean
  setBoard: (board: BoardState) => void
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string, toIndex: number) => void
  syncToDb: () => Promise<void>
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  board: { cards: {}, columns: [] },
  isSaving: false,

  setBoard: (board) => set({ board }),

  moveCard: (cardId, fromColumnId, toColumnId, toIndex) =>
    set((state) => ({
      board: {
        ...state.board,
        columns: state.board.columns.map((col) => {
          if (col.id === fromColumnId) {
            return { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) }
          }
          if (col.id === toColumnId) {
            const newIds = [...col.cardIds]
            newIds.splice(toIndex, 0, cardId)
            return { ...col, cardIds: newIds }
          }
          return col
        }),
      },
    })),

  syncToDb: async () => {
    set({ isSaving: true })
    try {
      const { board } = get()
      const input: SaveBoardInput = {
        columns: board.columns.map((col, colIndex) => ({
          id: col.id,
          position: colIndex,
          cards: col.cardIds.map((cardId, cardIndex) => ({
            id: cardId,
            position: cardIndex,
            columnId: col.id,
          })),
        })),
      }
      await saveBoard(input)
    } finally {
      set({ isSaving: false })
    }
  },
}))
```

### コンポーネントでの使い方

```tsx
// ---- Zustand 使用時 ----
function KanbanBoardPage() {
  const { board, moveCard, syncToDb, isSaving } = useKanbanStore()

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    // ... fromColumnId / toColumnId / toIndex を算出
    moveCard(active.id as string, fromColumnId, toColumnId, toIndex)
    syncToDb()
  }

  return (
    <>
      {isSaving && <span>保存中...</span>}
      <DndContext onDragEnd={handleDragEnd}>{/* ... */}</DndContext>
    </>
  )
}

// ---- useState のみ（Zustand 不要）----
function KanbanBoardPage() {
  const [board, setBoard] = useState<BoardState>(initialBoard)

  async function handleDragEnd(event: DragEndEvent) {
    const newBoard = applyMove(board, event) // 並び替えロジック
    setBoard(newBoard)
    await saveBoard(buildSaveBoardInput(newBoard))
  }

  return <DndContext onDragEnd={handleDragEnd}>{/* ... */}</DndContext>
}
```

---

## 5. Next.js Server Actions との組み合わせ

DB 操作関数を Server Actions として定義すると、クライアントから直接呼べる。

```ts
// app/actions/kanban.ts
'use server'

import { db } from '@/lib/db'
import { kanbanCards } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { SaveBoardInput } from '@/types/kanban'

export async function saveBoardAction(input: SaveBoardInput) {
  await db.transaction(async (tx) => {
    for (const { id: columnId, position: columnPosition, cards } of input.columns) {
      await tx
        .update(kanbanColumns)
        .set({ position: columnPosition })
        .where(eq(kanbanColumns.id, columnId))

      for (const { id, position } of cards) {
        await tx
          .update(kanbanCards)
          .set({ columnId, position })
          .where(eq(kanbanCards.id, id))
      }
    }
  })
}
```

```tsx
// コンポーネント側（Server Actions を直接 import）
'use client'
import { saveBoardAction } from '@/app/actions/kanban'

async function handleDragEnd(event: DragEndEvent) {
  const newBoard = applyMove(board, event)
  setBoard(newBoard)
  await saveBoardAction(buildSaveBoardInput(newBoard)) // RPC のように呼べる
}
```

---

## まとめ: 選択基準

| 観点 | 選択肢 | 使いどころ |
|---|---|---|
| 状態管理 | `useState` | 単一ページ・シンプル |
| 状態管理 | Zustand | 複数コンポーネント共有・楽観的更新 |
| ORM | Prisma | 型推論・マイグレーション自動化重視 |
| ORM | Drizzle | スキーマを TypeScript で完結させたい |
| DB 呼び出し | Server Actions | Next.js App Router で完結させたい |
| DB 呼び出し | API Route | 外部から叩く必要がある場合 |
