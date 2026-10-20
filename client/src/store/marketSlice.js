import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../api'

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']

const loadWatchlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('watchlist'))
    return Array.isArray(saved) && saved.length ? saved : DEFAULT_WATCHLIST
  } catch {
    return DEFAULT_WATCHLIST
  }
}

export const loadQuotes = createAsyncThunk('market/loadQuotes', (symbols) =>
  api.fetchQuotes(symbols)
)

export const loadIndices = createAsyncThunk('market/loadIndices', () => api.fetchIndices())

export const loadChart = createAsyncThunk('market/loadChart', ({ symbol, range }) =>
  api.fetchChart(symbol, range)
)

export const loadNews = createAsyncThunk('market/loadNews', (symbol) => api.fetchNews(symbol))

const startList = loadWatchlist()

const emptyChart = { points: [], loading: true, error: false }

const initialState = {
  watchlist: startList,
  selected: startList[0],
  range: '1D',
  filter: '',
  filterMode: 'all',
  quotes: {},
  indices: [],
  chart: emptyChart,
  news: [],
  newsLoading: true,
  demo: false,
  offline: false,
  updatedAt: null
}

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    selectSymbol(state, action) {
      state.selected = action.payload
      state.chart = emptyChart
      state.news = []
      state.newsLoading = true
    },
    setRange(state, action) {
      state.range = action.payload
      state.chart = emptyChart
    },
    setFilter(state, action) {
      state.filter = action.payload
    },
    setFilterMode(state, action) {
      state.filterMode = action.payload
    },
    addToWatchlist(state, action) {
      const symbol = action.payload.toUpperCase()
      if (!state.watchlist.includes(symbol)) state.watchlist.push(symbol)
    },
    removeFromWatchlist(state, action) {
      state.watchlist = state.watchlist.filter((symbol) => symbol !== action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadQuotes.fulfilled, (state, action) => {
        action.payload.quotes.forEach((quote) => {
          const old = state.quotes[quote.symbol]
          const moved = old && old.price !== quote.price
          state.quotes[quote.symbol] = {
            ...quote,
            tick: old ? old.tick + (moved ? 1 : 0) : 0,
            direction: moved ? (quote.price > old.price ? 'up' : 'down') : old ? old.direction : ''
          }
        })
        state.demo = action.payload.demo
        state.offline = false
        state.updatedAt = Date.now()
      })
      .addCase(loadQuotes.rejected, (state) => {
        state.offline = true
      })
      .addCase(loadIndices.fulfilled, (state, action) => {
        state.indices = action.payload.quotes
      })
      .addCase(loadChart.fulfilled, (state, action) => {
        const { symbol, range } = action.meta.arg
        if (symbol !== state.selected || range !== state.range) return
        state.chart = { points: action.payload.points, loading: false, error: false }
      })
      .addCase(loadChart.rejected, (state, action) => {
        const { symbol, range } = action.meta.arg
        if (symbol !== state.selected || range !== state.range) return
        state.chart.loading = false
        state.chart.error = true
      })
      .addCase(loadNews.fulfilled, (state, action) => {
        if (action.meta.arg !== state.selected) return
        state.news = action.payload.news
        state.newsLoading = false
      })
      .addCase(loadNews.rejected, (state, action) => {
        if (action.meta.arg !== state.selected) return
        state.newsLoading = false
      })
  }
})

export const {
  selectSymbol,
  setRange,
  setFilter,
  setFilterMode,
  addToWatchlist,
  removeFromWatchlist
} = marketSlice.actions

export default marketSlice.reducer
