import React, { useEffect, useState } from 'react'
import { moviesApi, multiplexesApi, showsApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'
import { TriangleAlert } from 'lucide-react'
import type { Movie, Multiplex, Show } from '../../types'
import { onPosterError, posterSrc } from '../../utils/placeholder'
import './Admin.css'

type Tab = 'movies' | 'multiplexes' | 'shows'

const Admin: React.FC = () => {
  const [tab, setTab] = useState<Tab>('movies')
  const [movies, setMovies] = useState<Movie[]>([])
  const [multiplexes, setMultiplexes] = useState<Multiplex[]>([])
  const { showToast } = useToast()

  const loadMovies = () => moviesApi.getAll().then(r => setMovies(r.data.data))
  const loadMultiplexes = () => multiplexesApi.getAll().then(r => setMultiplexes(r.data.data))

  useEffect(() => { loadMovies(); loadMultiplexes() }, [])

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header fade-up">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-sub">Manage movies, multiplexes, and showtimes</p>
        </div>

        <div className="admin-tabs fade-up">
          {(['movies', 'multiplexes', 'shows'] as Tab[]).map(t => (
            <button key={t} className={`admin-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="admin-content fade-up">
          {tab === 'movies' && <MoviesPanel movies={movies} onRefresh={loadMovies} showToast={showToast} />}
          {tab === 'multiplexes' && <MultiplexesPanel multiplexes={multiplexes} onRefresh={loadMultiplexes} showToast={showToast} />}
          {tab === 'shows' && <ShowsPanel movies={movies} multiplexes={multiplexes} showToast={showToast} />}
        </div>
      </div>
    </div>
  )
}

const MoviesPanel: React.FC<{ movies: Movie[]; onRefresh: () => void; showToast: any }> = ({ movies, onRefresh, showToast }) => {
  const empty = { title: '', genre: '', durationMinutes: 120, language: 'English', rating: 'U', posterUrl: '', releaseDate: '' }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await moviesApi.create({ ...form, durationMinutes: Number(form.durationMinutes), releaseDate: new Date(form.releaseDate) } as any)
      showToast('Movie added!', 'success')
      setForm(empty)
      onRefresh()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to add movie', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return
    try {
      await moviesApi.delete(id)
      showToast('Movie deleted', 'success')
      onRefresh()
    } catch (err: any) { showToast(err.response?.data?.message || 'Delete failed', 'error') }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-left">
        <h3 className="panel-section-title">Add New Movie</h3>
        <form className="admin-form" onSubmit={handleSubmit}>
          {[
            { label: 'Title', field: 'title', type: 'text', placeholder: 'Movie title' },
            { label: 'Genre', field: 'genre', type: 'text', placeholder: 'Action, Drama...' },
            { label: 'Language', field: 'language', type: 'text', placeholder: 'English' },
            { label: 'Duration (min)', field: 'durationMinutes', type: 'number', placeholder: '120' },
            { label: 'Rating', field: 'rating', type: 'text', placeholder: 'U, UA, A, PG-13...' },
            { label: 'Poster URL', field: 'posterUrl', type: 'url', placeholder: 'https://...' },
            { label: 'Release Date', field: 'releaseDate', type: 'datetime-local', placeholder: '' },
          ].map(({ label, field, type, placeholder }) => (
            <div key={field} className="form-group">
              <label className="form-label">{label}</label>
              <input
                className="form-input"
                type={type}
                placeholder={placeholder}
                value={(form as any)[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                required
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: 8 }}>
            {saving ? 'Adding...' : 'Add Movie'}
          </button>
        </form>
      </div>

      <div className="admin-panel-right">
        <h3 className="panel-section-title">All Movies ({movies.length})</h3>
        {movies.length === 0 ? (
          <p className="admin-empty">No movies added yet.</p>
        ) : (
          <div className="admin-list">
            {movies.map(m => (
              <div key={m.id} className="admin-list-item">
                <img src={posterSrc(m.posterUrl)} alt={m.title} className="admin-item-img"
                  onError={onPosterError} />
                <div className="admin-item-info">
                  <div className="admin-item-title">{m.title}</div>
                  <div className="admin-item-sub">{m.genre} · {m.language} · {m.durationMinutes}min · {m.rating}</div>
                </div>
                <button className="admin-delete-btn" onClick={() => handleDelete(m.id, m.title)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const MultiplexesPanel: React.FC<{ multiplexes: Multiplex[]; onRefresh: () => void; showToast: any }> = ({ multiplexes, onRefresh, showToast }) => {
  const empty = { name: '', location: '', city: '', totalScreens: 1 }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [screenForm, setScreenForm] = useState<{ mId: string; screenNumber: number; totalRows: number; totalColumns: number; capacity: number } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await multiplexesApi.create({ ...form, totalScreens: Number(form.totalScreens) } as any)
      showToast('Multiplex added!', 'success')
      setForm(empty)
      onRefresh()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" and all its screens?`)) return
    try {
      await multiplexesApi.delete(id)
      showToast('Multiplex deleted', 'success')
      onRefresh()
    } catch (err: any) { showToast(err.response?.data?.message || 'Delete failed', 'error') }
  }

  const handleAddScreen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!screenForm) return
    try {
      await multiplexesApi.addScreen(screenForm.mId, {
        screenNumber: Number(screenForm.screenNumber),
        totalRows: Number(screenForm.totalRows),
        totalColumns: Number(screenForm.totalColumns),
        capacity: Number(screenForm.capacity),
      })
      showToast('Screen added!', 'success')
      setScreenForm(null)
      onRefresh()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed', 'error')
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-left">
        <h3 className="panel-section-title">Add Multiplex</h3>
        <form className="admin-form" onSubmit={handleSubmit}>
          {[
            { label: 'Name', field: 'name', placeholder: 'PVR Cinemas' },
            { label: 'Location', field: 'location', placeholder: 'Address' },
            { label: 'City', field: 'city', placeholder: 'Mumbai' },
            { label: 'Total Screens', field: 'totalScreens', placeholder: '5' },
          ].map(({ label, field, placeholder }) => (
            <div key={field} className="form-group">
              <label className="form-label">{label}</label>
              <input className="form-input" placeholder={placeholder}
                value={(form as any)[field]}
                onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} required />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', marginTop: 8 }}>
            {saving ? 'Adding...' : 'Add Multiplex'}
          </button>
        </form>

        {screenForm && (
          <div style={{ marginTop: 24 }}>
            <h3 className="panel-section-title">Add Screen</h3>
            <form className="admin-form" onSubmit={handleAddScreen}>
              {[
                { label: 'Screen Number', field: 'screenNumber', placeholder: '1' },
                { label: 'Total Rows', field: 'totalRows', placeholder: '10' },
                { label: 'Total Columns', field: 'totalColumns', placeholder: '15' },
                { label: 'Capacity', field: 'capacity', placeholder: '150' },
              ].map(({ label, field, placeholder }) => (
                <div key={field} className="form-group">
                  <label className="form-label">{label}</label>
                  <input className="form-input" type="number" placeholder={placeholder}
                    value={(screenForm as any)[field]}
                    onChange={e => setScreenForm(p => p ? { ...p, [field]: e.target.value } : null)} required />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Screen</button>
                <button type="button" className="btn btn-ghost" onClick={() => setScreenForm(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="admin-panel-right">
        <h3 className="panel-section-title">All Multiplexes ({multiplexes.length})</h3>
        {multiplexes.length === 0 ? <p className="admin-empty">No multiplexes added yet.</p> : (
          <div className="admin-list">
            {multiplexes.map(m => (
              <div key={m.id} className="admin-list-item admin-list-item-column">
                <div className="admin-item-header">
                  <div>
                    <div className="admin-item-title">{m.name}</div>
                    <div className="admin-item-sub">{m.city} · {m.location} · {m.screens.length} screen(s)</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setScreenForm({ mId: m.id, screenNumber: 1, totalRows: 10, totalColumns: 15, capacity: 150 })}>
                      + Screen
                    </button>
                    <button className="admin-delete-btn" onClick={() => handleDelete(m.id, m.name)}>✕</button>
                  </div>
                </div>
                {m.screens.length > 0 && (
                  <div className="screen-chips">
                    {m.screens.map(s => (
                      <span key={s.id} className="screen-chip">
                        Sc.{s.screenNumber} ({s.capacity} seats)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const ShowsPanel: React.FC<{ movies: Movie[]; multiplexes: Multiplex[]; showToast: any }> = ({ movies, multiplexes, showToast }) => {
  const [form, setForm] = useState({ movieId: '', screenId: '', showTime: '', basePrice: 200 })
  const [saving, setSaving] = useState(false)
  const [shows, setShows] = useState<Show[]>([])

  const loadShows = () => showsApi.getAll().then(r => setShows(r.data.data))
  useEffect(() => { loadShows() }, [])

  const screens = multiplexes.flatMap(m => m.screens.map(s => ({ ...s, multiplexName: m.name })))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await showsApi.create({ ...form, basePrice: Number(form.basePrice), showTime: new Date(form.showTime).toISOString() })
      showToast('Show created! Seat map auto-generated.', 'success')
      setForm({ movieId: '', screenId: '', showTime: '', basePrice: 200 })
      loadShows()
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create show', 'error')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete the show for "${title}"?`)) return
    try {
      await showsApi.delete(id)
      showToast('Show deleted', 'success')
      loadShows()
    } catch (err: any) { showToast(err.response?.data?.message || 'Delete failed', 'error') }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-left" style={{ maxWidth: 480 }}>
        <h3 className="panel-section-title">Schedule New Show</h3>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Movie</label>
            <select className="form-input" value={form.movieId} onChange={e => setForm(p => ({ ...p, movieId: e.target.value }))} required>
              <option value="">Select movie</option>
              {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Screen</label>
            <select className="form-input" value={form.screenId} onChange={e => setForm(p => ({ ...p, screenId: e.target.value }))} required>
              <option value="">Select screen</option>
              {screens.map(s => <option key={s.id} value={s.id}>{s.multiplexName} — Screen {s.screenNumber} ({s.capacity} seats)</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Show Date & Time</label>
            <input className="form-input" type="datetime-local" value={form.showTime}
              onChange={e => setForm(p => ({ ...p, showTime: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Base Price (₹)</label>
            <input className="form-input" type="number" min={50} value={form.basePrice}
              onChange={e => setForm(p => ({ ...p, basePrice: Number(e.target.value) }))} required />
          </div>
          <p className="form-hint">The seat map will be auto-generated from screen seats. Premium = 1.5x, Recliners = 2x base price.</p>
          <button type="submit" className="btn btn-primary" disabled={saving || movies.length === 0 || screens.length === 0}
            style={{ width: '100%', marginTop: 8 }}>
            {saving ? 'Creating...' : 'Create Show'}
          </button>
          {(movies.length === 0 || screens.length === 0) && (
            <p className="error-msg" style={{ marginTop: 10 }}>
              <TriangleAlert size={13} style={{ display: 'inline', marginRight: 6 }} />
              Add movies and multiplex screens first.
            </p>
          )}
        </form>
      </div>

      <div className="admin-panel-right">
        <h3 className="panel-section-title">Upcoming Shows ({shows.length})</h3>
        {shows.length === 0 ? (
          <p className="admin-empty">No upcoming shows scheduled.</p>
        ) : (
          <div className="admin-list">
            {shows.map(s => (
              <div key={s.id} className="admin-list-item">
                <div className="admin-item-info">
                  <div className="admin-item-title">{s.movie.title}</div>
                  <div className="admin-item-sub">
                    {s.screen.multiplex.name} · Screen {s.screen.screenNumber} · {new Date(s.showTime).toLocaleString()} · ₹{s.basePrice}
                  </div>
                </div>
                <button className="admin-delete-btn" onClick={() => handleDelete(s.id, s.movie.title)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
