import { expect, it, vi } from 'vitest'
import { axisTicks, formatTick, preparePlot, drawAxes } from './plotCanvas'

it('keeps ticks bounded and useful for wide, narrow, and negative ranges', () => {
  for (const [min, max] of [[-10, 10], [0, .001], [-1e12, 1e12], [1, 1.000001]]) {
    const ticks = axisTicks(min, max)
    expect(ticks.length).toBeGreaterThan(1)
    expect(ticks.length).toBeLessThan(15)
    expect(ticks.every(value => value >= min && value <= max)).toBe(true)
  }
  expect(axisTicks(10, -10)).toEqual([])
  expect(axisTicks(0, Infinity)).toEqual([])
})
it('formats small and large values without long unreadable labels', () => {
  expect(formatTick(0)).toBe('0')
  expect(formatTick(.00001)).toBe('1.0e-5')
  expect(formatTick(1000000)).toBe('1.0e+6')
  expect(formatTick(.30000000004)).toBe('0.3')
})
it('renders at display resolution while preserving logical canvas coordinates', () => {
  const originalRatio = window.devicePixelRatio
  window.devicePixelRatio = 2
  try {
    const ctx = { setTransform: vi.fn(), fillRect: vi.fn() }
    const canvas = { width: 660, height: 500, style: {}, getBoundingClientRect: () => ({ width: 330, height: 250 }), getContext: () => ctx }
    const result = preparePlot(canvas)
    expect(result.width).toBe(330); expect(result.height).toBe(250)
    expect(canvas.width).toBe(660); expect(canvas.height).toBe(500)
    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0)
    expect(canvas.style.aspectRatio).toBe('660 / 500')
    preparePlot(canvas)
    expect(canvas.width).toBe(660) // Repeated redraws must not double the bitmap size.
  } finally { window.devicePixelRatio = originalRatio }
})
it('keeps data coordinates inside the padded plotting region', () => {
  const ctx = { beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), fillText: vi.fn() }
  const plot = drawAxes(ctx, { width: 320, height: 240, xMin: -2, xMax: 2, yMin: -10, yMax: 10 })
  expect(plot.toX(-2)).toBe(plot.left); expect(plot.toX(2)).toBe(plot.right)
  expect(plot.toY(-10)).toBe(plot.bottom); expect(plot.toY(10)).toBe(plot.top)
  for (const [, x, y] of ctx.fillText.mock.calls) {
    expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(320)
    expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(240)
  }
})
