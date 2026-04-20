import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { bookingsApi } from '../../api/services'
import { useToast } from '../../context/ToastContext'
import { Ticket, CalendarDays, Clock, Armchair } from 'lucide-react'
import type { Booking } from '../../types'
import { onPosterError, posterSrc } from '../../utils/placeholder'
import './MyBookings.css'

const STATUS_COLORS: Record<string, string> = {
  CREATED: '#9d9ba5',
  PENDING_PAYMENT: '#f0a040',
  CONFIRMED: '#52b788',
  CANCELLED: '#e63946',
}

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    bookingsApi.getAll()
      .then(r => setBookings(r.data.data))
      .catch(() => showToast('Failed to load bookings', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="my-bookings-page">
      <div className="container">
        <div className="page-header fade-up">
          <div>
            <h1 className="page-title">My Bookings</h1>
            <p className="page-sub">Track all your movie bookings in one place</p>
          </div>
        </div>

        <div className="status-tabs fade-up">
          {['ALL', 'CREATED', 'CONFIRMED', 'CANCELLED'].map(s => (
            <button
              key={s}
              className={`status-tab ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
              <span className="tab-count">
                {s === 'ALL' ? bookings.length : bookings.filter(b => b.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="spinner" />
        ) : filtered.length === 0 ? (
          <div className="empty-state fade-up">
            <Ticket size={40} style={{ margin: '0 auto 12px', display: 'block', color: 'var(--text-muted)' }} />
            <p>{filter === 'ALL' ? "You haven't booked anything yet" : `No ${filter.toLowerCase()} bookings`}</p>
            {filter === 'ALL' && <Link to="/shows" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Shows</Link>}
          </div>
        ) : (
          <div className="bookings-list fade-up">
            {filtered.map(b => <BookingCard key={b.id} booking={b} />)}
          </div>
        )}
      </div>
    </div>
  )
}

const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
  const showDate = new Date(booking.show.showTime)

  return (
    <Link to={`/booking/${booking.id}`} className="booking-card">
      <div className="booking-card-poster">
        <img
          src={posterSrc(booking.show.movie.posterUrl)}
          alt={booking.show.movie.title}
          onError={onPosterError}
        />
      </div>
      <div className="booking-card-info">
        <h3 className="booking-movie">{booking.show.movie.title}</h3>
        <p className="booking-venue">{booking.show.screen?.multiplex?.name || '—'}</p>
        <div className="booking-meta">
          <span><CalendarDays size={12} /> {showDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          <span><Clock size={12} /> {showDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
          <span><Armchair size={12} /> {booking.seatCount} seat{booking.seatCount > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="booking-card-right">
        <div className="booking-status" style={{ color: STATUS_COLORS[booking.status] }}>
          {booking.status.replace('_', ' ')}
        </div>
        <div className="booking-amount">₹{booking.totalAmount.toFixed(2)}</div>
        <div className="booking-id">#{booking.id.slice(0, 8).toUpperCase()}</div>
      </div>
    </Link>
  )
}

export default MyBookings
