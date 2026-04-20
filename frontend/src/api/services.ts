import api from './axios'
import type { Movie, Multiplex, Show, SeatMapEntry, Booking, ApiResponse } from '../types'

// ---- Auth ----
export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string; adminKey?: string }) =>
    api.post<ApiResponse<{ user: any; tokens: { accessToken: string; refreshToken: string } }>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: any; tokens: { accessToken: string; refreshToken: string } }>>('/auth/login', data),
}

// ---- Movies ----
export const moviesApi = {
  getAll: () => api.get<ApiResponse<Movie[]>>('/movies'),
  getById: (id: string) => api.get<ApiResponse<Movie>>(`/movies/${id}`),
  create: (data: Omit<Movie, 'id' | 'createdAt'>) => api.post<ApiResponse<Movie>>('/movies', data),
  update: (id: string, data: Partial<Movie>) => api.patch<ApiResponse<Movie>>(`/movies/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/movies/${id}`),
}

// ---- Multiplexes ----
export const multiplexesApi = {
  getAll: () => api.get<ApiResponse<Multiplex[]>>('/multiplexes'),
  getById: (id: string) => api.get<ApiResponse<Multiplex>>(`/multiplexes/${id}`),
  create: (data: Omit<Multiplex, 'id' | 'screens'>) => api.post<ApiResponse<Multiplex>>('/multiplexes', data),
  addScreen: (id: string, data: { screenNumber: number; totalRows: number; totalColumns: number; capacity: number }) =>
    api.post<ApiResponse<any>>(`/multiplexes/${id}/screens`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/multiplexes/${id}`),
}

// ---- Shows ----
export const showsApi = {
  getAll: (params?: { movieId?: string; city?: string }) => api.get<ApiResponse<Show[]>>('/shows', { params }),
  getById: (id: string) => api.get<ApiResponse<Show>>(`/shows/${id}`),
  getSeatMap: (id: string) => api.get<ApiResponse<SeatMapEntry[]>>(`/shows/${id}/seats`),
  create: (data: { movieId: string; screenId: string; showTime: string; basePrice: number }) =>
    api.post<ApiResponse<Show>>('/shows', data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/shows/${id}`),
}

// ---- Bookings ----
export const bookingsApi = {
  create: (data: { showId: string; showSeatIds: string[] }) => api.post<ApiResponse<Booking>>('/bookings', data),
  getAll: () => api.get<ApiResponse<Booking[]>>('/bookings'),
  getById: (id: string) => api.get<ApiResponse<Booking>>(`/bookings/${id}`),
  cancel: (id: string) => api.post<ApiResponse<Booking>>(`/bookings/${id}/cancel`),
}

// ---- Payments ----
export const paymentsApi = {
  pay: (bookingId: string, data: { paymentMethod: string }) =>
    api.post<ApiResponse<any>>(`/payments/${bookingId}/pay`, data),
}

// ---- Admin Repair ----
export const repairApi = {
  repairSeatMaps: () => api.post<ApiResponse<{ screensFixed: number; showsFixed: number }>>('/shows/repair-seats'),
}
