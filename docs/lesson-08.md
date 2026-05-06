# Lesson 08: 複数コンテナ間の移動

## 目標

複数の `SortableContext` をまたいで、アイテムをコンテナ間で移動できるようにする。
カンバンボードの基礎となるパターンを実装する。

## インストール

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 学習トピック

### 1. 状態設計

コンテナとアイテムを別々の状態で管理する。

```ts
type Item = { id: string; label: string };
type Container = { id: string; title: string; itemIds: string[] };

const [items, setItems] = useState<Record<string, Item>>({
  'item-1': { id: 'item-1', label: 'タスク A' },
  'item-2': { id: 'item-2', label: 'タスク B' },
  'item-3': { id: 'item-3', label: 'タスク C' },
});

const [containers, setContainers] = useState<Container[]>([
  { id: 'todo',       title: 'TODO',       itemIds: ['item-1', 'item-2'] },
  { id: 'in-progress', title: '進行中',    itemIds: ['item-3'] },
  { id: 'done',       title: '完了',       itemIds: [] },
]);
```

### 2. コンテナをまたぐ DndContext 構造

```tsx
<DndContext
  collisionDetection={closestCorners}
  onDragOver={handleDragOver}    // コンテナ間移動はここで処理
  onDragEnd={handleDragEnd}      // 同一コンテナ内並び替えはここで処理
>
  {containers.map((container) => (
    <SortableContext
      key={container.id}
      id={container.id}
      items={container.itemIds}
      strategy={verticalListSortingStrategy}
    >
      <ContainerColumn container={container} items={items} />
    </SortableContext>
  ))}
</DndContext>
```

### 3. onDragOver でコンテナ間移動

`onDragOver` は「アイテムが別コンテナに入った瞬間」に呼ばれる。
ここで `itemIds` を更新してプレビュー表示する。

```tsx
function handleDragOver(event: DragOverEvent) {
  const { active, over } = event;
  if (!over) return;

  const activeId = active.id as string;
  const overId = over.id as string;

  // どのコンテナにいるか特定
  const activeContainer = findContainerByItemId(activeId);
  const overContainer = findContainerByItemId(overId) ?? findContainerById(overId);

  if (!activeContainer || !overContainer) return;
  if (activeContainer.id === overContainer.id) return; // 同一コンテナはスキップ

  setContainers((prev) =>
    prev.map((c) => {
      if (c.id === activeContainer.id) {
        return { ...c, itemIds: c.itemIds.filter((id) => id !== activeId) };
      }
      if (c.id === overContainer.id) {
        const overIndex = c.itemIds.indexOf(overId);
        const newIndex = overIndex >= 0 ? overIndex : c.itemIds.length;
        const newIds = [...c.itemIds];
        newIds.splice(newIndex, 0, activeId);
        return { ...c, itemIds: newIds };
      }
      return c;
    })
  );
}
```

### 4. onDragEnd で同一コンテナ内の並び替え

```tsx
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const activeId = active.id as string;
  const overId = over.id as string;
  const container = findContainerByItemId(activeId);
  if (!container) return;

  // onDragOver でコンテナ間移動は済んでいるので、同一コンテナの並び替えだけ処理
  setContainers((prev) =>
    prev.map((c) => {
      if (c.id !== container.id) return c;
      const oldIndex = c.itemIds.indexOf(activeId);
      const newIndex = c.itemIds.indexOf(overId);
      if (oldIndex === newIndex) return c;
      return { ...c, itemIds: arrayMove(c.itemIds, oldIndex, newIndex) };
    })
  );
}
```

### 5. useDroppable でコンテナ自体をドロップ先に

コンテナが空の場合でもドロップできるよう、コンテナ自体を `useDroppable` で登録する。

```tsx
function ContainerColumn({ container }: { container: Container }) {
  const { setNodeRef, isOver } = useDroppable({ id: container.id });

  return (
    <div ref={setNodeRef} style={{ background: isOver ? '#e8f4ff' : 'white' }}>
      <h3>{container.title}</h3>
      <SortableContext items={container.itemIds} strategy={verticalListSortingStrategy}>
        {container.itemIds.map((id) => (
          <SortableItem key={id} id={id} />
        ))}
      </SortableContext>
    </div>
  );
}
```

## Step 構成（ページ内）

| Step | 内容 |
|---|---|
| Step 1 | 2 コンテナ間の移動（最小構成） |
| Step 2 | 3 コンテナ（TODO / 進行中 / 完了）のカンバン風レイアウト |
| Step 3 | DragOverlay を追加してドラッグ中のプレビューを改善 |
| Step 4 | 空コンテナへのドロップ対応（useDroppable 追加） |

## 完成イメージ

- 3 列のカンバンボード（TODO / 進行中 / 完了）
- カードを別のカラムにドラッグすると即座にプレビュー表示
- 空のカラムにもドロップ可能（全体がドロップゾーンになる）
- ドラッグ中はカーソルが `grabbing` になる

## 注意点

- `onDragOver` は高頻度で呼ばれる可能性があるため、無駄な `setState` を避ける
  （コンテナが変わったときだけ実行する条件チェックを入れること）
- `SortableContext` に `id` プロップを渡しておくと、コンテナ判定が容易になる
- `findContainerByItemId` はアイテム id からコンテナを逆引きする補助関数として実装すること
- `closestCorners` を使うとカンバンでの挙動が自然になる（`closestCenter` より推奨）

## サンプル: app/lesson/08/page.tsx 全体

```tsx
'use client'

import { useState } from 'react'
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
  useDroppable,
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
type Container = { id: string; title: string; itemIds: string[] }

const initialItems: Record<string, Item> = {
  'item-1': { id: 'item-1', label: 'タスク A' },
  'item-2': { id: 'item-2', label: 'タスク B' },
  'item-3': { id: 'item-3', label: 'タスク C' },
  'item-4': { id: 'item-4', label: 'タスク D' },
  'item-5': { id: 'item-5', label: 'タスク E' },
}

const initialContainers: Container[] = [
  { id: 'todo',         title: 'TODO',  itemIds: ['item-1', 'item-2', 'item-3'] },
  { id: 'in-progress',  title: '進行中', itemIds: ['item-4'] },
  { id: 'done',         title: '完了',   itemIds: ['item-5'] },
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
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grab',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        fontSize: 14,
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
        padding: '10px 14px',
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 6,
        cursor: 'grabbing',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        fontSize: 14,
      }}
    >
      {label}
    </div>
  )
}

function ContainerColumn({ container }: { container: Container }) {
  const { setNodeRef, isOver } = useDroppable({ id: container.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        width: 220,
        minHeight: 300,
        background: isOver ? '#e8f4ff' : '#f5f5f5',
        borderRadius: 10,
        padding: 12,
        border: '1px solid #e0e0e0',
      }}
    >
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>{container.title}</h3>
      <SortableContext items={container.itemIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {container.itemIds.map(id => (
            <SortableItem key={id} id={id} label={initialItems[id]?.label ?? id} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export default function Page() {
  const [containers, setContainers] = useState<Container[]>(initialContainers)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function findContainerByItemId(itemId: string): Container | undefined {
    return containers.find(c => c.itemIds.includes(itemId))
  }

  function findContainerById(containerId: string): Container | undefined {
    return containers.find(c => c.id === containerId)
  }

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeContainer = findContainerByItemId(activeId)
    const overContainer = findContainerByItemId(overId) ?? findContainerById(overId)

    if (!activeContainer || !overContainer) return
    if (activeContainer.id === overContainer.id) return

    setContainers(prev =>
      prev.map(c => {
        if (c.id === activeContainer.id) {
          return { ...c, itemIds: c.itemIds.filter(id => id !== activeId) }
        }
        if (c.id === overContainer.id) {
          const overIndex = c.itemIds.indexOf(overId)
          const newIndex = overIndex >= 0 ? overIndex : c.itemIds.length
          const newIds = [...c.itemIds]
          newIds.splice(newIndex, 0, activeId)
          return { ...c, itemIds: newIds }
        }
        return c
      })
    )
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string
    const container = findContainerByItemId(activeId)
    if (!container) return

    setContainers(prev =>
      prev.map(c => {
        if (c.id !== container.id) return c
        const oldIndex = c.itemIds.indexOf(activeId)
        const newIndex = c.itemIds.indexOf(overId)
        if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return c
        return { ...c, itemIds: arrayMove(c.itemIds, oldIndex, newIndex) }
      })
    )
  }

  const activeItem = activeId ? initialItems[activeId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div style={{ padding: '2rem' }}>
        <h2>カンバンボード</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {containers.map(container => (
            <ContainerColumn key={container.id} container={container} />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeItem ? <OverlayItem label={activeItem.label} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### ポイント解説

- `onDragOver` でコンテナ間移動のプレビュー（即時 `setState`）を行い、`onDragEnd` では同一コンテナ内の最終順序確定だけを担当する
- `useDroppable` を `ContainerColumn` に付けることで、空のコンテナにもドロップできるようになる
- `findContainerByItemId` でアイテム id → コンテナの逆引きをする。`findContainerById` はコンテナ自体にホバーしたケースに対応する
- `onDragOver` は同一コンテナの場合に早期リターンして無駄な `setState` を防ぐ
