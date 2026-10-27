export const plotColors = {
  background: '#0e1822', text: '#d4e4ef', axis: '#8da8bb', grid: '#253746',
  curve: '#78ceff', vertex: '#ff9d9d', root: '#65e4ca',
}
const dimensions = new WeakMap()

export function preparePlot(canvas) {
  if (!dimensions.has(canvas)) dimensions.set(canvas, { width: canvas.width, height: canvas.height })
  const initial = dimensions.get(canvas)
  canvas.style.aspectRatio = `${initial.width} / ${initial.height}`
  const bounds = canvas.getBoundingClientRect()
  const width = Math.round(bounds.width || initial.width)
  const height = Math.round(bounds.height || initial.height)
  const ratio = Math.min(window.devicePixelRatio || 1, 3)
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.fillStyle = plotColors.background
  ctx.fillRect(0, 0, width, height)
  ctx.font = '13px system-ui, sans-serif'
  return { ctx, width, height }
}

export function axisTicks(min, max, target = 7) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return []
  const raw = (max - min) / Math.max(2, target)
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map(value => value * magnitude).find(value => value >= raw)
  if (!step || !Number.isFinite(step)) return []
  const start = Math.ceil(min / step) * step
  const ticks = []
  for (let index = 0; index < 30; index++) {
    const value = start + index * step
    if (value > max + step * 1e-8) break
    ticks.push(Math.abs(value) < step * 1e-8 ? 0 : Number(value.toPrecision(10)))
  }
  return ticks
}

export function formatTick(value) {
  if (value === 0) return '0'
  if (Math.abs(value) >= 100000 || Math.abs(value) < .001) return value.toExponential(1)
  return String(Number(value.toPrecision(6)))
}

export function drawAxes(ctx, { width, height, xMin, xMax, yMin, yMax }) {
  const left = 58, right = width - 22, top = 28, bottom = height - 40
  const toX = value => left + (value - xMin) / (xMax - xMin) * (right - left)
  const toY = value => bottom - (value - yMin) / (yMax - yMin) * (bottom - top)
  const xTicks = axisTicks(xMin, xMax, Math.max(2, (right - left) / 75))
  const yTicks = axisTicks(yMin, yMax, Math.max(2, (bottom - top) / 42))
  ctx.font = '13px system-ui, sans-serif'
  ctx.lineWidth = 1
  ctx.strokeStyle = plotColors.grid
  ctx.beginPath()
  for (const x of xTicks) { ctx.moveTo(toX(x), top); ctx.lineTo(toX(x), bottom) }
  for (const y of yTicks) { ctx.moveTo(left, toY(y)); ctx.lineTo(right, toY(y)) }
  ctx.stroke()
  ctx.strokeStyle = plotColors.axis
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const yAxis = xMin <= 0 && xMax >= 0 ? toX(0) : left
  const xAxis = yMin <= 0 && yMax >= 0 ? toY(0) : bottom
  ctx.moveTo(yAxis, top); ctx.lineTo(yAxis, bottom)
  ctx.moveTo(left, xAxis); ctx.lineTo(right, xAxis)
  ctx.stroke()
  ctx.fillStyle = plotColors.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const x of xTicks) ctx.fillText(formatTick(x), toX(x), bottom + 18)
  ctx.textAlign = 'right'
  for (const y of yTicks) ctx.fillText(formatTick(y), left - 10, toY(y))
  ctx.textAlign = 'center'
  ctx.fillText('x', right + 10, bottom - 10)
  ctx.fillText('y', left - 10, top - 15)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  return { left, right, top, bottom, toX, toY }
}

export function clipPlot(ctx, plot) {
  ctx.save()
  ctx.beginPath()
  ctx.rect(plot.left, plot.top, plot.right - plot.left, plot.bottom - plot.top)
  ctx.clip()
}
