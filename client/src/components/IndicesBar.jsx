import { useDispatch, useSelector } from 'react-redux'
import { selectSymbol } from '../store/marketSlice'
import { num, signed, percent, trend } from '../utils'
import Sparkline from './Sparkline'

export default function IndicesBar() {
  const dispatch = useDispatch()
  const { indices, selected } = useSelector((state) => state.market)
  const items = indices.length ? indices : Array.from({ length: 5 })

  return (
    <section className="indices">
      {items.map((quote, i) =>
        quote ? (
          <button
            key={quote.symbol}
            className={'index-card ' + (selected === quote.symbol ? 'active' : '')}
            onClick={() => dispatch(selectSymbol(quote.symbol))}
          >
            <div className="index-top">
              <span>{quote.name}</span>
              <Sparkline data={quote.spark} up={quote.change >= 0} width={70} height={26} />
            </div>
            <div className="index-price">{num(quote.price)}</div>
            <div className={'index-change ' + trend(quote.change)}>
              <span>{quote.change >= 0 ? '▲' : '▼'}</span>
              {signed(quote.change)} ({percent(quote.changePercent)})
            </div>
          </button>
        ) : (
          <div key={i} className="index-card skeleton" />
        )
      )}
    </section>
  )
}
