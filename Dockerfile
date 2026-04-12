# ── Stage 1: builder ──────────────────────────────────────────────────────────
# Install dependencies in a separate layer so they're cached between rebuilds.
# Only re-runs when requirements.txt changes.
FROM python:3.11-slim AS builder

WORKDIR /install

COPY requirements.txt .

RUN pip install --upgrade pip --no-cache-dir \
 && pip install --prefix=/install/deps --no-cache-dir -r requirements.txt


# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.11-slim

LABEL maintainer="you@example.com"
LABEL description="Job-Candidate Matching Engine API"

# Create a non-root user — never run production apps as root
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install/deps /usr/local

# Copy application source
COPY ./app ./app

# Volume mount point for the SQLite database file.
# In production (PostgreSQL) this volume is not needed.
RUN mkdir -p /app/data && chown appuser:appgroup /app/data

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 8000

# Healthcheck — Docker will mark container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/')"

# Start the server
# - host 0.0.0.0 makes it reachable outside the container
# - workers=2 is safe for SQLite; increase for PostgreSQL
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]