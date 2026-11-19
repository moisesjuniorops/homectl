# HomeCtl

Home management app: pantry inventory, shopping list, to-dos, bills and household finances.

```
homectl/
├── api/        FastAPI + SQLModel (SQLite in dev, Postgres in production)
├── web/        React + Vite + Mantine (UI, charts) + Tabler Icons
├── Dockerfile  single image: the API also serves the compiled frontend
└── .github/workflows/build-image.yml  build + push to GHCR
```

In production there is **a single container**: FastAPI handles `/api/*`, `/healthz` and `/readyz`,
and serves the frontend `dist/` for every other path (falling back to `index.html`).

## Running locally

```bash
# API
cd api && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload            # http://127.0.0.1:8000/docs

# Frontend (another terminal)
cd web && npm install && npm run dev               # http://127.0.0.1:5173
```

In dev, Vite proxies `/api` to `127.0.0.1:8000`. In production the frontend and the API share
the same origin, so no proxy or CORS is needed.

## API contract

| Resource | Routes |
|---|---|
| Inventory | `GET/POST /api/inventory`, `GET/PATCH/DELETE /api/inventory/{id}`, `POST /api/inventory/restock-list` |
| Shopping | `/api/shopping` (CRUD) |
| Tasks | `/api/tasks` (CRUD) |
| Bills | `/api/bills` (CRUD), `POST /api/bills/{id}/pay` |
| Finance | `/api/transactions` (CRUD) |
| Dashboard | `GET /api/summary` |
| Probes | `GET /healthz` (liveness), `GET /readyz` (checks the database) |

Business rules:
- `restock-list` adds every item below its minimum stock to the shopping list, without duplicating items already pending.
- `pay` marks the bill as paid, records the expense in finances and, if the bill is recurring, creates next month's bill.

## Environment variables

| Variable | Used by | Default |
|---|---|---|
| `DATABASE_URL` | API | `sqlite:///./data/homectl.db` |
| `STATIC_DIR` | API | `api/static` (in the image: `/app/static`) |

Postgres: `postgresql+psycopg://user:password@host:5432/homectl` (the driver is already in `requirements.txt`).
Tables are created on startup.

## Image

```bash
docker build -t homectl .
docker run -p 8000:8000 -v homectl-data:/app/data homectl   # http://localhost:8000
```