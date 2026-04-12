'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

interface ScoreBarProps {
  score: number;
  label?: string;
  small?: boolean;
}

export function ScoreBar({ score, label, small = false }: ScoreBarProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setDisplayScore(score);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isInView, score]);

  const getColor = () => {
    if (score >= 0.75) return 'bg-teal-400';
    if (score >= 0.5) return 'bg-amber-400';
    if (score >= 0.3) return 'bg-amber-600';
    return 'bg-rose-500';
  };

  const percentage = Math.round(displayScore * 100);

  return (
    <div ref={containerRef} className="w-full">
      {label && (
        <div className="flex justify-between mb-2">
          <span className={clsx(
            'font-mono tracking-widest text-[var(--dim)]',
            small ? 'text-[10px]' : 'text-xs'
          )}>
            {label}
          </span>
          <span className={clsx(
            'font-mono font-bold',
            score >= 0.75 && 'text-teal-400',
            score >= 0.5 && score < 0.75 && 'text-amber-400',
            score >= 0.3 && score < 0.5 && 'text-amber-600',
            score < 0.3 && 'text-rose-500'
          )}>
            {percentage}%
          </span>
        </div>
      )}
      <div className={clsx(
        'w-full bg-[var(--wire)] rounded-full overflow-hidden',
        small ? 'h-1' : 'h-1.5'
      )}>
        <div
          className={clsx(
            'h-full transition-all duration-700 ease-out',
            getColor()
          )}
          style={{
            width: `${isInView ? displayScore * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}
