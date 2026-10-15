import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card as CardData } from '../board'
import Card from './Card'

function SortableCard({ card }: { card: CardData }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  return (
    // touch-none: without it the browser scrolls instead of dragging on touch
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`touch-none cursor-grab rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-500 ${isDragging ? 'opacity-40' : ''}`}
      {...attributes}
      {...listeners}
    >
      <Card card={card} />
    </div>
  )
}

export default SortableCard
