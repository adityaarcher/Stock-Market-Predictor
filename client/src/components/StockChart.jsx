import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { setRange, addToWatchlist, removeFromWatchlist } from '../store/marketSlice'
import { money, num, signed, percent, compact, trend } from '../utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const RANGES = ['1D', '5D', '1M', '6M', '1Y', '5Y']
const COLORS = { up: '#22d3a0', down: '#ff5d73' }

const timeLabel = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

const makeLabel = (time, range) => {
  const date = new Date(time)
  if (range === '1D') return timeLabel(date)
  if (range === '5D') {
    return date.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + timeLabel(date)
  }
  if (range === '1Y' || range === '5Y') {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function StockChart() {
  const dispatch = useDispatch()
  const { selected, range, quotes, chart, watchlist } = useSelector((state) => state.market)

  const quote = quotes[selected]
  const points = chart.points
  const isIndex = selected.startsWith('^')
  const currency = quote?.currency || 'USD'
  const watching = watchlist.includes(selected)

  const format = (value) => (isIndex ? num(value) : money(value, currency))

  const first = points[0]?.c
  const last = points[points.length - 1]?.c
  const rangeChange = first != null ? last - first : 0
  const rangePercent = first ? (rangeChange / first) * 100 : 0
  const color = COLORS[trend(rangeChange)]

  const data = useMemo(
    () => ({
      labels: points.map((point) => makeLabel(point.t, range)),
      datasets: [
        {
          data: points.map((point) => point.c),
          borderColor: color,
          borderWidth: 2.5,
          tension: 0.25,
          fill: true,
          backgroundColor: (context) => {
            const area = context.chart.chartArea
            if (!area) return color
            const gradient = context.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
            gradient.addColorStop(0, color + '55')
            gradient.addColorStop(1, color + '00')
            return gradient
          },
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: color
        }
      ]
    }),
    [points, range, color]
  )

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 300 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0b1226',
          borderColor: 'rgba(255,255,255,0.12)',
          borderWidth: 1,
          padding: 12,
          titleColor: '#8c98b3',
          bodyColor: '#ffffff',
          displayColors: false,
          callbacks: { label: (item) => format(item.parsed.y) }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#6f7c99', maxTicksLimit: 6, maxRotation: 0 }
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { display: false },
          ticks: { color: '#6f7c99', callback: (value) => num(value) }
        }
      }
    }),
    [isIndex, currency]
  )

  const stats = quote
    ? [
        ['Prev close', format(quote.previousClose)],
        ['Day high', format(quote.high)],
        ['Day low', format(quote.low)],
        ['Volume', compact(quote.volume)],
        ['52W high', format(quote.high52)],
        ['52W low', format(quote.low52)]
      ]
    : []

  const toggleWatch = () => {
    dispatch(watching ? removeFromWatchlist(selected) : addToWatchlist(selected))
  }

  return (
    <section className="panel chart-panel">
      <div className="chart-head">
        <div>
          <div className="symbol-line">
            <h2>{quote?.name || selected}</h2>
            <span className="tag">{selected}</span>
            {quote?.exchange && <span className="tag muted">{quote.exchange}</span>}
          </div>

          <div className="price-line">
            <span
              key={quote?.tick}
              className={'big-price ' + (quote?.direction ? 'flash-' + quote.direction : '')}
            >
              {quote ? format(quote.price) : '—'}
            </span>
            {quote && (
              <span className={'pill big ' + trend(quote.change)}>
                {signed(quote.change)} ({percent(quote.changePercent)})
              </span>
            )}
            <small>Today</small>
          </div>
        </div>

        <button className={'watch-btn ' + (watching ? 'on' : '')} onClick={toggleWatch}>
          {watching ? '★ Watching' : '☆ Add to watchlist'}
        </button>
      </div>

      <div className="chart-toolbar">
        <div className="tabs">
          {RANGES.map((item) => (
            <button
              key={item}
              className={item === range ? 'active' : ''}
              onClick={() => dispatch(setRange(item))}
            >
              {item}
            </button>
          ))}
        </div>

        {points.length > 1 && (
          <div className={'range-change ' + trend(rangeChange)}>
            {range}: {signed(rangeChange)} ({percent(rangePercent)})
          </div>
        )}
      </div>

      <div className="chart-box">
        {chart.loading && !points.length && (
          <div className="overlay">
            <div className="spinner" />
          </div>
        )}
        {chart.error && !points.length && (
          <div className="overlay">Could not load chart for {selected}</div>
        )}
        {!chart.loading && !chart.error && points.length < 2 && (
          <div className="overlay">No chart data available</div>
        )}
        {points.length > 1 && <Line data={data} options={options} />}
      </div>

      {stats.length > 0 && (
        <div className="stats">
          {stats.map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
