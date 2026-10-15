import { faker } from '@faker-js/faker'
import type { Card, Column } from '../board'

export const buildCard = (overrides: Partial<Card> = {}) =>
  ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence({ min: 2, max: 5 }),
    description: faker.lorem.sentence(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high'] as const),
    assignee: faker.person.firstName(),
    dueDate: faker.date.soon({ days: 30 }).toISOString().slice(0, 10),
    ...overrides,
  }) satisfies Card

export const buildColumn = (overrides: Partial<Column> = {}) =>
  ({
    id: faker.string.uuid(),
    title: faker.word.words(2),
    cards: faker.helpers.multiple(() => buildCard(), { count: 3 }),
    ...overrides,
  }) satisfies Column
