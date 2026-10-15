export type Priority = 'low' | 'medium' | 'high'

export type Card = {
  id: string
  title: string
  description?: string
  priority: Priority
  assignee?: string
  dueDate?: string // YYYY-MM-DD
}

export type Column = {
  id: string
  title: string
  cards: Card[]
}

export const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      {
        id: 'card-1',
        title: 'Design login page',
        description: 'Wireframes and visual design for the sign-in flow.',
        priority: 'high',
        assignee: 'Alice',
        dueDate: '2026-10-20',
      },
      {
        id: 'card-2',
        title: 'Set up CI pipeline',
        description: 'Run lint, tests and build on every merge request.',
        priority: 'medium',
        assignee: 'Bob',
      },
      { id: 'card-3', title: 'Write onboarding docs', priority: 'low' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      {
        id: 'card-4',
        title: 'Build API client',
        description: 'Typed fetch wrapper for the boards endpoint.',
        priority: 'medium',
        assignee: 'Carol',
        dueDate: '2026-10-18',
      },
      {
        id: 'card-5',
        title: 'Fix flaky tests',
        priority: 'high',
        assignee: 'Dave',
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      {
        id: 'card-6',
        title: 'Scaffold project',
        description: 'Vite, React, TypeScript and Tailwind set up.',
        priority: 'low',
        assignee: 'Alice',
        dueDate: '2026-10-10',
      },
    ],
  },
]
