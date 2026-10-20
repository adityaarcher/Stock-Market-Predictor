export default function Sparkline({ data = [], up = true, width = 90, height = 32 }) {
  if (data.length < 2) {
    return <svg width={width} height={height} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - 2 - ((value - min) / span) * (height - 4)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={up ? '#22d3a0' : '#ff5d73'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
