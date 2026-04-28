# Setup Guide (Windows / macOS / Linux)

This project ships with one supported path: **Docker Compose**. It works identically on every OS — you only need Docker installed. No Node, no Postgres, no Prisma CLI on the host.

---

## Step 1 — Install Docker

| OS | What to install | Verify |
|---|---|---|
| **Windows 10/11** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) (enable WSL 2 integration when prompted) | Open PowerShell → `docker --version` |
| **macOS** (Intel or Apple Silicon) | [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Open Terminal → `docker --version` |
| **Linux** (Ubuntu/Debian/Fedora/Arch) | [Docker Engine + Compose plugin](https://docs.docker.com/engine/install/) | `docker --version && docker compose version` |

After install, **make sure Docker is running** (whale icon in tray on Win/Mac, `sudo systemctl start docker` on Linux).

---

## Step 2 — Get the project

```bash
git clone <your-repo-url> pedagogical-monitor
cd pedagogical-monitor
```

(Or unzip the source folder and `cd` into it.)

---

## Step 3 — Start it

One command — same on every OS:

```bash
docker compose up --build
```

What this does:

1. Pulls **PostgreSQL 15** and starts it on port `5432`.
2. Builds the Next.js app image.
3. Waits for Postgres to be healthy.
4. Runs `prisma db push` → creates all tables.
5. Seeds demo data on first run only (won't overwrite your data on restart).
6. Starts the app on port **3001** (mapped from container port 3000).

When you see `Starting Next.js...` and `Ready in …`, open **http://localhost:3001**.

> **Port already in use?** Change the host port:
> ```bash
> # macOS/Linux
> APP_PORT=4000 docker compose up
> # Windows PowerShell
> $env:APP_PORT=4000; docker compose up
> # Windows CMD
> set APP_PORT=4000 && docker compose up
> ```

---

## Step 4 — Log in

All demo accounts use password `password123`:

| Email | Role |
|---|---|
| admin@univ.edu | admin |
| committee@univ.edu | committee |
| prof1@univ.edu | professor |
| prof2@univ.edu | professor |
| prof3@univ.edu | professor |
| prof4@univ.edu | professor |
| prof5@univ.edu | professor |

Professors can log progress directly from a module's detail page (Modules → click a module → "Log progress" form).

---

## Where is the database?

- **Container name**: `pedagogical-monitor-db-1`
- **Reachable from your host** at `localhost:5432`
- **Reachable from the app container** at `db:5432`
- **Credentials**: user `postgres`, password `postgres`, db `pedagogical_db`
- **Data lives in** the Docker volume `db_data` — survives `docker compose down`, wiped only by `docker compose down -v`.

Connect with any tool (TablePlus, DBeaver, pgAdmin, `psql`):
```
host=localhost port=5432 user=postgres password=postgres dbname=pedagogical_db
```

Or open a SQL shell inside the container:
```bash
docker compose exec db psql -U postgres -d pedagogical_db
```

Or use Prisma Studio (visual table editor) — works without installing anything globally:
```bash
docker compose exec app npx prisma studio
```
Then open http://localhost:5555 (you may need to expose port 5555 first, see "Tips" below).

---

## Common commands

```bash
docker compose up              # start (after first build)
docker compose up --build      # rebuild after code changes
docker compose down            # stop, keep data
docker compose down -v         # stop + DELETE all data
docker compose logs -f app     # tail app logs
docker compose logs -f db      # tail db logs
docker compose restart app     # restart just the app
docker compose exec app sh     # shell into app container
docker compose exec db psql -U postgres -d pedagogical_db    # SQL shell
```

Re-run the seed manually (clears data only if `FORCE_SEED=true`):

```bash
docker compose exec -e FORCE_SEED=true app npx tsx prisma/seed.ts
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop isn't running. Launch it. |
| `port is already allocated` | Something else uses 3001 or 5432. Change `APP_PORT` (see Step 3) or stop the other process. |
| App stuck on "Waiting for database..." | Wait ~30s on first build. If longer, run `docker compose logs db` to see Postgres errors. |
| Login says "Invalid credentials" | Seed didn't run. Run: `docker compose exec -e FORCE_SEED=true app npx tsx prisma/seed.ts` |
| You changed `schema.prisma` | `docker compose restart app` — entrypoint runs `prisma db push` automatically. |
| Want a clean slate | `docker compose down -v && docker compose up --build` |

---

## Optional: run without Docker

Only if you already have Node 20+ and Postgres 15+ installed locally:

```bash
cp .env.example .env       # edit DATABASE_URL to your local Postgres
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev                # http://localhost:3000
```

---

## Tips

- **Expose Prisma Studio**: add `- "5555:5555"` under `app.ports` in `docker-compose.yml`, then `docker compose exec app npx prisma studio`.
- **Reset everything in 3 keystrokes**: `docker compose down -v && docker compose up --build`.
- **On Windows**, prefer running `docker compose` from PowerShell or WSL — both work, CMD also works.
