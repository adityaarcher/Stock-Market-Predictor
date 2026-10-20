import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadQuotes, loadIndices, loadChart, loadNews } from './store/marketSlice'
import Header from './components/Header'
import IndicesBar from './components/IndicesBar'
import StockChart from './components/StockChart'
import Watchlist from './components/Watchlist'
import NewsFeed from './components/NewsFeed'

export default function App() {
  const dispatch = useDispatch()
  const { watchlist, selected, range } = useSelector((state) => state.market)

  const symbolsKey = [...new Set([...watchlist, selected])].join(',')

  useEffect(() => {
    const run = () => dispatch(loadQuotes(symbolsKey.split(',')))
    run()
    const timer = setInterval(run, 15000)
    return () => clearInterval(timer)
  }, [symbolsKey, dispatch])

  useEffect(() => {
    const run = () => dispatch(loadIndices())
    run()
    const timer = setInterval(run, 20000)
    return () => clearInterval(timer)
  }, [dispatch])

  useEffect(() => {
    const run = () => dispatch(loadChart({ symbol: selected, range }))
    run()
    const timer = setInterval(run, 60000)
    return () => clearInterval(timer)
  }, [selected, range, dispatch])

  useEffect(() => {
    const run = () => dispatch(loadNews(selected))
    run()
    const timer = setInterval(run, 300000)
    return () => clearInterval(timer)
  }, [selected, dispatch])

  return (
    <div className="app">
      <Header />
      <main className="container">
        <IndicesBar />
        <div className="layout">
          <StockChart />
          <Watchlist />
          <NewsFeed />
        </div>
      </main>
      <footer className="footer">
        Market data may be delayed and is provided for informational purposes only. Not investment
        advice.
      </footer>
    </div>
  )
}
