import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EquationGrapher from './EquationGrapher.vue'
import Quadratic from './Quadratic.vue'
import Statistics from './Statistics.vue'
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
let wrapper, ctx
beforeEach(() => {
  ctx = Object.fromEntries(['setTransform', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'stroke', 'fillText', 'save', 'restore', 'rect', 'clip', 'arc', 'fill', 'setLineDash'].map(method => [method, vi.fn()]))
  ctx.measureText = text => ({ width: text.length * 6 })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
})
afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks() })
const click = label => wrapper.findAll('button').find(button => button.text() === label).trigger('click')
it('plots equations and rejects invalid ranges without looping over every integer', async () => {
  wrapper = mount(EquationGrapher)
  await click('Plot')
  expect(wrapper.text()).toContain('sin(x)')
  const ranges = wrapper.findAll('input[type="number"]')
  await ranges[0].setValue(2); await ranges[1].setValue(1); await click('Redraw')
  expect(wrapper.get('[role="alert"]').text()).toContain('maximum greater than the minimum')
  await ranges[0].setValue(0); await ranges[1].setValue(2); await click('Redraw')
  expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  window.dispatchEvent(new Event('resize'))
  expect(ctx.setTransform).toHaveBeenCalled()
})
it('keeps quadratic values and solution steps visible with the new graph renderer', async () => {
  wrapper = mount(Quadratic)
  await nextTick()
  expect(wrapper.text()).toContain('Root 1: x = 3.0000, Root 2: x = -1.0000')
  expect(wrapper.text()).toContain('Solution Steps')
  expect(ctx.fillText.mock.calls.some(([text]) => String(text).startsWith('Vertex'))).toBe(true)
})
it('draws a histogram and restores its readable empty state on Clear', async () => {
  wrapper = mount(Statistics)
  await click('Load Example'); await click('Calculate')
  expect(wrapper.text()).toContain('Mean')
  expect(ctx.fillRect).toHaveBeenCalled()
  await click('Clear')
  expect(ctx.fillText).toHaveBeenCalledWith('Calculate to view the distribution', expect.any(Number), expect.any(Number))
  expect(wrapper.text()).not.toContain('Mean')
})
