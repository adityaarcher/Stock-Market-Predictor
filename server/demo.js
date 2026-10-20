const CATALOG = [
  ['AAPL', 'Apple Inc.', 'NASDAQ', 230],
  ['MSFT', 'Microsoft Corporation', 'NASDAQ', 420],
  ['GOOGL', 'Alphabet Inc.', 'NASDAQ', 175],
  ['AMZN', 'Amazon.com, Inc.', 'NASDAQ', 200],
  ['TSLA', 'Tesla, Inc.', 'NASDAQ', 250],
  ['NVDA', 'NVIDIA Corporation', 'NASDAQ', 140],
  ['META', 'Meta Platforms, Inc.', 'NASDAQ', 560],
  ['NFLX', 'Netflix, Inc.', 'NASDAQ', 700],
  ['AMD', 'Advanced Micro Devices', 'NASDAQ', 160],
  ['INTC', 'Intel Corporation', 'NASDAQ', 22],
  ['ORCL', 'Oracle Corporation', 'NYSE', 170],
  ['IBM', 'IBM', 'NYSE', 220],
  ['JPM', 'JPMorgan Chase & Co.', 'NYSE', 220],
  ['V', 'Visa Inc.', 'NYSE', 280],
  ['DIS', 'The Walt Disney Company', 'NYSE', 100],
  ['KO', 'The Coca-Cola Company', 'NYSE', 65],
  ['WMT', 'Walmart Inc.', 'NYSE', 90],
  ['NKE', 'NIKE, Inc.', 'NYSE', 80],
  ['UBER', 'Uber Technologies', 'NYSE', 80],
  ['RELIANCE.NS', 'Reliance Industries', 'NSE', 1300],
  ['TCS.NS', 'Tata Consultancy Services', 'NSE', 4100],
  ['INFY.NS', 'Infosys Limited', 'NSE', 1850],
  ['HDFCBANK.NS', 'HDFC Bank Limited', 'NSE', 1700],
  ['SBIN.NS', 'State Bank of India', 'NSE', 800],
  ['^GSPC', 'S&P 500', 'SNP', 5800],
  ['^DJI', 'Dow Jones Industrial Average', 'DJI', 42000],
  ['^IXIC', 'NASDAQ Composite', 'NASDAQ', 18500],
  ['^NSEI', 'NIFTY 50', 'NSE', 24800],
  ['^BSESN', 'S&P BSE SENSEX', 'BSE', 81000]
].map(([symbol, name, exchange, base]) => ({ symbol, name, exchange, base }))

const SETTINGS = {
  '1D': { count: 78, step: 300000, volatility: 0.0012, drift: 0 },
  '5D': { count: 65, step: 1800000, volatility: 0.0025, drift: 0 },
  '1M': { count: 22, step: 86400000, volatility: 0.008, drift: 0 },
  '6M': { count: 126, step: 86400000, volatility: 0.011, drift: 0.0004 },
  '1Y': { count: 252, step: 86400000, volatility: 0.012, drift: 0.0004 },
  '5Y': { count: 260, step: 604800000, volatility: 0.028, drift: 0.003 }
}

const hash = (text) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const random = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const find = (symbol) => CATALOG.find((item) => item.symbol === symbol)
const baseFor = (symbol) => find(symbol)?.base ?? 20 + random(hash(symbol))() * 380
const nameFor = (symbol) => find(symbol)?.name ?? symbol
const exchangeFor = (symbol) => find(symbol)?.exchange ?? 'DEMO'

const currencyFor = (symbol) =>
  symbol.endsWith('.NS') || symbol.endsWith('.BO') || symbol === '^NSEI' || symbol === '^BSESN'
    ? 'INR'
    : 'USD'

const livePrice = (symbol) => {
  const now = Date.now()
  const phase = (hash(symbol) % 628) / 100
  const slow = Math.sin(now / 4000000 + phase) * 0.018
  const fast = Math.sin(now / 150000 + phase * 2) * 0.004
  const jitter = (random(hash(symbol) ^ Math.floor(now / 10000))() - 0.5) * 0.003
  return baseFor(symbol) * (1 + slow + fast + jitter)
}

const previousCloseFor = (symbol) => {
  const day = new Date().toDateString()
  return baseFor(symbol) * (1 + (random(hash(symbol + day))() - 0.5) * 0.03)
}

export function demoChart(symbol, rangeKey) {
  const { count, step, volatility, drift } = SETTINGS[rangeKey]
  const next = random(hash(symbol + rangeKey))
  const now = Date.now()

  if (rangeKey === '1D') {
    const start = previousCloseFor(symbol)
    const end = livePrice(symbol)
    const walk = [0]
    for (let i = 1; i < count; i++) {
      walk.push(walk[i - 1] + (next() - 0.5) * 2 * volatility)
    }
    return walk.map((value, i) => {
      const progress = i / (count - 1)
      const line = start + (end - start) * progress
      const noise = value - walk[count - 1] * progress
      return { t: now - (count - 1 - i) * step, c: line * (1 + noise) }
    })
  }

  const values = [1]
  for (let i = 1; i < count; i++) {
    values.push(values[i - 1] * (1 + (next() - 0.5) * 2 * volatility + drift))
  }
  const scale = livePrice(symbol) / values[count - 1]
  return values.map((value, i) => ({
    t: now - (count - 1 - i) * step,
    c: value * scale
  }))
}

export function demoQuote(symbol) {
  const price = livePrice(symbol)
  const previousClose = previousCloseFor(symbol)
  const closes = demoChart(symbol, '1D').map((point) => point.c)
  const base = baseFor(symbol)
  const change = price - previousClose

  return {
    symbol,
    name: nameFor(symbol),
    exchange: exchangeFor(symbol),
    currency: currencyFor(symbol),
    price,
    previousClose,
    change,
    changePercent: (change / previousClose) * 100,
    high: Math.max(...closes),
    low: Math.min(...closes),
    volume: Math.round(2000000 + random(hash(symbol))() * 80000000),
    high52: base * 1.25,
    low52: base * 0.72,
    spark: closes
  }
}

export function demoSearch(query) {
  const text = query.toLowerCase()
  return CATALOG.filter(
    (item) => item.symbol.toLowerCase().includes(text) || item.name.toLowerCase().includes(text)
  )
    .slice(0, 8)
    .map((item) => ({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchange,
      type: item.symbol.startsWith('^') ? 'INDEX' : 'EQUITY'
    }))
}

const HEADLINES = [
  '{name} shares move as investors weigh fresh earnings expectations',
  'Analysts update price targets on {name} ahead of next quarter',
  'What traders are watching in {name} this week',
  'Markets mixed as {name} leads sector activity',
  'Institutional investors adjust positions in {name}',
  'Is {name} a buy? Experts weigh in on the outlook',
  'Options activity surges around {name}',
  'Sector rotation puts {name} back in focus'
]

const PUBLISHERS = [
  'MarketWire Demo',
  'Finance Daily Demo',
  'Trading Desk Demo',
  'Ticker Report Demo'
]

export function demoNews(symbol) {
  const name = symbol && !symbol.startsWith('^') ? nameFor(symbol) : 'the market'
  const now = Date.now()
  return HEADLINES.map((template, i) => ({
    id: 'demo-' + i,
    title: template.replace('{name}', name),
    publisher: PUBLISHERS[i % PUBLISHERS.length],
    link: 'https://finance.yahoo.com/quote/' + encodeURIComponent(symbol || '^GSPC'),
    time: now - (i + 1) * 47 * 60000,
    image: null
  }))
}
