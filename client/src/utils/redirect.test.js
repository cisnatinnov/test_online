import { expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { postLoginPath } from './redirect'
const router = createRouter({ history: createMemoryHistory(), routes: [
  { path: '/', component: {} }, { path: '/health', component: {} }, { path: '/login', component: {}, meta: { guest: true } },
] })
it('preserves a requested local module through authentication', () => { expect(postLoginPath(router, '/health?identity=1')).toBe('/health?identity=1') })
it.each(['https://example.com', '//example.com', '/login', undefined, ['/health']])('rejects unsafe or guest destinations %p', value => { expect(postLoginPath(router, value)).toBe('/') })
