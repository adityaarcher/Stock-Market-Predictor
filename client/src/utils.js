const isEmpty = (value) => value == null || Number.isNaN(value)

export const num = (value, digits = 2) =>
  isEmpty(value)
    ? '—'
    : Number(value).toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      })

export const money = (value, currency = 'USD') => {
  if (isEmpty(value)) return '—'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value)
  } catch {
    return num(value)
  }
}

export const signed = (value) => (isEmpty(value) ? '—' : (value > 0 ? '+' : '') + num(value))

export const percent = (value) =>
  isEmpty(value) ? '—' : (value > 0 ? '+' : '') + value.toFixed(2) + '%'

export const compact = (value) =>
  isEmpty(value)
    ? '—'
    : new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(
        value
      )

export const trend = (value) => (value >= 0 ? 'up' : 'down')

export const timeAgo = (time) => {
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000))
  if (minutes < 60) return minutes + 'm ago'
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours + 'h ago'
  return Math.round(hours / 24) + 'd ago'
}
