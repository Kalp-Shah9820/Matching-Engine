'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, Briefcase, Clock, Building2 } from 'lucide-react';
import { getMatchDetail } from '@/lib/api';
import { MatchDetail } from '@/types';
import { ScoreBar } from './ScoreBar';
import { SkillPill } from './SkillPill';
import clsx from 'clsx';

interface CandidateDrawerProps {
  jdId: string;
  candidateId: string | null;
  onClose: () => void;
}

export function CandidateDrawer({
  jdId,
  candidateId,
  onClose,
}: CandidateDrawerProps) {
  const [data, setData] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    getMatchDetail(jdId, candidateId)
      .then((detail) => {
        setData(detail);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [jdId, candidateId]);

  const isOpen = candidateId !== null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={clsx(
          'fixed top-0 right-0 w-full max-w-xl h-screen bg-[var(--panel)] border-l border-[var(--edge)] overflow-y-auto z-50 transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--edge)] bg-[var(--panel)]">
          <span className="font-mono text-[10px] text-amber-400 tracking-widest">
            CANDIDATE DETAIL
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-[var(--dim)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-8 rounded" />
              ))}
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-400/10 border border-rose-400/25 rounded text-rose-400 text-sm">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Name & Score */}
              <div>
                <h2 className="font-display text-3xl text-[var(--snow)] mb-2">
                  {data.name || 'Unknown'}
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold" style={{
                    color: data.score >= 0.75 ? '#2dd4bf' : data.score >= 0.5 ? '#f59e0b' : data.score >= 0.3 ? '#d97706' : '#fb7185'
                  }}>
                    {data.score_percent}
                  </span>
                  <span className="font-mono text-[10px] text-amber-400 tracking-widest">
                    MATCH SCORE
                  </span>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 text-xs font-mono text-[var(--dim)]">
                {data.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{data.location}</span>
                  </div>
                )}
                {data.years_of_experience !== null && (
                  <div className="flex items-center gap-1">
                    <Briefcase size={14} />
                    <span>{data.years_of_experience} yrs</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Rank #{data.rank}</span>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="bg-[#0f0f0f] border border-[var(--edge)] rounded p-4 space-y-3">
                <ScoreBar score={data.score} label="Overall Score" small={false} />
              </div>

              {/* Skills matched */}
              {data.skills_matched.length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] text-amber-400 tracking-widest mb-3">
                    SKILLS MATCHED
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.skills_matched.map((skill) => (
                      <SkillPill key={skill} label={skill} variant="match" />
                    ))}
                  </div>
                </div>
              )}

              {/* Skills missing */}
              {data.skills_missing.length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] text-rose-400 tracking-widest mb-3">
                    GAPS IDENTIFIED
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {data.skills_missing.map((skill) => (
                      <SkillPill key={skill} label={skill} variant="miss" />
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="bg-[#0f0f0f] border border-[var(--edge)] rounded p-4">
                <p className="text-sm text-[var(--light)] leading-relaxed">
                  {data.explanation}
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-3 pt-2">
                {data.experience_note && (
                  <div className="flex gap-3 text-sm">
                    <Briefcase size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--light)]">{data.experience_note}</p>
                  </div>
                )}
                {data.company_context && (
                  <div className="flex gap-3 text-sm">
                    <Building2 size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--light)]">{data.company_context}</p>
                  </div>
                )}
                {data.education_note && (
                  <div className="flex gap-3 text-sm">
                    <Clock size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--light)]">{data.education_note}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
