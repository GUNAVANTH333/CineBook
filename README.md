# CineBook

A full-stack cinema ticket booking platform built with React, Node.js, and PostgreSQL.

---

## Overview

CineBook lets users browse movies, select showtimes, pick seats, and pay — all in one flow. Admins manage movies, multiplexes, screens, and shows through a dedicated dashboard.

---

## Tech Stack

| Layer | Technology |
|:--- |:--- |
| Frontend | React 19, Vite, TypeScript, React Router v7 |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (access + refresh tokens), bcrypt |
| Validation | Zod |
| Icons | Lucide React |

---

## Project Structure

```
CineBook/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── models/
│   │   │   └── seat/
│   │   ├── adapters/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── utils/
│   └── prisma/
│       └── schema.prisma
│
└── frontend/
    └── src/
        ├── api/
        ├── components/
        ├── context/
        ├── pages/
        └── types/
```

---

## Design Patterns

| Pattern | Application |
|:--- |:--- |
| Repository Pattern | All database access isolated in repository classes |
| Service Layer | Business logic decoupled from HTTP controllers |
| Adapter Pattern | PaymentGatewayAdapter wraps the simulated payment provider |
| State Pattern | BookingStateMachine enforces valid status transitions |
| Factory Pattern | SeatFactory instantiates the correct seat class from the DB seat type |

## OOP Principles

| Principle | Application |
|:--- |:--- |
| Encapsulation | Services own business rules; repositories own data access |
| Abstraction | Abstract Seat class; controllers never touch the database |
| Inheritance | StandardSeat, PremiumSeat, ReclinerSeat extend abstract Seat |
| Polymorphism | calculatePrice(basePrice) behaves differently per seat type |

---

## Features

### Customer
- Register and login with JWT authentication
- Browse movies with search and genre filter
- View showtimes grouped by movie and venue
- Interactive seat map with Standard, Premium, and Recliner tiers
- Live price calculation based on seat type and base price
- Payment via UPI, Card, Net Banking, or Wallet
- Cinema-ticket styled booking confirmation with receipt
- Full booking history with status tracking

### Admin
- Add and delete movies
- Add multiplexes and screens (seats auto-generated on screen creation)
- Schedule shows with automatic seat map generation
- Admin role granted at registration using the admin key

---

## Concurrency Handling

- Optimistic locking via a version field on ShowSeat rows
- TTL seat locks — seats locked for 10 minutes on selection, auto-released on expiry or cancellation
- Prisma transactions wrap seat locking and booking creation atomically

---

## Documentation

| File | Contents |
|:--- |:--- |
| idea.md | Project overview, scope, features, OOP and pattern breakdown |
| ErDiagram.md | Entity-Relationship diagram |
| classDiagram.md | UML class diagram |
| sequenceDiagram.md | Booking flow sequence diagram |
| useCaseDiagram.md | Use case diagram |

---

## Running Locally

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database

### Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

The API runs on `http://localhost:5001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`. API calls are proxied to port 5001 via Vite config.

---

## Environment Variables

See `backend/.env.example` for all required variables.

| Variable | Description | Default |
|:--- |:--- |:--- |
| DATABASE_URL | PostgreSQL connection string | required |
| PORT | API server port | 5001 |
| NODE_ENV | development or production | development |
| JWT_ACCESS_SECRET | Secret for access tokens | required |
| JWT_REFRESH_SECRET | Secret for refresh tokens | required |
| JWT_ACCESS_EXPIRES_IN | Access token TTL | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token TTL | 7d |
| SEAT_LOCK_TTL_MINUTES | Seat lock duration in minutes | 10 |
| ADMIN_REGISTRATION_KEY | Key required to register as admin | cinebook-admin-2024 |
| FRONTEND_URL | Allowed CORS origin in production | http://localhost:5173 |

---

## Deployment

### Backend on Render

1. Connect the GitHub repo to Render
2. Set root directory to `backend`
3. Build command: `npm install && npm run build && npx prisma generate`
4. Start command: `npm start`
5. Add all environment variables from `.env.example`

### Frontend on Render

1. Add a Static Site in Render
2. Set root directory to `frontend`
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Add environment variable `VITE_API_URL` pointing to the deployed backend URL

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|:--- |:--- |:--- |:--- |
| POST | /api/auth/register | - | Register user |
| POST | /api/auth/login | - | Login |
| POST | /api/auth/refresh | - | Refresh access token |
| GET | /api/movies | - | List movies |
| POST | /api/movies | ADMIN | Create movie |
| DELETE | /api/movies/:id | ADMIN | Delete movie |
| GET | /api/multiplexes | - | List multiplexes |
| POST | /api/multiplexes | ADMIN | Create multiplex |
| POST | /api/multiplexes/:id/screens | ADMIN | Add screen |
| GET | /api/shows | - | List shows |
| GET | /api/shows/:id/seats | - | Seat map for a show |
| POST | /api/shows | ADMIN | Create show |
| POST | /api/bookings | USER | Create booking |
| GET | /api/bookings | USER | My bookings |
| GET | /api/bookings/:id | USER | Booking detail |
| POST | /api/bookings/:id/cancel | USER | Cancel booking |
| POST | /api/payments/:id/pay | USER | Process payment |
| GET | /api/health | - | Health check |

---

## Author

Gunavanth Reddy
