---
name: unit-test
description: This repo's rules for writing Vitest + React Testing Library unit tests and the faker-based mock data they use (factories in src/mocks/). Use whenever writing, updating or reviewing a *.test.ts(x) file, creating test, mock or fixture data, or when asked to "add tests", "write unit tests", "test this component" or "mock data".
---

# Unit tests in this repo

General Vitest/RTL technique is in the `vitest` and `react-testing` skills. This skill is the house rules on top of them; where they disagree, this one wins.

## Workflow

1. Read the unit under test and the types it takes (`src/board.ts`).
2. Check `src/test/setup.ts` seeds faker (see "Deterministic data"); add it if missing.
3. Make sure a factory exists in `src/mocks/` for every type the test needs; add or extend it there. Never inline a large object literal in a test.
4. Write the test next to the source: `Foo.tsx` → `Foo.test.tsx`.
5. Run `npx vitest run <file>` (bare `npm test` is watch mode and never exits), then `npm run lint` and `npx tsc -b`.
6. Make each new assertion fail once (break the code or the expected value) to prove it can. A test that has never failed proves nothing.

## Mock data: factories in `src/mocks/`

One file per domain module, mirroring the source: `src/board.ts` → `src/mocks/board.ts`. Not `__mocks__/`: Vitest reserves that name for module mocks used by `vi.mock()`.

```ts
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
```

Rules:

- `buildX(overrides)` returns a fresh, valid object on every call, with every optional field filled. A test that needs a field absent says so: `buildCard({ description: undefined })`.
- Use `satisfies Card`, not a `: Card` return type. It still checks the shape, and the filled optional fields keep the type `string`, so tests can write `getByText(card.assignee)` without `!` or a cast.
- Never randomise the shape (`faker.helpers.maybe()` on optional fields, random array lengths). Which branch a test covers must be readable in the test, not decided by the seed.
- Generated values must meet the type's real constraints: unique ids (`faker.string.uuid()`), unions via `faker.helpers.arrayElement([...] as const)`, and the format the type documents (`dueDate` is `YYYY-MM-DD`).
- Nested data goes through the child factory (`buildColumn` uses `buildCard`), so a type change is fixed in one place.
- Wrap factories passed to `faker.helpers.multiple`: `() => buildCard()`. Passing `buildCard` directly fails type-check, because `multiple` calls it with `(undefined, index)`.
- Export factories only, never pre-built objects (`export const mockCard = buildCard()`): a shared object leaks mutations between tests.
- Faker v10 names: `faker.person` (not `name`), `faker.string.uuid` (not `datatype.uuid`). `faker.helpers.unique` no longer exists.
- Real app data (`initialColumns` in `src/board.ts`) is not mock data. Use it only in tests about that data, such as `App.test.tsx`.

## Deterministic data

`src/test/setup.ts` must contain:

```ts
import { faker } from '@faker-js/faker'
import { beforeEach } from 'vitest'

// every test gets the same data on every run, whatever order tests run in
beforeEach(() => faker.seed(1))
// faker.date.* is relative to "now" even when seeded
faker.setDefaultRefDate('2026-01-01T00:00:00.000Z')
```

Seed in `beforeEach`, not once per file. Otherwise a test's data depends on how many faker calls the tests before it made, and adding one test changes the data of all the tests after it.

## Write each value once

Write each value in exactly one place. Built data is written where the test arranges it, and any other literal is written as a named constant. Every later line refers to it. If changing a value means editing two lines, the test has duplication.

```tsx
// ✗ the title is written twice
render(<Card card={{ id: 'c1', title: 'Design login page', priority: 'high' }} />)
screen.getByRole('heading', { level: 3, name: 'Design login page' })

// ✓ arrange once, assert through the object
const card = buildCard({ dueDate: '2026-10-20' })
const { container } = render(<Card card={card} />)

screen.getByRole('heading', { level: 3, name: card.title })
screen.getByText(card.assignee)
expect(container.querySelector('time')).toHaveAttribute('datetime', card.dueDate)
```

- Assert through the object you built, never a literal copy of its value. This covers text (`card.title`, `card.description`), attributes (`card.dueDate`), counts (`toHaveLength(column.cards.length)`, `getByText(String(column.cards.length))`) and names built from data (`` { name: `Add card to ${column.title}` } ``). Copying seeded output into a literal also ties the test to the seed.
- Override every field the test is about, once, when arranging the data: `buildCard({ priority: 'high' })` in a test about the High badge. That documents what the test depends on, even when the random value would also be valid.
- Turn a literal into a named constant when the test uses it more than once and it is not part of the built data, such as UI copy like `'No cards'`, an error message or a label.
  - Name it after its meaning, in camelCase like the rest of the code: `emptyStateText`, not `NO_CARDS`.
  - Define it in the narrowest scope that covers every use: inside the `it`, then the top of the test file, then `src/test/` when 2+ test files need it.
  - Keep a literal used only once inline. A constant with one use only adds indirection.

  ```tsx
  const emptyStateText = 'No cards'

  it('shows an empty state when there are no cards', () => {
    renderColumn({ cards: [] })
    expect(screen.getByText(emptyStateText)).toBeInTheDocument()
  })

  it('hides the empty state when there are cards', () => {
    renderColumn()
    expect(screen.queryByText(emptyStateText)).not.toBeInTheDocument()
  })
  ```

- If several tests differ only in their input, write one `it.each` table instead of copy-pasted tests:

  ```tsx
  it.each([
    ['low', 'Low'],
    ['medium', 'Medium'],
    ['high', 'High'],
  ] as const)('labels %s priority as %s', (priority, label) => {
    renderCard({ priority })
    expect(screen.getByText(label)).toBeInTheDocument()
  })
  ```

- If the same setup repeats in several tests of a file, move it into a local helper that returns the data it built, so assertions can still refer to it:

  ```tsx
  const renderCard = (overrides?: Partial<CardData>) => {
    const card = buildCard(overrides)

    return { card, ...render(<Card card={card} />) }
  }
  ```

  A one-line `render(<Card card={buildCard()} />)` stays inline. Move a helper used by 2+ test files to `src/test/`.
- Build faker data inside the test or a helper it calls, never as a module-level `const` in a test file. Module-level faker calls run before the `beforeEach` seed, and a shared object leaks mutations between tests. Module-level constants are for plain literals only, such as strings and numbers.

The one duplication that is correct: **the test states the expected output itself and never reads it from the code under test.** This covers computed output (`'High'` for `priority: 'high'`, `'Oct 20'` for `dueDate: '2026-10-20'`) and static copy (`'No cards'`). Write it as a literal, or as a test constant when it is reused.

Don't take the expectation from the code under test. That rules out:

- importing it from the component (`export const emptyStateText` in `Column.tsx`)
- importing its lookup tables (`priorityStyles`)
- calling its functions (`toLocaleDateString`)

Otherwise the test passes whatever the code shows, including a typo or a bug. A copy change should cost a one-line test update, because that makes the change deliberate. A production constant may build *inputs*, such as `'a'.repeat(maxTitleLength + 1)`, but never the expected output.

## Asserting on generated data

- Random text can collide in lists: two cards with the same title make `getByText` throw. When querying by text across items, override with distinct values or scope the query with `within(item)`.
- Faker produces realistic data, not edge cases. Empty strings, very long titles, emoji, and past or invalid dates each get an explicit override in their own test.

## House style

- Import test APIs from `vitest` explicitly (`import { expect, it, vi } from 'vitest'`), because globals are off. `cleanup` already runs in setup.
- Use `import type` for types (`verbatimModuleSyntax`).
- Write top-level `it('shows …')` named after the behaviour in user terms. Add `describe` only when a file covers more than one unit.
- Query by role and accessible name first (`getByRole('region', { name })`, `getByRole('heading', { level: 3, name })`). Use `container.querySelector` only for elements without a usable role, such as `<time>`.
- Test one behaviour per test: arrange with factories, act, then assert.
- Render real children (`Column` with real `Card`s). Mock only boundaries: network, timers, `Date`, storage. For time-dependent code use `vi.useFakeTimers()` + `vi.setSystemTime()` and restore with `vi.useRealTimers()` in `afterEach`.
- `@testing-library/user-event` is not installed. For interaction tests, ask before adding it as a dev dependency instead of importing it blindly or falling back to `fireEvent`.
