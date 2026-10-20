import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RANGES, getQuote, getChart, searchSymbols, getNews } from './yahoo.js'
import { demoQuote, demoChart, demoSearch, demoNews } from './demo.js'

const app = express()
const PORT = process.env.PORT || 5001

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'Dow Jones' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^BSESN', name: 'SENSEX' }
]

app.use(cors())

async function loadQuotes(symbols) {
  let demo = false
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        return await getQuote(symbol)
      } catch (error) {
        if (error.notFound) return null
        demo = true
        return demoQuote(symbol)
      }
    })
  )
  return { quotes: results.filter(Boolean), demo }
}

app.get('/api/quotes', async (req, res) => {
  const symbols = String(req.query.symbols || '')
    .split(',')
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 25)

  res.json(await loadQuotes(symbols))
})

app.get('/api/indices', async (req, res) => {
  const { quotes, demo } = await loadQuotes(INDICES.map((index) => index.symbol))
  const named = quotes.map((quote) => ({
    ...quote,
    name: INDICES.find((index) => index.symbol === quote.symbol)?.name || quote.name
  }))
  res.json({ demo, quotes: named })
})

app.get('/api/chart/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase()
  const range = RANGES[req.query.range] ? req.query.range : '1D'

  try {
    const points = await getChart(symbol, range)
    res.json({ demo: false, symbol, range, points })
  } catch (error) {
    if (error.notFound) return res.status(404).json({ error: 'Symbol not found' })
    res.json({ demo: true, symbol, range, points: demoChart(symbol, range) })
  }
})

app.get('/api/search', async (req, res) => {
  const query = String(req.query.q || '').trim()
  if (!query) return res.json({ demo: false, results: [] })

  try {
    res.json({ demo: false, results: await searchSymbols(query) })
  } catch {
    res.json({ demo: true, results: demoSearch(query) })
  }
})

app.get('/api/news', async (req, res) => {
  const symbol = String(req.query.symbol || '').toUpperCase()

  try {
    res.json({ demo: false, news: await getNews(symbol) })
  } catch {
    res.json({ demo: true, news: demoNews(symbol) })
  }
})

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' })
})

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../client/dist')

if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.use((req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
