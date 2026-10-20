const get = async (path) => {
  const response = await fetch('/api' + path)
  if (!response.ok) throw new Error('Request failed')
  return response.json()
}

export const fetchQuotes = (symbols) =>
  get('/quotes?symbols=' + encodeURIComponent(symbols.join(',')))

export const fetchIndices = () => get('/indices')

export const fetchChart = (symbol, range) =>
  get(`/chart/${encodeURIComponent(symbol)}?range=${range}`)

export const fetchNews = (symbol) => get('/news?symbol=' + encodeURIComponent(symbol || ''))

export const searchSymbols = (query) => get('/search?q=' + encodeURIComponent(query))
