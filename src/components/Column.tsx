import type { Column as ColumnData } from '../board'
import Card from './Card'

const columnStyles: Record<string, { dotClass: string; badgeClass: string }> = {
  todo: {
    dotClass: 'bg-indigo-500 shadow-indigo-500/50',
    badgeClass:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
  },
  'in-progress': {
    dotClass: 'bg-amber-500 shadow-amber-500/50 animate-pulse',
    badgeClass:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  },
  done: {
    dotClass: 'bg-emerald-500 shadow-emerald-500/50',
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
}

function Column({ column }: { column: ColumnData }) {
  const titleId = `${column.id}-title`
  const style = columnStyles[column.id] ?? {
    dotClass: 'bg-slate-400',
    badgeClass:
      'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300/40',
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex w-80 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-slate-100/60 p-3.5 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/60 shadow-xs"
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full shadow-xs ${style.dotClass}`}
          />
          <h2
            id={titleId}
            className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200"
          >
            {column.title}
          </h2>
          <span
            className={`flex h-5 min-w-5 items-center justify-center rounded-full border px-1.5 text-[11px] font-bold ${style.badgeClass}`}
          >
            {column.cards.length}
          </span>
        </div>

        <button
          type="button"
          aria-label={`Add card to ${column.title}`}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 16 16"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" d="M8 3v10M3 8h10" />
          </svg>
        </button>
      </div>

      {column.cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/80 py-12 text-center dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40">
          <div
            aria-hidden="true"
            className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-200/70 text-slate-400 dark:bg-slate-800/80 dark:text-slate-500"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            No cards
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {column.cards.map((card) => (
            <li key={card.id}>
              <Card card={card} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Column
