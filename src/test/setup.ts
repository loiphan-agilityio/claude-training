import '@testing-library/jest-dom/vitest'
import { faker } from '@faker-js/faker'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

// RTL only auto-cleans when vitest `globals` is on; it is not
afterEach(cleanup)

// every test gets the same data on every run, whatever order tests run in
beforeEach(() => faker.seed(1))
// faker.date.* is relative to "now" even when seeded
faker.setDefaultRefDate('2026-01-01T00:00:00.000Z')
