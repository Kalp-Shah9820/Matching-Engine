# Complete frontend setup for the Matching Engine

This directory contains a production-ready Next.js 14 frontend built with TypeScript and Tailwind CSS.

## Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with metadata
│   │   ├── globals.css             # Global styles + theme
│   │   ├── page.tsx                # Homepage (/)
│   │   ├── upload/page.tsx         # Data ingestion page (/upload)
│   │   └── match/page.tsx          # Match results page (/match)
│   ├── components/
│   │   ├── Navbar.tsx              # Top navigation bar
│   │   ├── ScoreBar.tsx            # Animated score visualization
│   │   ├── SkillPill.tsx           # Skill tag component
│   │   └── CandidateDrawer.tsx     # Right-slide detail panel
│   ├── lib/
│   │   └── api.ts                  # Type-safe API client
│   └── types/
│       └── index.ts                # Shared TypeScript types
├── Dockerfile                      # Multi-stage production build
├── package.json                    # Dependencies
├── tailwind.config.ts              # Theme customization
├── next.config.ts                  # API rewrites proxy
├── postcss.config.js               # Tailwind processing
├── tsconfig.json                   # Strict TypeScript config
└── README.md                       # This file
```

## Installation & Running

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (watches for changes)
npm run dev

# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t matching-engine-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://api:8000 \
  matching-engine-frontend
```

## Design System

### Aesthetic
Dark editorial. Bloomberg Terminal meets modern SaaS data dashboard. Monochromatic dark base with amber as the only accent color.

### Color Palette
- **ink** (#0a0a0a): Page background
- **panel** (#111111): Card/surface background
- **edge** (#1e1e1e): Borders
- **wire** (#2a2a2a): Subtle borders, inactive
- **muted** (#555555): Placeholder text
- **dim** (#888888): Secondary text
- **light** (#cccccc): Primary body text
- **snow** (#f0f0f0): Headings on dark
- **amber** (#f59e0b): Primary accent (only color)
- **teal** (#2dd4bf): Success / high score
- **rose** (#fb7185): Error / low score / gaps

### Fonts
- **Bebas Neue**: Display/headings, loaded from Google Fonts
- **IBM Plex Mono**: Labels, data, monospace (400, 500)
- **DM Sans**: Body/UI text (300, 400, 500, 600)

### Animations
- **fadeUp**: Opacity + vertical slide, 0.5s
- **fadeIn**: Pure fade-in, 0.4s
- **pulse-dot**: Opacity pulse, 1.5s infinite
- **shimmer**: Skeleton loading gradient, 1.8s infinite

## API Integration

All API calls go through `src/lib/api.ts`:

```typescript
uploadCandidatesExcel(file)          → POST /ingest/candidates/upload-excel
addJobsBulk(payload)                 → POST /ingest/jobs/bulk
listJobs()                           → GET /ingest/jobs
getRankedCandidates(jdId, ...)       → GET /match/{jd_id}
getMatchDetail(jdId, candidateId)    → GET /match/{jd_id}/{candidate_id}
triggerMatch(jdId)                   → POST /match/{jd_id}/run
```

Environment variable `NEXT_PUBLIC_API_URL` controls the base URL (default: `http://localhost:8000`).

## Component Reference

### Navbar
Fixed top navigation with logo, route links (with active state), and API connection status.

### ScoreBar
Animated score visualization with color coding (teal/amber/rose) based on thresholds. Animates on intersection observer trigger.

### SkillPill
Inline skill tags with three variants: match (green), miss (red), neutral (gray).

### CandidateDrawer
Right-slide panel showing full candidate detail. Fetches data from API when candidateId changes.

## Pages

### Home (/)
Hero section with intro, CTA buttons, stats row, 4-step process grid, and list of active jobs.

### Upload (/upload)
Two-column layout:
- **Column A**: Excel file drop zone + upload button
- **Column B**: Dynamic job description forms (add/remove), save button

### Match (/match)
Main recruiting dashboard:
- Job selector dropdown
- Run matching button (triggers force_rerun)
- Required skills filter pills
- Candidate search filter
- Results table with row action (opens drawer)
- Candidate drawer with full detail breakdown

## Environment Setup

### Required Variables
- `NEXT_PUBLIC_API_URL`: Backend API endpoint (default: http://localhost:8000)

### Optional Variables
- None currently

## Performance Considerations

- Score bars animate on intersection observer (lazy animation)
- Candidate rows stagger their animation delays for visual effect
- Image optimization via Next.js (if images added)
- Minimal layout shifts with skeleton UI during loading
- CSS custom scrollbar (non-default browser UI)

## Browser Support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). No IE support.

## Troubleshooting

### API Not Connecting
- Check `NEXT_PUBLIC_API_URL` ENV variable
- Ensure backend is running on specified port
- Check CORS if not using proxy rewrites (already configured)

### Styling Issues
- Ensure all Google Fonts are loaded (check globals.css)
- Check tailwind.config.ts for custom theme values
- Verify Tailwind CSS is built (npm run build)

### TypeScript Errors
- Run `npm install` to update types
- Check tsconfig.json paths are correct

## Development Tips

- Use `@/` path alias for cleaner imports: `@/components/Navbar`
- All interactive components are marked with `"use client"` directive
- API errors are caught and displayed to user
- useSearchParams() wrapped in Suspense on match page
- Dynamic form state handled with useState + callbacks

## Deployment

### Vercel (Recommended)
```bash
vercel link
vercel env add NEXT_PUBLIC_API_URL
vercel deploy
```

### Docker Compose (with backend)
See root docker-compose.yml to run frontend + backend together.

### Custom Server
Deploy the `.next` build output with Node.js 20+.
