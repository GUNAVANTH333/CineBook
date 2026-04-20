import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { showsApi, moviesApi } from '../../api/services'
import { MonitorPlay } from 'lucide-react'
import type { Show, Movie } from '../../types'
import { onPosterError, posterSrc } from '../../utils/placeholder'
import './Shows.css'

const Shows: React.FC = () => {
  const [searchParams] = useSearchParams()
  const movieIdFilter = searchParams.get('movieId')

  const [shows, setShows] = useState<Show[]>([])
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMovie, setSelectedMovie] = useState(movieIdFilter || '')
  const [city, setCity] = useState('')

  useEffect(() => {
    Promise.all([showsApi.getAll(), moviesApi.getAll()])
      .then(([sRes, mRes]) => {
        setShows(sRes.data.data)
        setMovies(mRes.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = shows.filter(s => {
    const matchMovie = selectedMovie ? s.movieId === selectedMovie : true
    const matchCity = city ? s.screen?.multiplex?.city?.toLowerCase().includes(city.toLowerCase()) : true
    return matchMovie && matchCity
  })

  const byMovie = filtered.reduce<Record<string, { movie: Movie; shows: Show[] }>>((acc, show) => {
    const key = show.movieId
    if (!acc[key]) acc[key] = { movie: show.movie, shows: [] }
    acc[key].shows.push(show)
    return acc
  }, {})

  return (
    <div className="shows-page">
      <div className="container">
        <div className="page-header fade-up">
          <h1 className="page-title">All Shows</h1>
          <p className="page-sub">Browse upcoming showtimes and book your seats</p>
        </div>

        <div className="shows-filters fade-up">
          <select
            className="form-input"
            style={{ maxWidth: 240 }}
            value={selectedMovie}
            onChange={e => setSelectedMovie(e.target.value)}
          >
            <option value="">All Movies</option>
            {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>

          <input
            className="form-input"
            style={{ maxWidth: 200 }}
            placeholder="Filter by city..."
            value={city}
            onChange={e => setCity(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="spinner" />
        ) : Object.keys(byMovie).length === 0 ? (
          <div className="empty-state fade-up">
            <MonitorPlay size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)' }} />
            <p>No shows available {selectedMovie || city ? 'for selected filters' : ''}</p>
            <p className="empty-hint">Admin can add shows from the Admin panel.</p>
          </div>
        ) : (
          <div className="shows-groups fade-up">
            {Object.values(byMovie).map(({ movie, shows: movieShows }) => (
              <div key={movie.id} className="shows-group">
                <div className="shows-group-header">
                  <img
                    src={posterSrc(movie.posterUrl)}
                    alt={movie.title}
                    className="shows-group-poster"
                    onError={onPosterError}
                  />
                  <div>
                    <h2 className="shows-group-title">{movie.title}</h2>
                    <div className="shows-group-meta">
                      <span className="badge badge-neutral">{movie.genre}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{movie.language} · {movie.durationMinutes} min</span>
                    </div>
                  </div>
                </div>

                <div className="shows-table">
                  {movieShows.map(show => {
                    const d = new Date(show.showTime)
                    return (
                      <div key={show.id} className="show-row">
                        <div className="show-row-venue">
                          <div className="show-row-multiplex">{show.screen?.multiplex?.name || '—'}</div>
                          <div className="show-row-city">{show.screen?.multiplex?.city} · Screen {show.screen?.screenNumber}</div>
                        </div>
                        <div className="show-row-datetime">
                          <span className="show-row-date">{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
                          <span className="show-row-time">{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <div className="show-row-formats">
                          <span className="badge badge-neutral">{movie.language}</span>
                        </div>
                        <div className="show-row-price">₹{show.basePrice}</div>
                        <Link to={`/shows/${show.id}`} className="btn btn-primary" style={{ padding: '9px 20px', fontSize: '0.875rem' }}>
                          Book
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Shows
