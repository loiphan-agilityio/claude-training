import { create } from 'zustand'
import type { Column } from './board'
import { initialColumns, moveCard } from './board'

type BoardState = {
  columns: Column[]
  moveCard: (cardId: string, toColumnId: string, toIndex: number) => void
}

export const useBoardStore = create<BoardState>()((set) => ({
  columns: initialColumns,
  moveCard: (cardId, toColumnId, toIndex) =>
    set((state) => ({
      columns: moveCard(state.columns, cardId, toColumnId, toIndex),
    })),
}))
