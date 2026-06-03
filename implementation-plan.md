# Football Prediction Contest App — Implementation Plan

**Stack**: Next.js 14 (App Router) · TypeScript · PostgreSQL (Supabase) · Tailwind CSS · JWT (custom auth) · pg (raw queries)  
**Total estimate**: 14–18 days

---

## Phase 1 — Project setup `1–2 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 1 | Init Next.js 14 with App Router + TypeScript | Frontend | 2h |
| 2 | Configure Tailwind CSS with custom design tokens (dark theme) | Frontend, UI | 1h |
| 3 | Set up Supabase project + PostgreSQL connection (raw pg) | Database | 1h |
| 4 | Configure environment variables (.env.local) | Backend | 30m |
| 5 | Set up ESLint, Prettier, path aliases | Frontend | 30m |
| 6 | Create folder structure: app/, lib/, components/, types/ | Frontend | 30m |

---

## Phase 2 — Database schema `1 day`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 7 | Create `users` table (id, name, phone, pin_hash, role, is_active) | Database | 30m |
| 8 | Create `matches` table (id, team_home, team_away, match_time, deadline, status) | Database | 30m |
| 9 | Create `questions` table (id, match_id, type, label, points) | Database | 30m |
| 10 | Create `predictions` table (id, user_id, match_id, question_id, answer) | Database | 30m |
| 11 | Create `results` table (id, match_id, question_id, correct_answer) | Database | 20m |
| 12 | Create `scores` table (id, user_id, match_id, points) | Database | 20m |
| 13 | Seed admin user + sample matches for testing | Database | 30m |

---

## Phase 3 — Auth system `1–2 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 14 | Build `POST /api/auth/login` — verify phone + bcrypt PIN | Backend, Auth | 1h |
| 15 | Issue JWT with userId + role, set httpOnly cookie | Backend, Auth | 45m |
| 16 | Build Next.js middleware — protect `/admin/*` routes | Backend, Auth | 1h |
| 17 | Build `useAuth()` hook — read JWT from cookie client-side | Frontend, Auth | 45m |
| 18 | Build `/login` page — animated PIN input + phone field | Frontend, UI | 2h |
| 19 | `POST /api/auth/logout` — clear cookie | Backend, Auth | 20m |

---

## Phase 4 — Core components `2–3 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 20 | `CountdownTimer` — live tick, color-coded urgency (violet → amber → red) | Frontend, UI | 2h |
| 21 | `MatchCard` — teams, countdown, status badge, CTA button | Frontend, UI | 2h |
| 22 | `TeamOptionButton` — ripple effect, selected state | Frontend, UI | 1h |
| 23 | `ScoreStepper` — +/- animated number input for scoreline | Frontend, UI | 1h |
| 24 | `PinInput` — 4 individual animated boxes, auto-advance focus | Frontend, UI | 1.5h |
| 25 | `StatCard` — metric card with count-up animation | Frontend, UI | 1h |
| 26 | `ResultRow` — prediction vs result reveal with animation | Frontend, UI | 1.5h |
| 27 | `AdminSidebar` — persistent nav, active state, icons | Frontend, UI | 1.5h |
| 28 | `ConfettiBlast` — triggered on perfect 11/11 score | Frontend, UI | 1h |
| 29 | Toast notification system (success / error) | Frontend, UI | 1h |

---

## Phase 5 — User APIs `2 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 30 | `GET /api/matches` — list all matches with status | Backend, API | 1h |
| 31 | `GET /api/matches/[id]` — single match + questions | Backend, API | 45m |
| 32 | `POST /api/matches/[id]/predict` — submit prediction (deadline check) | Backend, API | 1.5h |
| 33 | `GET /api/matches/[id]/my-prediction` — fetch own answers | Backend, API | 45m |
| 34 | `GET /api/leaderboard` — ranked list with points | Backend, API | 1h |
| 35 | `GET /api/history` — user own prediction history + points | Backend, API | 1h |
| 36 | `GET /api/matches/[id]/result` — match result + user score breakdown | Backend, API | 1h |

---

## Phase 6 — User pages `2–3 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 37 | `/matches` — match list with live countdowns + status badges | Frontend | 2h |
| 38 | `/matches/[id]/predict` — 3-question form with animations | Frontend | 3h |
| 39 | `/matches/[id]/result` — reveal animation + points summary card | Frontend | 2h |
| 40 | `/leaderboard` — podium top 3 + ranked table with shimmer | Frontend | 2.5h |
| 41 | `/history` — stats strip + match history cards | Frontend | 2h |
| 42 | `/matches/[id]/closed` — closed state page | Frontend | 30m |
| 43 | `/unauthorized` — access denied page | Frontend | 30m |

---

## Phase 7 — Admin APIs `1–2 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 44 | `POST /api/admin/users` — create user with phone + hashed PIN | Backend, API | 1h |
| 45 | `PATCH /api/admin/users/[id]` — activate / deactivate | Backend, API | 30m |
| 46 | `POST /api/admin/matches` — create match + set deadline | Backend, API | 1h |
| 47 | `PUT /api/admin/matches/[id]/questions` — save questions config | Backend, API | 1h |
| 48 | `POST /api/admin/matches/[id]/results` — save results + calculate points | Backend, API | 2h |
| 49 | `GET /api/admin/matches/[id]/entries` — all user submissions | Backend, API | 45m |
| 50 | `GET /api/admin/dashboard` — stats counts | Backend, API | 45m |

---

## Phase 8 — Admin pages `2 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 51 | `/admin` — dashboard with stat cards + activity feed | Frontend | 2h |
| 52 | `/admin/users` — user table + create user modal | Frontend | 2h |
| 53 | `/admin/matches` — match list with status tabs + create modal | Frontend | 2h |
| 54 | `/admin/matches/[id]/questions` — question config cards | Frontend | 1.5h |
| 55 | `/admin/matches/[id]/entries` — entries table with correct/wrong icons | Frontend | 1.5h |
| 56 | `/admin/matches/[id]/results` — result entry form + calculate + publish | Frontend | 2h |
| 57 | `/admin/leaderboard` — leaderboard with override + export CSV | Frontend | 1.5h |

---

## Phase 9 — Polish & deploy `1–2 days`

| # | Task | Tags | Effort |
|---|------|------|--------|
| 58 | Page transition animations (fade + slide up, 300ms) | Frontend, UI | 1h |
| 59 | Card stagger entrance animations across all pages | Frontend, UI | 1h |
| 60 | Particle background on login screen (canvas) | Frontend, UI | 1h |
| 61 | Football pitch SVG background pattern (opacity 0.04) | Frontend, UI | 45m |
| 62 | Mobile responsive check — all 15 pages | Frontend | 2h |
| 63 | API error handling + loading states everywhere | Backend, Frontend | 2h |
| 64 | Deploy to Vercel + configure Supabase env vars | Backend | 1h |

---

## Summary

| Phase | Description | Estimate |
|-------|-------------|----------|
| 1 | Project setup | 1–2 days |
| 2 | Database schema | 1 day |
| 3 | Auth system | 1–2 days |
| 4 | Core components | 2–3 days |
| 5 | User APIs | 2 days |
| 6 | User pages | 2–3 days |
| 7 | Admin APIs | 1–2 days |
| 8 | Admin pages | 2 days |
| 9 | Polish & deploy | 1–2 days |
| **Total** | | **14–18 days** |

---

## Scoring logic (reference)

```
Match winner correct  → 2 pts
Top scorer correct    → 2 pts
Exact scoreline       → 4 pts
All 3 correct bonus   → 3 pts
─────────────────────────────
Max per match         → 11 pts
```

---

## Color tokens

```css
--bg-base:       #0A0A0F
--bg-surface:    #10101A
--bg-card:       rgba(255,255,255,0.04)
--border-card:   rgba(255,255,255,0.08)
--accent-violet: #7C6FF7
--accent-teal:   #1DC98A
--accent-amber:  #F5A623
--accent-red:    #F04B4B
--text-primary:  #F0F0F5
--text-secondary:#8888A0
--text-muted:    #44445A
--gold:          #FFD700
--silver:        #C0C0C0
--bronze:        #CD7F32
```

---

## Animation tokens

```css
--transition-base:    200ms ease-out
--transition-page:    300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
--stagger-delay:      60ms
--count-up-duration:  800ms ease-out
```
