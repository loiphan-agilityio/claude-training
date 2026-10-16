import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card as CardData } from '../board'
import Card from './Card'

function SortableCard({
  card,
  onEdit,
}: {
  card: CardData
  onEdit: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative rounded-xl ${isDragging ? 'opacity-40' : ''}`}
    >
      {/* the drag handle is the card; the Edit button is its sibling, so Enter/Space on it
          is not a drag and it is not a button nested in a role="button" */}
      {/* touch-none: without it the browser scrolls instead of dragging on touch */}
      <div
        ref={setActivatorNodeRef}
        className="touch-none cursor-grab rounded-xl focus-visible:outline-2 focus-visible:outline-indigo-500"
        {...attributes}
        {...listeners}
      >
        <Card card={card} />
      </div>

      <button
        type="button"
        aria-label={`Edit ${card.title}`}
        onClick={onEdit}
        className="absolute top-3 right-3 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <svg
          aria-hidden="true"
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 16 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 2.5 13.5 5 5.5 13 2 14l1-3.5 8-8z" />
        </svg>
      </button>
    </div>
  )
}

export default SortableCard
