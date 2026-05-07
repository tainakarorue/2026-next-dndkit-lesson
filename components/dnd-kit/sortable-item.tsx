import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'

interface Props {
  id: string
  label: string
}

export const SortableItem = ({ id, label }: Props) => {
  // useDraggable + useDroppable を内包したソート専用フック。
  // useDraggable との主な違い：
  // transition が追加される（他のアイテムがスライドする際のアニメーション）
  // CSS.Transform.toString を使う（Translate ではなく Transform）
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
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'w-full flex flex-col items-center justify-center bg-accent rounded-md p-8',
        isDragging ? 'opacity-30 cursor-grabbing' : 'opacity-100 cursor-grab',
      )}
    >
      {label}
    </div>
  )
}
