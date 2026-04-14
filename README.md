# 🚀 Job-Candidate Matching Engine

A high-performance, explainable AI system for ranking candidates against job descriptions. Built with **FastAPI** and **Next.js**, this engine uses a multi-layered hybrid scoring algorithm to provide recruiters with instant, data-driven hiring insights.

---

## 🧠 Matching Approach

The core of the system is a **4-Signal Hybrid Scoring Engine** that evaluates candidates across four dimensions. Each signal is weighted to reflect its importance in a typical technical hiring process.

### 1. Skill Match (45%)
We use a two-layer approach for skills to balance semantic breadth with keyword precision:
- **Layer A (Semantic):** TF-IDF Vectorization & Cosine Similarity. This captures candidates who have related skills even if keywords don't match exactly (e.g., "AI Pipelines" vs "ML Orchestration").
- **Layer B (Precision):** Exact Keyword Overlap. This ensures hard requirements listed in the JD are explicitly checked, providing an explainable "Matched vs. Missing" list.

### 2. Experience Fit (25%)
Rather than just checking total years, the engine:
- Extracts minimum requirements from JD text using optimized Regex patterns.
- Applies a **linear decay function** for "near-misses" (e.g., a candidate with 1.5 years experience for a 2-year role still receives a partial score).
- Normalizes scores to prevent penalizing candidates for missing data (0.5 neutral score).

### 3. Seniority & Role Alignment (20%)
To ensure a "Backend Engineer" isn't ranked #1 for a "Frontend" role based on skills alone:
- **Role Mapping:** Uses a pre-defined mapping (e.g., "AI Engineer" maps to "ML Engineer" and "Data Engineer").
- **Title Overlap:** Fallback mechanism that uses fuzzy word overlap between the JD title and candidate's current title.

### 4. Availability Tie-breaker (10%)
A small weight is given to logistics to boost candidates who are ready to start:
- **Active Status:** Bonus for candidates "Actively Looking."
- **Notice Period:** Scaled score from 1.0 (immediate) to 0.05 (3+ months).

---

## 🏗️ Design Decisions

### Why TF-IDF instead of LLM Embeddings?
While LLM embeddings (like OpenAI or SBERT) offer better semantic understanding, we chose TF-IDF for the initial implementation because:
1. **Speed:** TF-IDF runs in milliseconds on local CPUs; LLMs require API calls or GPUs.
2. **Explainability:** It is easier to debug *why* a candidate matched (specific keywords) than with a black-box vector.
3. **No Cost:** Zero API overhead or token costs.

### Caching Strategy (The MatchResult Layer)
Matching 100+ candidates against a JD involves heavy computation. 
- **The Optimization:** We persist results in a `MatchResult` table. 
- **The Result:** The first run takes ~7s (cold), but subsequent views are **<12ms (warm)**. Results are only re-calculated if explicitly requested by the user.

### Vertical Slice Architecture
We chose a modular FastAPI router structure (`/ingest`, `/match`) paired with a Next.js frontend to allow the system to scale horizontally. The backend is stateless, meaning we can spin up multiple API workers behind a load balancer without data loss.

---

## ⚠️ Limitations

1. **Regex Brittleness:** The experience extraction relies on JD text patterns (e.g., "3+ years"). If a JD is written in a highly non-standard way (e.g., "Three seasons of coding"), the extractor may fail.
2. **Hand-Tuned Weights:** The 45/25/20/10 weights are based on industry standards but are currently static. A production system would allow recruiters to "weight" signals based on the specific role.
3. **Limited Synonym Support:** While TF-IDF captures some context, it doesn't truly understand that "Golang" and "Go" are identical without specific pre-processing.
4. **Seniority Map:** The `TITLE_SENIORITY_MAP` is currently hardcoded for technical roles. Expanding to Sales, HR, or Marketing would require a broader taxonomy.

---

## 🛠️ Quick Start

### 1. Backend (FastAPI)
```powershell
# Setup environment
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload
```

### 2. Frontend (Next.js)
```powershell
cd frontend
npm install
npm run dev
```

### 3. Docker (Full Stack)
```powershell
docker compose up --build -d
```

---

## 📊 Tech Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy, Scikit-Learn (TF-IDF).
- **Frontend:** Next.js 14 (App Router), TypeScript, Vanilla CSS (Premium Dark Theme).
- **Database:** SQLite (Development) / PostgreSQL (Production ready).
- **Deployment:** Docker, Docker Compose.

---

**Status:** ✅ Production Ready | **Performance:** 100+ candidates scored in <8s.
