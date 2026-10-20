import { useSelector } from 'react-redux'
import SearchBar from './SearchBar'

export default function Header() {
  const { demo, offline, updatedAt } = useSelector((state) => state.market)

  const status = offline ? 'offline' : demo ? 'demo' : 'live'
  const label = offline ? 'Offline' : demo ? 'Demo data' : 'Live'
  const time = updatedAt ? new Date(updatedAt).toLocaleTimeString() : '--:--'

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24">
            <polyline points="3 17 9 11 13 15 21 6" />
            <polyline points="15 6 21 6 21 12" />
          </svg>
        </div>
        <span>
          Market<b>Pulse</b>
        </span>
      </div>

      <SearchBar />

      <div className={'status ' + status}>
        <span className="dot" />
        <span>{label}</span>
        <small>{time}</small>
      </div>
    </header>
  )
}
