import { configureStore } from '@reduxjs/toolkit'
import market from './marketSlice'

export const store = configureStore({
  reducer: { market }
})

let lastSaved = ''

store.subscribe(() => {
  const value = JSON.stringify(store.getState().market.watchlist)
  if (value === lastSaved) return
  lastSaved = value
  try {
    localStorage.setItem('watchlist', value)
  } catch {
    return
  }
})
