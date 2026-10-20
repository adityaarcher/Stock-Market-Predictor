const BASE = 'https://query1.finance.yahoo.com'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json'
}

export const RANGES = {
  '1D': { range: '1d', interval: '5m' },
  '5D': { range: '5d', interval: '30m' },
  '1M': { range: '1mo', interval: '1d' },
  '6M': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' }
}

const cache = new Map()
let blockedUntil = 0

const notFound = () => {
  const error = new Error('Symbol not found')
  error.notFound = true
  return error
}

async function request(path, ttl) {
  const hit = cache.get(path)
  if (hit && Date.now() - hit.time < ttl) return hit.data

  if (Date.now() < blockedUntil) throw new Error('Yahoo temporarily unavailable')

  let response
  try {
    response = await fetch(BASE + path, {
      headers: HEADERS,
      signal: AbortSignal.timeout(6000)
    })
  } catch (error) {
    blockedUntil = Date.now() + 60000
    throw error
  }

  if (response.status === 404) throw notFound()

  if (!response.ok) {
    blockedUntil = Date.now() + 30000
    throw new Error('Yahoo responded with ' + response.status)
  }

  const data = await response.json()
  if (cache.size > 500) cache.clear()
  cache.set(path, { time: Date.now(), data })
  return data
}

const pickResult = (data) => {
  const result = data?.chart?.result?.[0]
  if (!result) throw notFound()
  return result
}

const downsample = (list, max) => {
  if (list.length <= max) return list
  const step = list.length / max
  const sampled = Array.from({ length: max }, (_, i) => list[Math.floor(i * step)])
  sampled[max - 1] = list[list.length - 1]
  return sampled
}

export async function getQuote(symbol) {
  const data = await request(
    `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=5m`,
    10000
  )
  const result = pickResult(data)
  const meta = result.meta
  const closes = (result.indicators?.quote?.[0]?.close || []).filter((value) => value != null)

  const price = meta.regularMarketPrice
  const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price
  const change = price - previousClose

  return {
    symbol: meta.symbol || symbol,
    name: meta.longName || meta.shortName || symbol,
    exchange: meta.fullExchangeName || meta.exchangeName || '',
    currency: meta.currency || 'USD',
    price,
    previousClose,
    change,
    changePercent: previousClose ? (change / previousClose) * 100 : 0,
    high: meta.regularMarketDayHigh ?? null,
    low: meta.regularMarketDayLow ?? null,
    volume: meta.regularMarketVolume ?? null,
    high52: meta.fiftyTwoWeekHigh ?? null,
    low52: meta.fiftyTwoWeekLow ?? null,
    spark: downsample(closes, 40)
  }
}

export async function getChart(symbol, rangeKey) {
  const { range, interval } = RANGES[rangeKey]
  const data = await request(
    `/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`,
    rangeKey === '1D' ? 10000 : 120000
  )
  const result = pickResult(data)
  const times = result.timestamp || []
  const closes = result.indicators?.quote?.[0]?.close || []

  const points = []
  times.forEach((time, i) => {
    if (closes[i] != null) points.push({ t: time * 1000, c: closes[i] })
  })
  return points
}

export async function searchSymbols(query) {
  const data = await request(
    `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
    60000
  )
  const allowed = ['EQUITY', 'ETF', 'INDEX', 'CRYPTOCURRENCY']
  return (data.quotes || [])
    .filter((item) => item.symbol && allowed.includes(item.quoteType))
    .map((item) => ({
      symbol: item.symbol,
      name: item.shortname || item.longname || item.symbol,
      exchange: item.exchDisp || item.exchange || '',
      type: item.quoteType
    }))
}

const mapNews = (data) =>
  (data.news || []).map((item) => ({
    id: item.uuid,
    title: item.title,
    publisher: item.publisher,
    link: item.link,
    time: (item.providerPublishTime || 0) * 1000,
    image: item.thumbnail?.resolutions?.[1]?.url || item.thumbnail?.resolutions?.[0]?.url || null
  }))

const newsRequest = (term) =>
  request(`/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=0&newsCount=10`, 300000)

export async function getNews(symbol) {
  const term = !symbol || symbol.startsWith('^') ? 'stock market' : symbol
  let news = mapNews(await newsRequest(term))
  if (!news.length && term !== 'stock market') {
    news = mapNews(await newsRequest('stock market'))
  }
  return news
}
