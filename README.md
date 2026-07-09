# Cricket Auction Platform

A production-ready live cricket player auction application: an admin
control room, a real-time bidding engine, and a big-screen projector
display — built for a real tournament with a room full of spectators
watching one screen.

Everything is wired end to end. The React frontend talks to the real
Express/MongoDB backend over REST for setup (teams, players, history) and
over Socket.io for the live auction itself (timer, bids, sold/unsold),
with every connected browser — admin consoles and the projector alike —
updating instantly and without a page refresh.

## Features

**Real-time auction engine**
- Admin starts/pauses/resumes/resets the auction; one player active at a time
- 30-second per-lot timer (pause / resume / reset), auto-restarts on every new lot
- Increase / decrease the bid, select the bidding team, open/close the bidding floor
- Sold / Unsold, with automatic hands-free advance to the next player
- Every purse and squad-size change is persisted and broadcast instantly

**Admin panel**
- JWT login/logout (no public sign-up — bootstrapped via a seed script)
- Full Team CRUD with logo upload and a brand color picker
- Full Player CRUD with photo upload
- Bulk player import from CSV, with per-row error reporting
- Auction results export to CSV
- Reset / Pause / Resume the auction from the control room

**Projector screen**
- Large player photo, huge current-bid readout, countdown ring, leading team, remaining purse
- Sold / Unsold animations, a winning-team color wash, and a confetti burst on every sale
- Synthesized sound effects (no external audio files) with a one-tap "enable sound" unlock
- Public, unauthenticated, and read-only — safe to leave open on a shared display

**Everything else you'd expect from a finished app**
- MVC backend with express-validator on every write, centralized error handling, rate limiting, gzip compression
- Route-level code splitting on the frontend for a lean initial bundle
- Deploy configs for Vercel (frontend), Render (backend), and MongoDB Atlas

## Stack

**Frontend:** React + TypeScript + Vite + Tailwind CSS + Framer Motion + React Router + Axios + Socket.io Client
**Backend:** Node.js + Express + MongoDB + Mongoose + Socket.io + JWT + Multer, all in TypeScript

## Project layout

```
cricket-auction/
├── client/                        # React frontend
│   └── src/
│       ├── components/
│       │   ├── common/            # Button, Card, Badge, Modal, ConfirmDialog, PlayerPhoto, Confetti, ...
│       │   ├── admin/              # TeamFormModal, PlayerFormModal, CsvImportModal
│       │   └── layout/             # Navbar, Sidebar, Footer, Topbar, MobileSidebar
│       ├── pages/                  # Home, AdminLogin, Dashboard, Teams, Players, LiveAuction,
│       │                           # AuctionHistory, Settings, ProjectorScreen, NotFound
│       ├── layouts/                # MainLayout, AuthLayout, DashboardLayout
│       ├── hooks/                  # useAuth, useAuctionEngine (the real-time engine client)
│       ├── services/               # api, authService, teamService, playerService, auctionService,
│       │                           # bidService, historyService, socket
│       ├── context/                # AuthContext
│       ├── types/                  # Shared TypeScript interfaces
│       ├── utils/                  # constants, helpers, sound (Web Audio effects)
│       └── routes/                 # AppRoutes — centralized, lazy-loaded routing
├── vercel.json                    # (client/) Vercel SPA rewrite + asset caching
└── server/                        # Express backend
    └── src/
        ├── controllers/           # auth, team, player, auction, bid, history
        ├── services/              # auctionService — the engine's single source of truth,
        │                          # shared by REST controllers and Socket.io handlers
        ├── routes/                # one router per resource, mounted under /api
        ├── models/                # Admin, Team, Player, Auction, Bid, History (Mongoose)
        ├── validators/            # express-validator rule sets per resource
        ├── middleware/            # authMiddleware, errorMiddleware, uploadMiddleware, validateMiddleware
        ├── config/                # env, db
        ├── scripts/               # seedAdmin.ts, seedData.ts
        ├── utils/                 # csv (import/export)
        └── socket/                # ioInstance, timerEngine, auctionHandlers — the Socket.io layer
        └── render.yaml            # Render Blueprint for the backend service
```

## Design system

- **Palette:** deep navy backgrounds (`navy-900`/`950`), gold accent (`gold-500`/`400`), ivory text.
- **Type:** Rajdhani for display/headings (a condensed, scoreboard-adjacent face), Inter for body copy, JetBrains Mono for numeric "LED scoreboard" readouts (`.led-digit`).
- **Signature motif:** a stitched "seam divider" referencing a cricket ball's seam, glowing scoreboard-style digits, and glassmorphism panels.
- Dark mode is the only mode, matching a projector/stadium screen context.

## Getting started

You need a MongoDB instance — either a local `mongod` or a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### Backend

```bash
cd server
cp .env.example .env      # fill in MONGO_URI at minimum; defaults work for local dev
npm install
npm run seed               # creates the first admin from SEED_ADMIN_* env vars
npm run seed:data          # (optional) seeds 8 demo teams + 20 demo players + a draft auction
npm run dev                 # starts on http://localhost:5000
```

There is no public registration endpoint — `npm run seed` is the only way
to get the first admin into the database. Once signed in, that admin can
create further admin accounts via `POST /api/auth/register`.

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev                # starts on http://localhost:5173
```

Sign in at `/admin/login` with the seeded admin credentials
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, defaulting to
`admin@auctionnight.com` / `Admin@123`), open **Live Auction**, and hit
**Start Auction**. Open `/projector` in a second tab to watch it mirror
instantly — no login required there.

## The real-time engine

`useAuctionEngine` (frontend) joins a Socket.io room per auction and keeps
local state in sync with every server broadcast; `auctionService.ts`
(backend) is the single place that mutates auction state, called by both
the REST controllers and the Socket.io handlers so the two transports can
never drift apart.

| Client → server (admin only) | What it does |
|---|---|
| `auction:start` | Loads the first lot, starts the timer |
| `timer:pause` / `timer:resume` / `timer:reset` | Per-lot countdown control |
| `bid:increase` / `bid:decrease` | Adjusts the current bid by a preset or custom amount |
| `team:select` | Assigns the current bid to a team, records it in the ledger |
| `bidding:open` / `bidding:close` | Gates whether bids can be adjusted — sold/unsold require it closed |
| `lot:sold` / `lot:unsold` | Resolves the lot; auto-advances after a few seconds |
| `lot:next` | Manual override to force the next lot |

| Server → room (broadcast) | When |
|---|---|
| `state:sync` | Sent to a socket right when it joins — full snapshot, no refresh needed |
| `auction:lot-changed` / `auction:lot-closed` / `auction:completed` / `auction:reset` | Lot lifecycle |
| `timer:update` | Every second while the timer runs, and on every state change |
| `bid:updated` / `auction:bid-placed` / `bidding:changed` | Bidding activity |

## Backend API

All routes are mounted under `/api`. GET endpoints are public; every
write goes through `protect` (JWT via cookie or `Authorization: Bearer`)
and request-body/query validation.

| Resource | Routes |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register` (admin-only), `POST /auth/logout`, `GET /auth/me` |
| Teams | `GET/POST /teams`, `GET/PUT/DELETE /teams/:id` — `POST`/`PUT` accept a `logo` file and a `color` hex field |
| Players | `GET/POST /players`, `GET/PUT/DELETE /players/:id`, `POST /players/import` (CSV) — search via `?search=`, filter via `?status=`/`?role=` |
| Auctions | `GET/POST /auctions`, `GET/PUT/DELETE /auctions/:id`, lifecycle `:id/start`, `:id/pause`, `:id/resume`, `:id/end`, `:id/reset`, and lot actions `:id/next-lot`, `:id/sold`, `:id/unsold` |
| Bids | `GET /bids`, `POST /bids` |
| History | `GET /history`, `GET /history/stats` (dashboard aggregates), `GET /history/export` (CSV download), `GET /history/:id`, `DELETE /history/:id` (admin undo) |

## Deployment

### 1. MongoDB Atlas

Create a free cluster, add a database user, allow network access from
anywhere (or Render's IPs), and copy the SRV connection string into
`MONGO_URI`.

### 2. Backend on Render

Push this repo to GitHub, then in Render: **New > Blueprint**, point it at
the repo — `server/render.yaml` describes the service. Fill in the
`sync: false` env vars in the Render dashboard (`CLIENT_URL`, `MONGO_URI`,
`SEED_ADMIN_*`). After the first deploy, run the seed scripts once via
Render's shell (**Service > Shell**):

```bash
npm run seed
npm run seed:data   # optional demo data
```

Note: uploaded photos/logos are written to local disk and Render's free
tier filesystem is ephemeral (wiped on redeploy). Attach a persistent Disk
for uploads to survive deploys, or swap `uploadMiddleware.ts`'s storage
engine for an S3-compatible bucket — see the comment at the top of
`server/render.yaml`.

### 3. Frontend on Vercel

Import the repo in Vercel, set the project root to `client/`. Vercel
auto-detects Vite; `client/vercel.json` adds the SPA rewrite React Router
needs. Set `VITE_API_BASE_URL` and `VITE_SOCKET_URL` to your Render URL.

### 4. Connect them

Update the backend's `CLIENT_URL` to include your Vercel URL
(comma-separated if you're keeping local dev working too), and redeploy.

## Scripts

| Location | Command | Does |
|---|---|---|
| `server/` | `npm run dev` | Dev server with reload (nodemon + ts-node) |
| `server/` | `npm run build` / `npm start` | Compile to `dist/` and run it |
| `server/` | `npm run seed` | Create/update the first admin from env vars |
| `server/` | `npm run seed:data` | Reset to 8 demo teams, 20 demo players, one draft auction |
| `client/` | `npm run dev` | Vite dev server (proxies `/api`, `/uploads`, `/socket.io` to :5000) |
| `client/` | `npm run build` | Type-check + production build to `dist/` |

## Known limitations

- Uploaded files live on local disk — see the Render note above for production persistence.
- Player/Team pools are global rather than scoped per auction/season, matching a single-event use case.
- No automated test suite — the engine and API were verified with scripted integration smoke tests during development (not committed), covering auth, CRUD, validation, the full bid/sell/reset lifecycle, and multi-client real-time sync.
#   n o m a n  
 