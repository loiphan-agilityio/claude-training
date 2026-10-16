import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Card, Column } from './board'
import {
  addCard,
  deleteCard,
  initialColumns,
  moveCard,
  updateCard,
} from './board'

type BoardState = {
  columns: Column[]
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => void
  addCard: (columnId: string, card: Omit<Card, 'id'>) => void
  updateCard: (cardId: string, fields: Omit<Card, 'id'>) => void
  deleteCard: (cardId: string) => void
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set) => ({
      columns: initialColumns,
      moveCard: (cardId, toColumnId, toIndex) =>
        set((state) => ({
          columns: moveCard(state.columns, cardId, toColumnId, toIndex),
        })),
      addCard: (columnId, card) =>
        set((state) => ({
          columns: addCard(state.columns, columnId, {
            ...card,
            id: crypto.randomUUID(),
          }),
        })),
      updateCard: (cardId, fields) =>
        set((state) => ({
          columns: updateCard(state.columns, cardId, fields),
        })),
      deleteCard: (cardId) =>
        set((state) => ({ columns: deleteCard(state.columns, cardId) })),
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
