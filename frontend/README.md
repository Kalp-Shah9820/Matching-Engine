# Matching Engine Frontend

A modern, dark-themed Next.js 14 frontend for the Job-Candidate Matching Engine API.

## Features

- **Dark Editorial Design**: Bloomberg Terminal meets modern SaaS aesthetic
- **Hybrid Matching Algorithm**: Interactive ranking of candidates against jobs
- **Excel Bulk Import**: Upload candidate profiles directly from spreadsheets
- **Real-time Scoring**: Visual score bars with color-coded performance
- **Multi-column Layout**: Professional recruiter dashboard experience
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Custom color palette and animations

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The frontend will proxy API requests to `http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`).

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t matching-engine-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:8000 matching-engine-frontend
```

## Project Structure

- `src/app/` - Next.js pages and layouts
- `src/components/` - Reusable React components
- `src/lib/` - API client and utilities
- `src/types/` - TypeScript type definitions

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: `http://localhost:8000`)

## Technology Stack

- Next.js 14.2.3
- React 18
- TypeScript 5
- Tailwind CSS 3
- Lucide React (icons)
- clsx (utility)
