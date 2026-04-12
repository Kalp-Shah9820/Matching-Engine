# ⚡ QUICK START - Complete Full-Stack Setup

## Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** installed
- **npm** package manager
- (Optional) **Docker & Docker Compose** for containerized deployment

---

## Option A: Local Development (Fastest - 3 mins)

### Backend - Terminal 1: Setup (1 min)
```powershell
cd c:\Users\Kalp Shah\Desktop\Matching_engine

# Create virtual environment
python -m venv .venv

# Activate it
.venv\Scripts\activate
# You should see (.venv) in your terminal
```

### Step 2: Install Dependencies (2 mins)
```pBackend - Terminal 1: Install & Start (2 mins)
```powershell
# Install backend dependencies
pip install -r requirements.txt

# Start the API server (stays running)
uvicorn app.main:app --reload

# Output should show:
# Uvicorn running on http://127.0.0.1:8000 ✅
```

### Frontend - Terminal 2: Setup (2 mins)
```powershell
# Open NEW terminal, go to frontend directory
cd c:\Users\Kalp Shah\Desktop\Matching_engine\frontend

# Install frontend dependencies
npm install

# Start the frontend dev server
npm run dev

# Output should show:
# Ready in Xms. Local: http://localhost:3000 ✅
```

### Verify Everything Works
```
OpenFirst Run - Use the UI!
```
1. Open http://localhost:3000
2. Click "Start uploading" → goes to /upload page
3. Drag-drop an Excel file (or create test data) with candidates
4. Fill in job description and click "SAVE JOB DESCRIPTIONS"
5. Go to /match page
6. Select the job and click "RUN MATCHING"
7. See candidates ranked in real-time ✅
8. Click on a candidate to see detailed scoring breakdown in right panel
```

**No API calls needed!** The UI handles everything.oke-WebRequest -Uri "http://localhost:8000/match/$jdId/cand-001" -Method GET |
  Select-Object -ExpandProperty Content |
  ConvertFrom-Json |
  Format-List
```

---

## Option B: Docker (Production-Like)

### Step 1: Build & Start (1 min)
```powershell
cd c:\Users\Kalp Shah\Desktop\Matching_engine

docker compose up --build -d

# -d runs in background
# Check status:
docker compose ps
```

### Step 2: Test Server (1 min)
```powershell
# Wait 10 seconds for startup
Start-Sleep -Seconds 10

# Health check:
curl http://localhost:8000
# Expected: {"status":"ok","message":"Matching engine is running."}
```

### Step 3: Load Data & Run Matching
```powershell
# Same commands as Option A, just use http://localhost:8000

# Curl example:
curl -X POST http://localhost:8000/ingest/jobs/bulk `
  -H "Content-Type: application/json" `
  -d '{"job_descriptions":[{"title":"AI Engineer","required_skills":"Python, FastAPI"}]}'

# Interactive docs still available:
# http://localhost:8000/docs
```

### Step 4: View Logs
```powershell
docker compose logs -f api
# Shows real-time logs from the API container

# Stop when done
docker compose down
```

---

## Common First-Time Issues

### ❌ "ModuleNotFoundError: No module named 'app'"
**Solution:**
```powershell
# Make sure you're in the project root:
cd c:\Users\Kalp Shah\Desktop\Matching_engine

# And virtual environFull Stack - 5 mins)

### Step 1: Build & Start Everything (2 mins)
```powershell
cd c:\Users\Kalp Shah\Desktop\Matching_engine

# Build and start all services in background
docker compose up --build -d

# This starts:
# - Frontend (Next.js) on port 3000
# - Backend (FastAPI) on port 8000
```

### Step 2: Check Status (30 secs)
```powershell
# See all running containers
docker compose ps

# Expected output:
# NAME                 STATUS
# matching_engine_api          Up (healthy)
# matching_engine_frontend     Up (healthy)
```

### Step 3: Access the Application (30 secs)
```
Open browser:
✓ Frontend:   http://localhost:3000
✓ Backend:    http://localhost:8000
✓ API Docs:   http://localhost:8000/docs
```

### Step 4: Use Like Local Development
```powershell
# Use the UI exactly like Option A
# No differences - same experience!

# View logs if needed:
docker compose logs -f frontend  # Real-time frontend logs
docker compose logs -f api       # Real-time backend logs

# Stop everything when done:erify:

```
✓ Server runs without errors
✓ http://localhost:8000/docs loads Swagger UI
✓ POST /ingest/jobs/bulk works (returns response with ids)
✓ POST /ingest/candidates/bulk works (returns response with count)
✓ GET /match/{jd_id} returns ranked list
✓ GET /match/{jd_id}/{candidate_id} returns detailed breakdown
---

## 🚨 Common Issues & Fixes

### Backend Won't Start

**❌ "ModuleNotFoundError: No module named 'app'"**
```powershell
cd c:\Users\Kalp Shah\Desktop\Matching_engine  # Correct directory?
.venv\Scripts\activate                          # venv activated?
```

**❌ "Uvicorn not found"**
```powershell
.venv\Scripts\activate
pip install -r requirements.txt
```

**❌ "Port 8000 already in use"**
```powershell
# Kill existing process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --port 8001
```

### Frontend Won't Start

**❌ "Module not found" after npm install**
```powershell
cd frontend
rm -r node_modules
npm install
npm run dev
```

**❌ "Port 3000 already in use"**
```powershell
cd frontend
npm run dev -- -p 3001
```

**❌ "Cannot find module next"**
```powershell
cd frontend
npm install next react react-dom
npm run dev
```

### API Connection Issues

**❌ "API not responding" from frontend**
```powershell
# Make sure backend is running on http://localhost:8000
# Check frontend/.env.local has:
NEXT_PUBLIC_API_URL=http://localhost:8000

# Restart frontend dev server
```

**❌ "Styles look broken"**
```powershell
cd frontend
rm -r .next        # Clear cache
npm run dev        # Rebuild
```

### Docker Issues

**❌ "Container exits immediately"**
```powershell
docker compose logs api       # See backend error
docker compose logs frontend  # See frontend error
```

**❌ "Port conflicts with Docker"**
```powershell
docker compose down           # Stop all containers
docker ps                     # Verify all stopped
docker compose up --build -d  # Restart
```

---

## ✅ Complete Validation Checklist

**Backend:**
- [ ] ✓ Uvicorn runs without errors
- [ ] ✓ http://localhost:8000/docs loads Swagger UI
- [ ] ✓ Can add jobs (POST /ingest/jobs/bulk)
- [ ] ✓ Can upload candidates (Excel file)
- [ ] ✓ Can run matching (GET /match/{jd_id})

**Frontend:**
- [ ] ✓ Next.js dev server starts
- [ ] ✓ http://localhost:3000 loads homepage
- [ ] ✓ Navbar shows "MATCH ENGINE" logo
- [ ] ✓ Can navigate to /upload page
- [ ] ✓ Can navigate to /match page

**Full Stack Integration:**
- [ ] ✓ Upload page shows drag-drop zone (works)
- [ ] ✓ Can add job descriptions in form
- [ ] ✓ Home page displays active job count
- [ ] ✓ /match page loads jobs from API
- [ ] ✓ Can run matching and see results
- [ ] ✓ Can click candidate to open detail panel

**All checked?** 🎉 You're ready to go!

---

## 📚 Next Steps

1. **Read the full docs:**
   - [FRONTEND_QUICK_START.md](FRONTEND_QUICK_START.md) - Frontend-specific setup
   - [FRONTEND_COMPLETE.md](FRONTEND_COMPLETE.md) - Components, styling, API integration
   - [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) - Backend architecture

2. **Deploy to production:**
   - Frontend: Vercel, Netlify, or AWS S3
   - Backend: Heroku, Railway, or AWS EC2
   - Database: PostgreSQL (switch from SQLite)

3. **Add features:**
   - Authentication (JWT/OAuth2)
   - Email notifications
   - Analytics dashboard
   - Mobile app

4. **Performance:**
   - Redis caching for results
   - Load balancing for backend
   - CDN for frontend assets
   - Database indexing