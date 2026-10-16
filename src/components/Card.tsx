import type { Card as CardData, Priority } from '../board'

const priorityStyles: Record<Priority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 before:bg-emerald-500',
  },
  medium: {
    label: 'Medium',
    className:
      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 before:bg-amber-500',
  },
  high: {
    label: 'High',
    className:
      'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 before:bg-rose-500',
  },
}

const getInitials = (name: string) => name.charAt(0).toUpperCase()

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
    'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30',
  ]
  const charCode = name.charCodeAt(0) || 0

  return colors[charCode % colors.length]
}

// UTC because a YYYY-MM-DD string parses as UTC midnight
const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

function Card({ card }: { card: CardData }) {
  const priority = priorityStyles[card.priority]

  return (
    <article className="group relative rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-slate-700 dark:hover:shadow-lg dark:hover:shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        {/* pr-7: room for the Edit button SortableCard puts over this corner */}
        <h3 className="pr-7 text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
          {card.title}
        </h3>
      </div>

      {card.description && (
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
          {card.description}
        </p>
      )}

      <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide before:mr-1.5 before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${priority.className}`}
        >
          {priority.label}
        </span>

        {card.assignee && (
          <div className="flex items-center gap-1.5">
            <div
              aria-hidden="true"
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${getAvatarColor(card.assignee)}`}
            >
              {getInitials(card.assignee)}
            </div>
            <span>{card.assignee}</span>
          </div>
        )}

        {card.dueDate && (
          <div className="ml-auto flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="12" height="11" rx="2" />
              <path d="M5 1.5v3M11 1.5v3M2 6.5h12" />
            </svg>
            <time dateTime={card.dueDate}>{formatDate(card.dueDate)}</time>
          </div>
        )}
      </div>
    </article>
  )
}

export default Card
