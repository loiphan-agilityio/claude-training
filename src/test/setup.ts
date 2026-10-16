import '@testing-library/jest-dom/vitest'
import { faker } from '@faker-js/faker'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'
import { useBoardStore } from '../store'

// RTL only auto-cleans when vitest `globals` is on; it is not
afterEach(cleanup)

// a test must not see the board another test moved or saved
beforeEach(() => {
  useBoardStore.setState(useBoardStore.getInitialState(), true)
  // after the reset: setState itself writes to localStorage
  localStorage.clear()
})

// every test gets the same data on every run, whatever order tests run in
beforeEach(() => faker.seed(1))
// faker.date.* is relative to "now" even when seeded
faker.setDefaultRefDate('2026-01-01T00:00:00.000Z')
