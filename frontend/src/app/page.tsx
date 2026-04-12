'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listJobs } from '@/lib/api';
import { JobDescription } from '@/types';
import { ArrowRight, Upload, Search, Zap } from 'lucide-react';

export default function Home() {
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="pt-14 pb-24">
      {/* Hero section */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(0deg, transparent 24%, rgba(42, 42, 42, 0.4) 25%, rgba(42, 42, 42, 0.4) 26%, transparent 27%, transparent 74%, rgba(42, 42, 42, 0.4) 75%, rgba(42, 42, 42, 0.4) 76%, transparent 77%, transparent),
              linear-gradient(90deg, transparent 24%, rgba(42, 42, 42, 0.4) 25%, rgba(42, 42, 42, 0.4) 26%, transparent 27%, transparent 74%, rgba(42, 42, 42, 0.4) 75%, rgba(42, 42, 42, 0.4) 76%, transparent 77%, transparent)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Amber glow blob */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 border border-amber-400/30 bg-amber-400/5 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-mono text-[11px] text-amber-400 tracking-widest">
              AI-POWERED CANDIDATE RANKING
            </span>
          </div>

          {/* H1 */}
          <h1 className="font-display text-7xl md:text-8xl text-[var(--snow)] tracking-wider leading-none mb-8">
            FIND YOUR <br />
            <span className="text-amber-400">BEST MATCH</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[var(--dim)] text-lg max-w-xl mx-auto mb-12">
            Leverage hybrid AI scoring to rank candidates against job descriptions. 
            Skill matching, experience validation, and seniority alignment—all in one platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-[var(--ink)] font-mono text-sm tracking-widest rounded hover:bg-amber-300 transition-colors"
            >
              <Upload size={18} />
              Start uploading
            </Link>
            <Link
              href="/match"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--edge)] text-[var(--light)] font-mono text-sm tracking-widest rounded hover:border-amber-400/30 hover:bg-amber-400/5 transition-colors"
            >
              <Search size={18} />
              Browse matches
            </Link>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <div className="border-y border-[var(--edge)]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3 divide-x divide-[var(--edge)]">
          <div className="py-8 px-8 text-center">
            <div className="font-display text-5xl text-[var(--snow)] mb-2">
              {loading ? '—' : jobs.length}
            </div>
            <p className="font-mono text-[10px] text-amber-400 tracking-widest mb-1">
              ACTIVE IDS
            </p>
            <p className="text-[var(--dim)] text-xs">Job descriptions</p>
          </div>
          <div className="py-8 px-8 text-center">
            <div className="font-display text-5xl text-[var(--snow)] mb-2">4</div>
            <p className="font-mono text-[10px] text-amber-400 tracking-widest mb-1">
              SIGNALS
            </p>
            <p className="text-[var(--dim)] text-xs">Scoring factors</p>
          </div>
          <div className="py-8 px-8 text-center">
            <div className="font-display text-5xl text-[var(--snow)] mb-2">100k</div>
            <p className="font-mono text-[10px] text-amber-400 tracking-widest mb-1">
              MAX SCALE
            </p>
            <p className="text-[var(--dim)] text-xs">Candidates supported</p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="font-display text-5xl text-[var(--snow)] tracking-wide text-center mb-16">
          HOW IT WORKS
        </h2>

        <div className="grid grid-cols-4 gap-px bg-[var(--edge)] rounded overflow-hidden">
          {[
            { num: '01', title: 'Ingest', desc: 'Upload candidates from Excel. Add job descriptions via API.' },
            { num: '02', title: 'Score', desc: 'Hybrid algorithm evaluates skills, experience, fit, availability.' },
            { num: '03', title: 'Rank', desc: 'Candidates ranked by composite score (0.0–1.0).' },
            { num: '04', title: 'Explain', desc: 'Human-readable explanations for every match.' },
          ].map((step, i) => (
            <div key={i} className="bg-[var(--panel)] p-8 hover:bg-[#161616] transition-colors">
              <div className="mb-4">
                <Zap size={18} className="text-amber-400" />
              </div>
              <div className="font-display text-4xl text-[var(--wire)] mb-3">{step.num}</div>
              <h3 className="font-display text-2xl text-[var(--snow)] mb-2">{step.title}</h3>
              <p className="text-[var(--dim)] text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active JDs list */}
      {jobs.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-24 border-t border-[var(--edge)]">
          <h2 className="font-display text-5xl text-[var(--snow)] tracking-wide mb-8">
            ACTIVE JOBS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jobs.slice(0, 4).map((job) => (
              <Link
                key={job.jd_id}
                href={`/match?jd=${job.jd_id}`}
                className="group border border-[var(--edge)] rounded p-4 hover:border-amber-400/30 hover:bg-amber-400/5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-display text-xl text-[var(--snow)] group-hover:text-amber-400 transition-colors">
                      {job.title}
                    </h3>
                    <p className="font-mono text-xs text-[var(--dim)] mt-1">
                      {job.company}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-[var(--wire)] group-hover:text-amber-400 transition-colors flex-shrink-0" />
                </div>
                {job.location && (
                  <p className="font-mono text-xs text-[var(--muted)]">{job.location}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
