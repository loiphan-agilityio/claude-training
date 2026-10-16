import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type {
  Announcements,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useEffect, useState } from 'react'
import Card from './components/Card'
import Column from './components/Column'
import type { PriorityFilter } from './board'
import { useBoardStore } from './store'

const dotColors: Record<string, string> = {
  todo: 'bg-indigo-500',
  'in-progress': 'bg-amber-500',
  done: 'bg-emerald-500',
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark')
    }

    return true
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const columns = useBoardStore((state) => state.columns)
  const moveCard = useBoardStore((state) => state.moveCard)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  // view state only: not in the store, so it is neither saved nor restored
  const [priority, setPriority] = useState<PriorityFilter>('all')

  const totalCards = columns.reduce((sum, col) => sum + col.cards.length, 0)
  // an id is either a column's or one of its cards'
  const findColumn = (id: UniqueIdentifier) =>
    columns.find((c) => c.id === id || c.cards.some((card) => card.id === id))
  const findCard = (id: UniqueIdentifier | null) =>
    columns.flatMap((c) => c.cards).find((card) => card.id === id)
  const cardTitle = (id: UniqueIdentifier) => findCard(id)?.title
  const activeCard = findCard(activeId)
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${cardTitle(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${cardTitle(active.id)} is over ${findColumn(over.id)?.title}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Dropped ${cardTitle(active.id)} in ${findColumn(over.id)?.title}.`
        : `${cardTitle(active.id)} was dropped outside a column.`,
    onDragCancel: ({ active }) =>
      `Cancelled. ${cardTitle(active.id)} was not moved.`,
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)

    const column = over && findColumn(over.id)

    if (!over || !column) {
      return
    }

    const overIndex = column.cards.findIndex((card) => card.id === over.id)

    // over a column, not a card: append
    moveCard(
      String(active.id),
      column.id,
      overIndex === -1 ? column.cards.length : overIndex,
    )
  }

  return (
    <main className="relative min-h-screen overflow-x-clip bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#090d16] dark:text-slate-100 flex flex-col">
      {/* Ambient background glows & grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[1100px] -translate-x-1/2 bg-gradient-to-b from-indigo-500/15 via-purple-500/5 to-transparent blur-3xl dark:from-indigo-600/20 dark:via-purple-600/10"
      />

      {/* Top Application Bar */}
      <header className="relative z-10 border-b border-slate-200/80 bg-white/70 px-6 py-4 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="5" height="18" rx="1.5" />
                <rect x="11" y="3" width="5" height="12" rx="1.5" />
                <rect x="19" y="3" width="5" height="15" rx="1.5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Kanban Board
                </h1>
                <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
                  Sprint 24
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Core Engineering · Active Sprint Workspace
              </p>
            </div>
          </div>

          {/* Quick Metrics & Team */}
          <div className="flex items-center gap-3">
            {/* Status pills preview */}
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-100/60 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {totalCards} tasks
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              {columns.map((column) => (
                <div key={column.id} className="flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${dotColors[column.id] ?? 'bg-slate-400'}`}
                  />
                  <span>
                    {column.cards.length} {column.title}
                  </span>
                </div>
              ))}
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={
                isDark ? 'Switch to light mode' : 'Switch to dark mode'
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
            >
              {isDark ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path
                    strokeLinecap="round"
                    d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Board Viewport */}
      <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto p-6 sm:p-8">
        {/* Toolbar / Quick Filters bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <svg
                className="h-3.5 w-3.5 text-indigo-500"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h11A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zM2.5 3a.5.5 0 0 0-.5.5V5h12V3.5a.5.5 0 0 0-.5-.5h-11z" />
              </svg>
              Board View
            </span>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Filter:</span>
              <select
                aria-label="Filter by priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as PriorityFilter)
                }
                className="cursor-pointer rounded-md bg-slate-200/60 px-2 py-0.5 text-[11px] font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 dark:scheme-dark dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500">
            Scroll horizontally to navigate columns
          </div>
        </div>

        {/* focusable so keyboard users can scroll it sideways */}
        <div
          role="region"
          aria-label="Board columns"
          tabIndex={0}
          className="custom-scrollbar overflow-x-auto pb-4 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 rounded-2xl"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
            accessibility={{ announcements }}
          >
            <div className="flex items-start gap-5">
              {columns.map((column) => (
                <Column key={column.id} column={column} priority={priority} />
              ))}
            </div>
            {/* the sortable card itself only follows the pointer inside its own column */}
            <DragOverlay>
              {activeCard && (
                <div className="cursor-grabbing rounded-xl bg-white shadow-xl dark:bg-slate-900">
                  <Card card={activeCard} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </main>
  )
}

export default App
