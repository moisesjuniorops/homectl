# syntax=docker/dockerfile:1

# ---------- 1. Front: Node só para compilar o dist/ ----------
FROM node:22-alpine AS web
WORKDIR /src
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ .
RUN npm run build

# ---------- 2. Dependências Python num venv ----------
FROM python:3.13-slim AS deps
ENV PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
COPY api/requirements.txt .
RUN pip install -r requirements.txt

# ---------- 3. Imagem final: API + front estático ----------
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DATABASE_URL="sqlite:////app/data/homectl.db" \
    STATIC_DIR="/app/static"
RUN useradd --uid 10001 --no-create-home --shell /usr/sbin/nologin app
WORKDIR /app
COPY --from=deps /opt/venv /opt/venv
COPY api/app ./app
COPY --from=web /src/dist ./static
RUN mkdir -p data && chown 10001:10001 data
USER 10001
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
