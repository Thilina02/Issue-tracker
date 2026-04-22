# Issue Tracker (Next.js + MongoDB)

Single-app issue tracker built with Next.js App Router.  
Backend logic is handled inside `app/api/*` Route Handlers (no separate Express server).

## Features implemented

- JWT cookie authentication (register, login, logout, current user)
- Secure password hashing with `bcryptjs`
- Full issue CRUD (create, list, detail, update, delete)
- Status actions with confirmation (`RESOLVED`, `CLOSED`)
- Search by keyword with debounced API requests
- Filter by status and priority
- Paginated issue listing
- Issue counts by status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
- Light/dark mode toggle
- Cinematic dashboard UI + integrated 3D model panel

## Tech stack

- Next.js 15 + React 19 + TypeScript
- MongoDB + Mongoose
- Tailwind CSS v4
- JWT (`jsonwebtoken`)
- 3D rendering: `three`, `@react-three/fiber`, `@react-three/drei`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env
```

3. Set environment values in `.env`:

- `MONGODB_URI`
- `JWT_SECRET`

4. Start development:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/issues`
- `POST /api/issues`
- `GET /api/issues/:id`
- `PUT /api/issues/:id`
- `DELETE /api/issues/:id`

## Notes

- The provided 3D asset is served through `GET /api/assets/model`.
- The API expects authenticated requests via secure HTTP-only cookie.
