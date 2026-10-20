import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addToWatchlist, selectSymbol } from '../store/marketSlice'
import { searchSymbols } from '../api'

export default function SearchBar() {
  const dispatch = useDispatch()
  const watchlist = useSelector((state) => state.market.watchlist)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const box = useRef(null)

  useEffect(() => {
    const text = query.trim()

    if (!text) {
      setResults([])
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const data = await searchSymbols(text)
        if (active) setResults(data.results)
      } catch {
        if (active) setResults([])
      }
      if (active) setLoading(false)
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const close = (event) => {
      if (box.current && !box.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const pick = (symbol) => {
    dispatch(selectSymbol(symbol))
    setOpen(false)
    setQuery('')
  }

  const add = (event, symbol) => {
    event.stopPropagation()
    dispatch(addToWatchlist(symbol))
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') setOpen(false)
    if (event.key !== 'Enter' || !query.trim()) return
    pick(results.length ? results[0].symbol : query.trim().toUpperCase())
  }

  return (
    <div className="search" ref={box}>
      <svg className="search-icon" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>

      <input
        value={query}
        placeholder="Search stocks, ETFs, indices..."
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {open && query.trim() && (
        <div className="search-menu">
          {loading && !results.length && <div className="search-empty">Searching...</div>}
          {!loading && !results.length && <div className="search-empty">No matches found</div>}

          {results.map((item) => (
            <div key={item.symbol} className="search-item" onClick={() => pick(item.symbol)}>
              <div>
                <strong>{item.symbol}</strong>
                <span>{item.name}</span>
              </div>
              <small>{item.exchange}</small>
              {watchlist.includes(item.symbol) ? (
                <em>Added</em>
              ) : (
                <button onClick={(event) => add(event, item.symbol)}>+ Watch</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
