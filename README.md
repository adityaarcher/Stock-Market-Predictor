# MarketPulse - Real-Time Stock Market & Financial Dashboard

A responsive financial dashboard built with React, Redux Toolkit, Chart.js and an Express backend.

## Features

- Interactive price chart with 1D, 5D, 1M, 6M, 1Y and 5Y ranges and a color-coded trend
- Market indices bar (S&P 500, Dow Jones, NASDAQ, NIFTY 50, SENSEX) with sparklines
- Watchlist with live prices, price-change flashes, add and remove, saved in the browser
- Watchlist filtering by text and by Gainers / Losers
- Real-time search for stocks, ETFs and indices
- Live news feed for the selected symbol
- Auto refresh: quotes every 15s, indices every 20s, chart every 60s, news every 5 min
- Responsive layout for desktop, tablet and phone

## Tech Stack

React 18, Redux Toolkit, Chart.js, Vite, Node.js, Express

## Getting Started

Requires Node.js 18 or newer.

```bash
npm run setup
npm run dev
```

Open http://localhost:5173

## Production Build

```bash
npm run build
npm start
```

Open http://localhost:5001 (Express serves the built React app and the API together).

## Project Structure

```
market-pulse/
  package.json
  server/
    index.js        API routes and static hosting
    yahoo.js        Yahoo Finance requests, caching, parsing
    demo.js         Demo data used when live data is unreachable
  client/
    index.html
    vite.config.js
    src/
      main.jsx
      App.jsx
      api.js
      utils.js
      index.css
      store/
        index.js
        marketSlice.js
      components/
        Header.jsx
        SearchBar.jsx
        IndicesBar.jsx
        StockChart.jsx
        Watchlist.jsx
        NewsFeed.jsx
        Sparkline.jsx
```

## API

| Endpoint                          | Description                                  |
| --------------------------------- | -------------------------------------------- |
| `GET /api/quotes?symbols=A,B`     | Quotes with sparkline data                   |
| `GET /api/indices`                | Market index quotes                          |
| `GET /api/chart/:symbol?range=1M` | Price history (1D, 5D, 1M, 6M, 1Y, 5Y)       |
| `GET /api/search?q=apple`         | Symbol search                                |
| `GET /api/news?symbol=AAPL`       | News headlines                               |

## About the Data

Prices come from Yahoo Finance's unofficial public endpoints, so they can be delayed and may change or be rate limited at any time. If they cannot be reached, the server falls back to generated demo data and the header badge changes from **Live** to **Demo data**.

Market data is for informational purposes only and is not investment advice.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: MarketPulse dashboard"
git branch -M main
git remote add origin https://github.com/<your-username>/market-pulse.git
git push -u origin main
```
