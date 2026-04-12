import clsx from 'clsx';

interface SkillPillProps {
  label: string;
  variant: 'match' | 'miss' | 'neutral';
}

export function SkillPill({ label, variant }: SkillPillProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border',
        variant === 'match' && 'bg-teal-400/10 text-teal-400 border-teal-400/25',
        variant === 'miss' && 'bg-rose-400/10 text-rose-400 border-rose-400/25',
        variant === 'neutral' && 'bg-white/5 text-[var(--dim)] border-[var(--wire)]'
      )}
    >
      {label}
    </span>
  );
}
