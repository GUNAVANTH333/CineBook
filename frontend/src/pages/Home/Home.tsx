import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { moviesApi, showsApi } from '../../api/services'
import { Globe, Clock, Star, Clapperboard } from 'lucide-react'
import type { Movie, Show } from '../../types'
import { onPosterError, posterSrc } from '../../utils/placeholder'
import './Home.css'

const GENRE_FILTERS = ['All', 'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Horror', 'Romance']

const Home: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([])
  const [shows, setShows] = useState<Show[]>([])
  const [genre, setGenre] = useState('All')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([moviesApi.getAll(), showsApi.getAll()])
      .then(([mRes, sRes]) => {
        setMovies(mRes.data.data)
        setShows(sRes.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = movies.filter(m => {
    const matchGenre = genre === 'All' || m.genre.toLowerCase().includes(genre.toLowerCase())
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase())
    return matchGenre && matchSearch
  })

  const featuredMovie = movies[0]

  return (
    <div className="home">
      {featuredMovie && (
        <div className="hero fade-up">
          <div className="hero-bg" style={{ backgroundImage: `url(${featuredMovie.posterUrl})` }} />
          <div className="hero-overlay" />
          <div className="container hero-content">
            <span className="badge badge-accent" style={{ marginBottom: 16 }}>{featuredMovie.genre}</span>
            <h1 className="hero-title">{featuredMovie.title}</h1>
            <div className="hero-meta">
              <span className="hero-meta-item"><Globe size={13} /> {featuredMovie.language}</span>
              <span className="hero-meta-item"><Clock size={13} /> {featuredMovie.durationMinutes} min</span>
              <span className="hero-meta-item"><Star size={13} /> {featuredMovie.rating}</span>
            </div>
            <div className="hero-actions">
              <Link to={`/shows?movieId=${featuredMovie.id}`} className="btn btn-primary btn-lg">
                Book Tickets
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <section className="section fade-up">
          <div className="section-header">
            <div>
              <h2 className="section-title">Now Showing</h2>
              <p className="section-sub">Book tickets for the latest releases</p>
            </div>
            <Link to="/shows" className="see-all">See all →</Link>
          </div>

          <div className="filters">
            <input
              className="form-input search-input"
              placeholder="Search movies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="genre-pills">
              {GENRE_FILTERS.map(g => (
                <button
                  key={g}
                  className={`genre-pill ${genre === g ? 'genre-pill-active' : ''}`}
                  onClick={() => setGenre(g)}
                >{g}</button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="spinner" />
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Clapperboard size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)' }} />
              <p>No movies found</p>
              {movies.length === 0 && <p className="empty-hint">Admin can add movies from the Admin panel.</p>}
            </div>
          ) : (
            <div className="movie-grid">
              {filtered.map(m => (
                <MovieCard key={m.id} movie={m} shows={shows} />
              ))}
            </div>
          )}
        </section>

        {shows.length > 0 && (
          <section className="section fade-up">
            <div className="section-header">
              <div>
                <h2 className="section-title">Upcoming Shows</h2>
                <p className="section-sub">Pick a showtime that works for you</p>
              </div>
              <Link to="/shows" className="see-all">See all →</Link>
            </div>
            <div className="shows-strip">
              {shows.slice(0, 4).map(show => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

const MovieCard: React.FC<{ movie: Movie; shows: Show[] }> = ({ movie, shows }) => {
  const movieShows = shows.filter(s => s.movieId === movie.id)
  return (
    <Link to={`/shows?movieId=${movie.id}`} className="movie-card">
      <div className="movie-poster-wrap">
        <img
          src={posterSrc(movie.posterUrl)}
          alt={movie.title}
          className="movie-poster"
          onError={onPosterError}
        />
        <div className="movie-poster-overlay">
          <span className="movie-rating">{movie.rating}</span>
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-meta">
          <span className="badge badge-neutral">{movie.genre}</span>
          <span className="movie-lang">{movie.language} · {movie.durationMinutes}m</span>
        </div>
        {movieShows.length > 0 && (
          <p className="movie-shows-count">{movieShows.length} show{movieShows.length > 1 ? 's' : ''} available</p>
        )}
      </div>
    </Link>
  )
}

const ShowCard: React.FC<{ show: Show }> = ({ show }) => {
  const date = new Date(show.showTime)
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <Link to={`/shows/${show.id}`} className="show-strip-card">
      <div className="show-strip-movie">{show.movie.title}</div>
      <div className="show-strip-venue">{show.screen?.multiplex?.name || '—'}</div>
      <div className="show-strip-time">
        <span className="show-date">{dateStr}</span>
        <span className="show-time">{timeStr}</span>
      </div>
      <div className="show-strip-price">₹{show.basePrice}</div>
      <span className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>Book</span>
    </Link>
  )
}

export default Home
