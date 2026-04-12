# Scaling to 100k Candidates — Technical Deep Dive

This document outlines exactly what breaks, where it breaks, and the
precise architectural changes required to scale the matching engine from
100 candidates to 100,000+.

---

## Current State (100 candidates)

### What works well

- TF-IDF matrix fits in memory (~5 MB)
- Full scoring run takes < 1 second
- SQLite handles all reads/writes without contention
- Single container is sufficient
- Results cached in `match_results` table — subsequent GETs are instant

### What will break at scale

The system hits four hard walls as candidate count grows:

---

## Wall 1 — Memory (hits at ~5,000 candidates)

**The problem:**

`TfidfVectorizer.fit_transform()` builds a document-term matrix in memory.
Each document (candidate skill blob) × each unique token = one float64 cell.

```
5,000 candidates × 50,000 unique skill tokens × 8 bytes = 2 GB RAM
100,000 candidates × 50,000 unique skill tokens × 8 bytes = 40 GB RAM
```

40 GB just for the matrix. This crashes a standard container.

**The fix — pre-compute embeddings at ingest time:**

```python
# app/matcher.py — add to _row_to_candidate at ingest
from sentence_transformers import SentenceTransformer

_model = SentenceTransformer("all-MiniLM-L6-v2")  # load once, 80 MB

def compute_embedding(candidate_text: str) -> list[float]:
    return _model.encode(candidate_text, normalize_embeddings=True).tolist()
```

```python
# app/schemas.py — add column
from sqlalchemy import JSON
embedding = Column(JSON)   # or pgvector's Vector(384) with PostgreSQL
```

At match time, encode the JD once, then compute dot-product similarity
against all stored embeddings. No matrix build. Constant memory regardless
of candidate count.

**Memory profile after fix:**

| Candidates | Memory used |
|------------|-------------|
| 1,000      | ~40 MB      |
| 10,000     | ~40 MB      |
| 100,000    | ~40 MB      |

The 40 MB is the model itself — it doesn't grow with candidate count.

---

## Wall 2 — Latency (hits at ~10,000 candidates)

**The problem:**

Scoring 10,000 candidates synchronously in a single GET request takes
10–30 seconds. The HTTP connection times out. The user gets a 504.

**The fix — async job queue:**

```
Before:  GET /match/{jd_id}  →  scores all candidates  →  returns results  (30s)

After:   POST /match/{jd_id}/run  →  enqueues job  →  returns { job_id }   (<100ms)
         GET  /match/{jd_id}/status  →  { status: "running", progress: 0.6 }
         GET  /match/{jd_id}        →  returns cached results when done
```

**Implementation with Celery + Redis:**

```python
# app/tasks.py
from celery import Celery

celery = Celery("matching", broker="redis://redis:6379/0")

@celery.task
def run_matching_task(jd_id: str):
    db = SessionLocal()
    jd = db.query(JobDescription).filter_by(jd_id=jd_id).first()
    candidates = db.query(Candidate).all()
    ranked = rank_candidates(jd, candidates)
    # persist to match_results...
    db.close()
```

```yaml
# docker-compose.yml additions
redis:
  image: redis:7-alpine

worker:
  build: .
  command: celery -A app.tasks worker --concurrency=4
  depends_on: [redis, db]
```

**For simpler deployments** (up to ~20k candidates), FastAPI's built-in
`BackgroundTasks` avoids the Redis + Celery overhead:

```python
@router.post("/{jd_id}/run")
async def trigger_matching(jd_id: str, background_tasks: BackgroundTasks, db=Depends(get_db)):
    background_tasks.add_task(run_matching_job, jd_id, db)
    return {"status": "queued", "jd_id": jd_id}
```

---

## Wall 3 — Database (hits at ~10,000 candidates)

**The problem:**

SQLite uses a file-level write lock. Under concurrent API requests
(multiple users triggering matches simultaneously), requests queue up.
At 100k candidates with 4 API replicas, this becomes a bottleneck.

**The fix — PostgreSQL + pgvector:**

```bash
# In docker-compose.yml, set:
DATABASE_URL: "postgresql://matchuser:matchpass@db:5432/matchingdb"
```

Add `pgvector` for native vector similarity search:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE candidates ADD COLUMN embedding vector(384);

-- Index for fast ANN search
CREATE INDEX ON candidates
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- tune: lists ≈ sqrt(total_rows)
```

Query the top 50 candidates by embedding similarity in a single SQL call:

```sql
SELECT candidate_id, name, current_title,
       1 - (embedding <=> $1::vector) AS similarity_score
FROM candidates
WHERE engineer_type = $2       -- pre-filter by role
  AND years_of_experience >= $3  -- pre-filter by experience
ORDER BY embedding <=> $1::vector
LIMIT 50;
```

This replaces the entire Python scoring loop for the skill signal.
At 100k candidates, this query runs in ~50ms with the IVFFlat index.

**Add PgBouncer for connection pooling:**

```yaml
pgbouncer:
  image: pgbouncer/pgbouncer
  environment:
    DATABASES_HOST: db
    DATABASES_PORT: 5432
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 200
    DEFAULT_POOL_SIZE: 20
```

---

## Wall 4 — Single Container (hits at high request volume)

**The problem:**

One API container handles all requests sequentially (GIL + uvicorn workers).
Under load (many simultaneous users), p99 latency spikes.

**The fix — horizontal scaling:**

The API is stateless — any replica can handle any request. Scale freely:

```yaml
# docker-compose.yml
api:
  deploy:
    replicas: 4
    resources:
      limits:
        cpus: "1"
        memory: 512M
```

With Kubernetes, use an HPA:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: matching-api-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: matching-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          averageUtilization: 60
```

---

## Pre-filtering — the free 10–20× speedup

Before any embedding or scoring work, reduce the candidate pool using
indexed SQL queries. This works at any scale with zero accuracy loss.

```python
def get_candidate_pool(db: Session, jd: JobDescription) -> list[Candidate]:
    """
    Filter candidates by hard criteria before scoring.
    Reduces a 100k pool to 5–10k relevant candidates in <10ms.
    """
    query = db.query(Candidate)

    # Hard filter: role type
    if "backend" in jd.title.lower():
        query = query.filter(Candidate.engineer_type.in_(
            ["Backend Engineer", "Full Stack Engineer"]
        ))
    elif "ai" in jd.title.lower() or "ml" in jd.title.lower():
        query = query.filter(Candidate.engineer_type.in_(
            ["AI Engineer", "Machine Learning Engineer", "Backend Engineer"]
        ))

    # Hard filter: minimum experience (with 1-year buffer for near-misses)
    min_years = extract_min_years(jd.core_requirements or "")
    if min_years > 1:
        query = query.filter(Candidate.years_of_experience >= min_years - 1)

    # Soft preference: actively looking first
    # (don't filter out passive candidates — include them, just deprioritise)
    return query.order_by(
        Candidate.is_actively_looking.desc()
    ).all()
```

**Impact at 100k candidates:**

| Filter | Pool reduction | Speedup |
|--------|---------------|---------|
| Role type | 100k → 30k | 3× |
| Min experience | 30k → 10k | 3× |
| Combined | 100k → 5–10k | 10–20× |

---

## Full Scaled Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          INGESTION PATH                          │
│                                                                  │
│  Excel Upload → FastAPI → compute_embedding() → PostgreSQL       │
│                                                  + pgvector      │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                          MATCHING PATH                           │
│                                                                  │
│  POST /match/{jd_id}/run                                         │
│       │                                                          │
│       ▼                                                          │
│  Redis Queue ──→ Celery Worker                                   │
│                      │                                           │
│                      ├─ 1. Pre-filter candidates (SQL)           │
│                      ├─ 2. ANN vector search (pgvector)          │
│                      ├─ 3. Score experience + seniority (Python) │
│                      ├─ 4. Combine + rank                        │
│                      └─ 5. Store to match_results table          │
│                                                                  │
│  GET /match/{jd_id} → serve from match_results (instant)        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       INFRASTRUCTURE                             │
│                                                                  │
│  Nginx / ALB                                                     │
│       ├── API replica 1  ┐                                       │
│       ├── API replica 2  ├── all stateless                       │
│       ├── API replica 3  ┘                                       │
│       └── Frontend (Next.js on Vercel / static CDN)             │
│                                                                  │
│  PgBouncer → PostgreSQL (primary + read replica)                 │
│  Redis (Celery broker + result backend)                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Migration Checklist (current → 100k scale)

```
Phase 1 — Database (handles up to ~20k candidates)
  [ ] Swap SQLite → PostgreSQL (change DATABASE_URL, no code changes)
  [ ] Add pgvector extension
  [ ] Add embedding column to candidates table
  [ ] Compute embeddings at ingest time

Phase 2 — Async matching (handles up to ~100k candidates)
  [ ] Add Redis service to docker-compose
  [ ] Add Celery worker service
  [ ] Convert run_matching to a Celery task
  [ ] Add status polling endpoint GET /match/{jd_id}/status
  [ ] Update frontend to poll status before showing results

Phase 3 — Scale (handles 100k+ candidates, high concurrency)
  [ ] Add PgBouncer for connection pooling
  [ ] Add IVFFlat index on embedding column
  [ ] Implement pre-filtering in get_candidate_pool()
  [ ] Add API replicas (docker-compose replicas: 4 or Kubernetes HPA)
  [ ] Move frontend to CDN (Vercel / CloudFront)
  [ ] Add read replica for PostgreSQL
```

---

## Performance Targets After Migration

| Metric | Current (100 candidates) | Target (100k candidates) |
|--------|--------------------------|--------------------------|
| Ingest 1 candidate | < 50ms | < 200ms (embedding compute) |
| Trigger matching | < 1s | < 500ms (queue enqueue) |
| Matching job duration | < 1s | 30–60s (background) |
| GET ranked results | < 50ms (cached) | < 50ms (cached) |
| GET candidate detail | < 100ms | < 100ms |
| API p99 latency | < 200ms | < 200ms |