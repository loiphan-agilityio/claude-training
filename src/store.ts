import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Column } from './board'
import { initialColumns, moveCard } from './board'

type BoardState = {
  columns: Column[]
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => void
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      columns: initialColumns,
      moveCard: (cardId, toColumnId, toIndex) =>
        set((state) => ({
          columns: moveCard(state.columns, cardId, toColumnId, toIndex),
        })),
    }),
    {
      name: 'kanban-board',
      // valid JSON of the wrong shape must not crash the board either
      // shortcut: only checks `columns` is an array, not each card; upgrade with schema versioning
      merge: (persisted, current) => {
        const columns = (persisted as Partial<BoardState> | undefined)?.columns

        return Array.isArray(columns) ? { ...current, columns } : current
      },
    },
  ),
)
