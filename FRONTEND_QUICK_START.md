# 🚀 FRONTEND QUICK START - GET RUNNING IN 3 MINUTES

## What You Have

✅ **Complete Next.js 14 frontend** with:
- TypeScript + Tailwind CSS
- 3 pages (home, upload, match)
- 4 reusable components
- Full API integration
- Dark editorial design (amber accent only)
- Docker support

---

## Quick Start (Choose One)

### 🏃 Fastest: Local Dev (3 minutes)

```powershell
# Terminal 1: Backend
cd c:\Users\Kalp Shah\Desktop\Matching_engine
.venv\Scripts\activate
uvicorn app.main:app --reload
# Wait for: "Uvicorn running on http://127.0.0.1:8000"

# Terminal 2: Frontend
cd c:\Users\Kalp Shah\Desktop\Matching_engine\frontend
npm install
npm run dev
# Wait for: "Ready in Xms. Local: http://localhost:3000"

# Browser: Open http://localhost:3000 ✅
```

**Done!** You now have:
- Frontend on http://localhost:3000
- Backend on http://localhost:8000
- Auto hot-reload on file changes

---

### 🐳 Docker (Full Stack - 5 minutes)

```powershell
# From project root
cd c:\Users\Kalp Shah\Desktop\Matching_engine

# Build & start everything
docker compose up --build -d

# Check status
docker compose ps

# URLs:
#   Frontend: http://localhost:3000 ✅
#   Backend:  http://localhost:8000 ✅

# Stop everything
docker compose down

# View logs
docker compose logs -f frontend
docker compose logs -f api
```

---

## First Steps in UI

### 1. Home Page (/)
- View stats (jobs count, signals, scale)
- See how the system works (4 steps)
- Click "Start uploading" → goes to /upload

### 2. Upload Page (/upload)
**Column A - Excel Upload:**
- Drag an Excel file (.xlsx) onto the box
- OR click to browse
- Shows filename + size
- Click "UPLOAD CANDIDATES" when ready

**Column B - Add Jobs:**
- Fill in job title (required)
- Add company, location, skills, etc.
- Click "ADD ANOTHER JD" to add more forms
- Click "SAVE JOB DESCRIPTIONS"

### 3. Match Results Page (/match)
- Select a job from dropdown
- Click "RUN MATCHING"
- Wait for table to populate
- Click on a candidate row → drawer opens right side
- See full scoring breakdown in drawer

---

## What Works

✅ **Uploads:**
- Excel file drag-and-drop with validation
- Bulk job description form
- Success/error messages
- Data sent to API

✅ **Matching:**
- JD dropdown populated from API
- Run matching with one click
- Results table with 6 columns
- Animated score bars (teal/amber/rose)
- Rank badges color-coded

✅ **Details:**
- Right-slide panel opens on row click
- Shows candidate name + score (large)
- Lists matched vs missing skills
- Full recruiter explanation
- Location, years, rank metadata

✅ **Design:**
- Dark editorial (Bloomberg Terminal style)
- Amber accent throughout
- Correct fonts (Bebas, IBM Mono, DM Sans)
- Animated components
- Responsive on mobile

---

## File Structure Reference

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Home (hero, stats, jobs)
│   │   ├── upload/page.tsx       ← Excel + job forms  
│   │   ├── match/page.tsx        ← Recruiter dashboard
│   │   └── layout.tsx            ← Root + navbar
│   ├── components/
│   │   ├── Navbar.tsx            ← Fixed top bar
│   │   ├── ScoreBar.tsx          ← Animated score bar
│   │   ├── SkillPill.tsx         ← Skill tag
│   │   └── CandidateDrawer.tsx   ← Right panel detail
│   ├── lib/api.ts                ← All 6 API functions
│   └── types/index.ts            ← TypeScript interfaces
└── Dockerfile                    ← Production build
```

---

## Environment Variables

**Development:** Uses `http://localhost:8000` by default
**Production:** Set `NEXT_PUBLIC_API_URL` environment variable

```powershell
# Windows
$env:NEXT_PUBLIC_API_URL="http://api:8000"

# Or in .env.local file
NEXT_PUBLIC_API_URL=http://api:8000
```

---

## API Endpoints (All Implemented)

| Method | Endpoint | Frontend Page |
|--------|----------|---------------|
| POST | /ingest/candidates/upload-excel | /upload |
| POST | /ingest/jobs/bulk | /upload |
| GET | /ingest/jobs | / and /match |
| GET | /match/{jd_id} | /match |
| GET | /match/{jd_id}/{candidate_id} | /match (drawer) |
| POST | /match/{jd_id}/run | /match |

All error handling built-in. User sees friendly error messages.

---

## Common Tasks

### View API Docs
```
http://localhost:8000/docs
```
Interactive Swagger UI for backend endpoints.

### Stop the Dev Server
```
Frontend: Ctrl+C in terminal
Backend:  Ctrl+C in terminal
Docker:   docker compose down
```

### Rebuild Frontend
```
cd frontend
npm run build
npm start
```

### Check What's Running
```
Local:  http://localhost:3000 (frontend) + http://localhost:8000 (backend)
Docker: docker compose ps
```

### View Frontend Logs
```
Docker: docker compose logs -f frontend
Local:  Check terminal output in real-time
```

---

## Troubleshooting

### Frontend won't load
- Check backend is running (http://localhost:8000 should show JSON)
- Check NEXT_PUBLIC_API_URL is correct
- Clear browser cache (Ctrl+F5)

### API calls show 404
- Make sure backend is (/ingest/jobs exists on backend)
- Check port 8000 isn't blocked

### Styles look broken
- Run `npm run build` in frontend directory
- Clear browser cache
- Check Google Fonts are loading (check <head> in DevTools)

### File upload fails
- Make sure Backend is running
- Ensure file is .xlsx or .xlsm format
- Check backend error logs: `docker compose logs api`

---

## What's Next

### Development
- Add features (filters, sorting, export)
- Modify design/branding
- Add authentication
- Connect analytics

### Deployment
- Deploy frontend to Vercel/Netlify
- Deploy backend to cloud (AWS/GCP/Heroku)
- Update API URL for production
- Set up monitoring

### Scale
- Add Redis caching
- Use PostgreSQL instead of SQLite
- Load balancing for backend
- CDN for frontend assets

---

## Production Build

```powershell
cd frontend

# Build optimized
npm run build

# Test locally
npm start
# Open http://localhost:3000

# Or use Docker
docker build -t matching-engine-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 matching-engine-frontend
```

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Ctrl+K | Search (in match page) |
| Escape | Close drawer |
| Enter | Submit form |
| Tab | Navigate form fields |

---

## Support

### Documentation
- `frontend/SETUP.md` - Detailed setup guide
- `frontend/README.md` - Component reference
- `FRONTEND_COMPLETE.md` - Full architecture overview

### Logs & Debugging
```powershell
# Frontend errors
# Check browser DevTools Console (F12)

# Backend errors
docker compose logs api

# All services
docker compose logs
```

---

## 🎉 You're All Set!

**Your frontend is production-ready:**
- ✅ Fully functional
- ✅ Fully styled  
- ✅ Fully tested (manually)
- ✅ Fully documented
- ✅ Ready to deploy

**Next step:** Open http://localhost:3000 and start uploading data!

---

**Questions?** Check `FRONTEND_COMPLETE.md` for full documentation.
