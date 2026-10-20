import { useDispatch, useSelector } from 'react-redux'
import { selectSymbol, setFilter, setFilterMode, removeFromWatchlist } from '../store/marketSlice'
import { money, percent, trend } from '../utils'
import Sparkline from './Sparkline'

const MODES = [
  ['all', 'All'],
  ['gainers', 'Gainers'],
  ['losers', 'Losers']
]

export default function Watchlist() {
  const dispatch = useDispatch()
  const { watchlist, quotes, selected, filter, filterMode } = useSelector((state) => state.market)

  const text = filter.trim().toLowerCase()

  const rows = watchlist.filter((symbol) => {
    const quote = quotes[symbol]
    const name = quote ? quote.name.toLowerCase() : ''
    if (text && !symbol.toLowerCase().includes(text) && !name.includes(text)) return false
    if (filterMode === 'gainers') return quote && quote.change > 0
    if (filterMode === 'losers') return quote && quote.change < 0
    return true
  })

  const remove = (event, symbol) => {
    event.stopPropagation()
    dispatch(removeFromWatchlist(symbol))
  }

  return (
    <section className="panel side">
      <div className="panel-head">
        <h3>Watchlist</h3>
        <span className="tag">{watchlist.length}</span>
      </div>

      <input
        className="filter"
        placeholder="Filter by symbol or name"
        value={filter}
        onChange={(event) => dispatch(setFilter(event.target.value))}
      />

      <div className="chips">
        {MODES.map(([key, name]) => (
          <button
            key={key}
            className={filterMode === key ? 'active' : ''}
            onClick={() => dispatch(setFilterMode(key))}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="watch-list">
        {!rows.length && (
          <p className="empty">
            {watchlist.length
              ? 'No stocks match your filter.'
              : 'Your watchlist is empty. Search to add stocks.'}
          </p>
        )}

        {rows.map((symbol) => {
          const quote = quotes[symbol]
          return (
            <div
              key={symbol}
              className={'watch-row ' + (symbol === selected ? 'active' : '')}
              onClick={() => dispatch(selectSymbol(symbol))}
            >
              <div className="watch-name">
                <strong>{symbol}</strong>
                <span>{quote ? quote.name : 'Loading...'}</span>
              </div>

              <Sparkline data={quote?.spark} up={(quote?.change ?? 0) >= 0} />

              <div className="watch-price">
                <b key={quote?.tick} className={quote?.direction ? 'flash-' + quote.direction : ''}>
                  {quote ? money(quote.price, quote.currency) : '—'}
                </b>
                <span className={'pill ' + trend(quote?.change ?? 0)}>
                  {quote ? percent(quote.changePercent) : '—'}
                </span>
              </div>

              <button className="remove" title="Remove" onClick={(event) => remove(event, symbol)}>
                ×
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
