# dnd-kit レッスン計画

dnd-kit を使ったドラッグ＆ドロップ UI を基礎から応用まで段階的に学ぶプロジェクトです。

## 使用ライブラリ

| パッケージ | 用途 |
|---|---|
| `@dnd-kit/core` | コアライブラリ（DndContext / センサー / コリジョン） |
| `@dnd-kit/sortable` | ソート可能なリスト・グリッド |
| `@dnd-kit/modifiers` | 軸制限・境界制限などの制約 |
| `@dnd-kit/utilities` | CSS変換などのユーティリティ |

## レッスン一覧

| # | タイトル | 主なトピック | パッケージ |
|---|---|---|---|
| 01 | [はじめてのドラッグ&ドロップ](./lesson-01.md) | DndContext / useDraggable / useDroppable | core |
| 02 | [センサーとイベント](./lesson-02.md) | Mouse / Touch / Keyboard センサー / ライフサイクルイベント | core |
| 03 | [DragOverlay](./lesson-03.md) | ドラッグ中のカスタムプレビュー / ポータル描画 | core |
| 04 | [ソータブルリスト（縦）](./lesson-04.md) | SortableContext / useSortable / arrayMove | sortable |
| 05 | [ソータブルグリッド](./lesson-05.md) | rectSortingStrategy / 2Dグリッド並び替え | sortable |
| 06 | [モディファイア](./lesson-06.md) | 軸制限 / 境界制限 / カスタムモディファイア | modifiers |
| 07 | [コリジョン検出](./lesson-07.md) | closestCenter / closestCorners / pointerWithin / カスタム | core |
| 08 | [複数コンテナ間移動](./lesson-08.md) | 複数 SortableContext / コンテナをまたぐ移動 | sortable |
| 09 | [アクセシビリティ](./lesson-09.md) | キーボード操作 / ARIA アナウンス / スクリーンリーダー | core |
| 10 | [カンバンボード（応用）](./lesson-10.md) | 全要素の組み合わせ / 実践的 UX 設計 | 全部 |

## ページルーティング（予定）

```
app/
├── page.tsx                  # トップ（レッスン一覧）
├── lesson/
│   ├── 01/page.tsx
│   ├── 02/page.tsx
│   ├── ...
│   └── 10/page.tsx
```

各レッスンページは独立しており、レッスン内で段階的に積み上げる場合は
**同一ページ内にステップ（Step 1 / Step 2 …）として並べる**方針にします。
