# Pedagogical Monitoring SaaS

A Next.js 15 + Prisma + PostgreSQL SaaS app to track pedagogical progress of university modules (Course / TD / TP), with delays, alerts, and meeting reports. Seeded with the **real S5–S9 curriculum** (L3, M1, M2).

## Stack

- **Next.js 15** (App Router, fullstack) + **TypeScript**
- **PostgreSQL 15** + **Prisma ORM**
- **TailwindCSS** (Linear/Notion-style UI, dark/light mode)
- **Recharts** (bar / pie / line)
- **JWT** auth in an httpOnly cookie + per-route role checks
- **Docker Compose** for one-command deploy
- **Adminer** + **Prisma Studio** bundled for full DB visibility

## Quick start

> **Step-by-step instructions for Windows / macOS / Linux are in [SETUP.md](SETUP.md).**

```bash
docker compose up --build
```

Two services start by default:

| URL                   | Service                   | Login                                                                                       |
| --------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| http://localhost:3001 | **App**                   | demo accounts below                                                                         |
| http://localhost:8080 | **Adminer** (web SQL GUI) | System=`PostgreSQL`, Server=`db`, User=`postgres`, Password=`postgres`, DB=`pedagogical_db` |

To also start **Prisma Studio** (opt-in, since port 5555 is often taken):

```bash
docker compose --profile studio up
# http://localhost:5555  (or:  STUDIO_PORT=5556 docker compose --profile studio up)
```

Override any port:

```bash
APP_PORT=4000 ADMINER_PORT=9090 docker compose up
```

## Demo accounts

All passwords: `password123`.

| Email                    | Role      | Can do                                                   |
| ------------------------ | --------- | -------------------------------------------------------- |
| `admin@univ.edu`         | admin     | edit progress on **any** module, see Database admin page |
| `committee@univ.edu`     | committee | read-only across the app                                 |
| `<module_slug>@univ.edu` | professor | log progress **only on the module they teach**           |

There's one professor per module. Their email is a slug of the module name. To get the full list:

```bash
docker compose logs app | grep "@univ.edu"
```

Examples: `compilation@univ.edu`, `machine_learning@univ.edu`, `deep_learning@univ.edu`, `gestion_de_projets@univ.edu`, `vision_par_ordinateur@univ.edu`, …

## What's seeded

34 modules across 5 semesters of computer-science curriculum:

- **L3 — S5**: Architecture des BDD, Compilation, Programmation Linéaire, Analyse numérique 1, Génie logiciel, Fondements de l'IA, Développement mobile
- **L3 — S6**: BDD réparties, Système d'exploitation (Sync & Comm), Gestion de projets, Programmation WEB, Analyse numérique 2, Sécurité informatique
- **M1 — S7**: Représentation des connaissances, Calcul haute performance, Machine Learning, Modélisation et simulation, Business Intelligence, Recherche opérationnelle, Techniques de rédaction
- **M1 — S8**: Sécurité des données, Deep Learning, NLP, Données massives, Calcul distribué + IA, Traitement d'image, Projet pluridisciplinaire
- **M2 — S9**: Visualisation, Vision par ordinateur, Generative AI, Bio-inspirées, Blockchain, Recherche d'information, Séminaire & workshops

C/TD/TP planned hours are derived from the per-week × 14-week VHS values. Each module has 1 assigned professor and a small history of progress logs; ~12% of modules start in the `delayed` state with a critical alert.

## Roles & permissions

| Action                                      | admin | committee | owning professor       | other professor |
| ------------------------------------------- | ----- | --------- | ---------------------- | --------------- |
| View dashboard / modules / alerts / reports | ✅    | ✅        | ✅                     | ✅              |
| Log hours on a module                       | ✅    | ❌        | ✅ (only their module) | ❌              |
| Database admin page                         | ✅    | ❌        | ❌                     | ❌              |

Permissions are enforced both in [the API](src/app/api/progress/update/route.ts) (HTTP 403) and in [the UI](<src/app/(app)/modules/[id]/page.tsx>) (form replaced by an explanatory notice).

## Where the database lives

- **PostgreSQL** in container `pedagogical-monitor-db-1`
- **Persisted** in Docker volume `db_data` (survives `down`, dies with `down -v`)
- **From your host**: `localhost:5432`, user `postgres`, password `postgres`, db `pedagogical_db`
- **From inside the app container**: `db:5432`

### Three ways to inspect / edit data

1. **In-app Database admin page** — sign in as admin → "Database admin" in the sidebar. Shows row counts per table, users, recent progress logs, recent alerts.
2. **Adminer** at http://localhost:8080 — full SQL web GUI: browse, run queries, edit/delete rows, export.
3. **Prisma Studio** at http://localhost:5555 (after `docker compose --profile studio up`) — model-aware visual editor with relations.

You can also drop into a SQL shell:

```bash
docker compose exec db psql -U postgres -d pedagogical_db
```

## Project layout

```
prisma/
  schema.prisma            # users, modules, module_components, progress_logs,
                           # alerts, reports, report_modules, notifications
  seed.ts                  # full S5-S9 curriculum + one professor per module
src/
  app/
    api/
      auth/login/          # POST /api/auth/login   sets cookie
      auth/logout/         # GET  /api/auth/logout  clears cookie
      me/                  # GET  /api/me           current session
      modules/             # GET/POST /api/modules, GET/DELETE /api/modules/[id]
      progress/update/     # POST /api/progress/update  (role-checked)
      alerts/              # GET/PATCH /api/alerts
      reports/             # GET/POST /api/reports
    (app)/                 # authenticated app shell
      dashboard/           # KPIs + per-semester chart + status pie + log line
      modules/             # list + detail (with role-gated Log progress form)
      alerts/
      reports/
      admin/               # admin-only DB overview
    login/
  components/
    Sidebar.tsx            # nav + user info + admin shortcuts
    UpdateProgressForm.tsx # client form for /api/progress/update
    charts/DashboardCharts.tsx
    ui/                    # card, badge primitives
  lib/
    prisma.ts              # singleton Prisma client
    auth.ts                # JWT sign/verify + getSession()
    progress.ts            # progress %, delay detection, status derivation
  middleware.ts            # cookie check; redirects unauth to /login
```

## Business logic

- **Component progress** = `completed_hours / planned_hours * 100`
- **Module progress** = average of its C, TD, TP components
- **Delay** = `now() > end_date AND completed_hours < planned_hours` → status flips to `delayed` and a critical alert is created when progress is updated.

## API routes

| Method | Route                  | Auth                | Purpose                                     |
| ------ | ---------------------- | ------------------- | ------------------------------------------- | ------- |
| POST   | `/api/auth/login`      | public              | Email + password → sets `auth_token` cookie |
| GET    | `/api/auth/logout`     | public              | Clears cookie, redirects to `/login`        |
| GET    | `/api/me`              | any                 | Current session user                        |
| GET    | `/api/modules`         | any                 | List modules with components & progress     |
| POST   | `/api/modules`         | any                 | Create a module (auto-creates C/TD/TP)      |
| GET    | `/api/modules/[id]`    | any                 | Module detail                               |
| DELETE | `/api/modules/[id]`    | any                 | Delete module (cascades)                    |
| POST   | `/api/progress/update` | admin / owning prof | Add hours to a component, log + alert       |
| GET    | `/api/alerts`          | any                 | List alerts (`?resolved=true                | false`) |
| PATCH  | `/api/alerts`          | any                 | Toggle resolved                             |
| GET    | `/api/reports`         | any                 | List meeting reports                        |
| POST   | `/api/reports`         | any                 | Create report linked to modules             |

## Useful commands

```bash
docker compose up --build       # full deploy (app + db + adminer)
docker compose --profile studio up   # also starts Prisma Studio
docker compose down             # stop, keep data
docker compose down -v          # stop + drop the database volume
docker compose logs -f app      # tail app logs
docker compose logs app | grep "@univ.edu"   # see all professor accounts

docker compose exec app npx tsx prisma/seed.ts                # idempotent re-seed
docker compose exec -e FORCE_SEED=true app npx tsx prisma/seed.ts   # force wipe + reseed
docker compose exec db psql -U postgres -d pedagogical_db     # SQL shell
```

## Deploying to Vercel / Render

- Set `DATABASE_URL` (Supabase, Neon, Render Postgres, etc.) and `JWT_SECRET` in Vercel Environment Variables.
- Build command: `npm run build` (runs `prisma generate` first).
- Start command: `next start` (Vercel handles this automatically).
- After first deploy, run `npm run db:deploy` to apply migrations, or `npm run db:push` if you are using schema push instead of migrations.
- If you want sample data in the remote database, run locally with the production `DATABASE_URL` set:

```bash
npx prisma db push
FORCE_SEED=true npx prisma db seed
```
