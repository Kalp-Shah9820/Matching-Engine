'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { listJobs, getRankedCandidates, triggerMatch } from '@/lib/api';
import { JobDescription, MatchSummary } from '@/types';
import { CandidateDrawer } from '@/components/CandidateDrawer';
import { ScoreBar } from '@/components/ScoreBar';
import { Search, Zap, ChevronDown, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface CandidateRowProps {
  candidate: MatchSummary;
  onOpenDetail: (candidateId: string) => void;
  index: number;
}

function CandidateRow({ candidate, onOpenDetail, index }: CandidateRowProps) {
  const rankColors = {
    1: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    2: 'text-[var(--light)] bg-white/5 border-[var(--wire)]',
    3: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
  };

  return (
    <div
      className="grid grid-cols-[3rem_1fr_1fr_1fr_160px_2rem] gap-4 px-5 py-4 border-b border-[var(--edge)] hover:bg-[#0f0f0f] transition-colors animate-fade-up"
      style={{
        animationDelay: `${index * 30}ms`,
      }}
    >
      {/* Rank */}
      <div className="flex items-center">
        <div
          className={clsx(
            'w-7 h-7 rounded border flex items-center justify-center font-display text-base',
            candidate.rank <= 3
              ? rankColors[candidate.rank as 1 | 2 | 3]
              : 'text-[var(--muted)] bg-transparent border-[var(--wire)]/50'
          )}
        >
          {candidate.rank}
        </div>
      </div>

      {/* Name */}
      <div>
        <p
          className="text-[var(--snow)] font-medium text-sm hover:text-amber-400 transition-colors cursor-pointer"
          onClick={() => onOpenDetail(candidate.candidate_id)}
        >
          {candidate.name || 'Unknown'}
        </p>
        <p className="font-mono text-[10px] text-[var(--dim)]">
          {candidate.candidate_id}
        </p>
      </div>

      {/* Role */}
      <div className="flex items-center">
        <p className="text-sm text-[var(--dim)]">{candidate.current_title || '—'}</p>
      </div>

      {/* Location */}
      <div className="flex items-center">
        <p className="text-sm text-[var(--muted)] font-mono">
          {candidate.location || '—'}
        </p>
      </div>

      {/* Score */}
      <div className="flex flex-col items-end justify-center gap-2">
        <span
          className="text-base font-display font-bold"
          style={{
            color:
              candidate.score >= 0.75
                ? '#2dd4bf'
                : candidate.score >= 0.5
                ? '#f59e0b'
                : candidate.score >= 0.3
                ? '#d97706'
                : '#fb7185',
          }}
        >
          {candidate.score_percent}
        </span>
        <ScoreBar score={candidate.score} small={true} />
      </div>

      {/* Icon */}
      <div className="flex items-center justify-end">
        <RefreshCw
          size={18}
          className="text-[var(--wire)] hover:text-amber-400 transition-colors cursor-pointer"
          onClick={() => onOpenDetail(candidate.candidate_id)}
        />
      </div>
    </div>
  );
}

function MatchPageContent() {
  const searchParams = useSearchParams();
  const preselectedJd = searchParams.get('jd');

  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [selectedJd, setSelectedJd] = useState<string | null>(preselectedJd);
  const [results, setResults] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // Load jobs
  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch(console.error);
  }, []);

  // Load results when JD changes
  useEffect(() => {
    if (!selectedJd) {
      setResults([]);
      return;
    }

    setLoading(true);
    getRankedCandidates(selectedJd)
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedJd]);

  const handleRunMatching = async () => {
    if (!selectedJd) return;
    setRunLoading(true);
    try {
      await triggerMatch(selectedJd);
      const updated = await getRankedCandidates(selectedJd, true);
      setResults(updated);
    } catch (error) {
      console.error(error);
    } finally {
      setRunLoading(false);
    }
  };

  const selectedJob = jobs.find((j) => j.jd_id === selectedJd);
  const filteredResults = results.filter((r) => {
    const query = searchFilter.toLowerCase();
    return (
      (r.name?.toLowerCase().includes(query) || false) ||
      (r.current_title?.toLowerCase().includes(query) || false) ||
      (r.location?.toLowerCase().includes(query) || false)
    );
  });

  return (
    <main className="pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <h1 className="font-display text-5xl text-[var(--snow)] tracking-wide">
            MATCH RESULTS
          </h1>

          <div className="flex gap-3">
            {/* JD Selector */}
            <div className="relative">
              <select
                value={selectedJd || ''}
                onChange={(e) => setSelectedJd(e.target.value || null)}
                className="appearance-none bg-[var(--panel)] border border-[var(--edge)] rounded px-4 py-2 pr-8 font-mono text-sm text-[var(--light)] focus:border-amber-400/50 outline-none min-w-[220px]"
              >
                <option value="">Select a job...</option>
                {jobs.map((job) => (
                  <option key={job.jd_id} value={job.jd_id}>
                    {job.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--dim)]"
              />
            </div>

            {/* Run matching button */}
            <button
              onClick={handleRunMatching}
              disabled={!selectedJd || runLoading}
              className={clsx(
                'px-4 py-2 rounded font-mono text-sm tracking-widest flex items-center gap-2 transition-colors',
                selectedJd && !runLoading
                  ? 'bg-amber-400 text-[var(--ink)] hover:bg-amber-300'
                  : 'bg-[var(--wire)] text-[var(--muted)] cursor-not-allowed'
              )}
            >
              <Zap size={16} />
              {runLoading ? 'RUNNING...' : 'RUN MATCHING'}
            </button>
          </div>
        </div>

        {/* Job skills pills */}
        {selectedJob && selectedJob.required_skills && (
          <div className="mb-6 flex flex-wrap gap-2 animate-fade-in">
            {selectedJob.required_skills
              .split(',')
              .slice(0, 8)
              .map((skill, i) => (
                <span
                  key={i}
                  className="bg-white/5 border border-[var(--wire)] rounded-full px-3 py-1 font-mono text-[11px] text-[var(--dim)]"
                >
                  {skill.trim()}
                </span>
              ))}
          </div>
        )}

        {/* Search filter */}
        {results.length > 0 && (
          <div className="relative mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Filter by name, title, or location..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[var(--panel)] border border-[var(--edge)] rounded px-4 pl-9 py-2 text-[var(--light)] placeholder-[var(--muted)] focus:border-amber-400/50 outline-none text-sm"
            />
          </div>
        )}

        {/* Results table */}
        {selectedJd && (
          <>
            {loading ? (
              <div className="space-y-2 border border-[var(--edge)] rounded overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className={clsx(
                    'h-12 skeleton',
                    i === 1 && 'bg-[var(--panel)]'
                  )} />
                ))}
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="border border-[var(--edge)] rounded overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[3rem_1fr_1fr_1fr_160px_2rem] gap-4 px-5 py-3 bg-[var(--panel)] border-b border-[var(--edge)]">
                  <span className="font-mono text-[10px] text-[var(--dim)] tracking-widest">
                    RANK
                  </span>
                  <span className="font-mono text-[10px] text-[var(--dim)] tracking-widest">
                    CANDIDATE
                  </span>
                  <span className="font-mono text-[10px] text-[var(--dim)] tracking-widest">
                    ROLE
                  </span>
                  <span className="font-mono text-[10px] text-[var(--dim)] tracking-widest">
                    LOCATION
                  </span>
                  <span className="font-mono text-[10px] text-[var(--dim)] tracking-widest">
                    MATCH SCORE
                  </span>
                  <span className="font-mono text-[10px] text-[var(--dim)] tracking-widest" />
                </div>

                {/* Rows */}
                {filteredResults.map((candidate, i) => (
                  <CandidateRow
                    key={candidate.candidate_id}
                    candidate={candidate}
                    onOpenDetail={setOpenId}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-[var(--edge)] rounded-lg p-12 text-center">
                <Zap size={32} className="text-[var(--wire)] mx-auto mb-4" />
                <p className="text-[var(--dim)] mb-4">No results yet</p>
                <button
                  onClick={handleRunMatching}
                  disabled={runLoading}
                  className="px-4 py-2 bg-amber-400 text-[var(--ink)] rounded font-mono text-sm tracking-widest hover:bg-amber-300 transition-colors"
                >
                  {runLoading ? 'RUNNING...' : 'RUN MATCHING NOW'}
                </button>
              </div>
            )}

            {/* Footer stats */}
            {filteredResults.length > 0 && (
              <div className="flex justify-between items-center mt-6 px-2 font-mono text-[11px] text-[var(--dim)]">
                <span>
                  {searchFilter
                    ? `${filteredResults.length} matching candidate(s)`
                    : `${filteredResults.length} candidate(s) shown`}
                </span>
                <span>{results.length} total ranked</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Drawer */}
      {selectedJd && (
        <CandidateDrawer
          jdId={selectedJd}
          candidateId={openId}
          onClose={() => setOpenId(null)}
        />
      )}
    </main>
  );
}

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="pt-20 text-center text-[var(--dim)]">Loading...</div>}>
      <MatchPageContent />
    </Suspense>
  );
}
