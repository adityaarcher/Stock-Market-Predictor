import { useSelector } from 'react-redux'
import { timeAgo } from '../utils'

export default function NewsFeed() {
  const { news, newsLoading, selected } = useSelector((state) => state.market)

  return (
    <section className="panel news-panel">
      <div className="panel-head">
        <h3>Latest news</h3>
        <span className="tag">{selected}</span>
      </div>

      <div className="news-grid">
        {newsLoading &&
          !news.length &&
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="news-item skeleton" />)}

        {news.map((item) => (
          <a
            key={item.id || item.link}
            className="news-item"
            href={item.link}
            target="_blank"
            rel="noreferrer"
          >
            {item.image ? (
              <img
                src={item.image}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="news-thumb" />
            )}
            <div>
              <h4>{item.title}</h4>
              <small>
                {item.publisher} · {timeAgo(item.time)}
              </small>
            </div>
          </a>
        ))}
      </div>

      {!newsLoading && !news.length && <p className="empty">No news available right now.</p>}
    </section>
  )
}
