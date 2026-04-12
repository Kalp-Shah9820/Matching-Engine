'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'OVERVIEW' },
    { href: '/upload', label: 'INGEST' },
    { href: '/match', label: 'MATCH' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--edge)] bg-[var(--ink)]/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <div className="font-display text-xl tracking-widest">
            <span className="text-[var(--snow)]">MATCH</span>
            <span className="text-amber-400">ENGINE</span>
          </div>
        </div>

        {/* Center-right: Navigation */}
        <div className="flex items-center gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'px-4 py-1.5 text-xs font-mono tracking-widest transition-all rounded-sm border',
                isActive(link.href)
                  ? 'bg-amber-400/10 text-amber-400 border-amber-400/30'
                  : 'text-[var(--dim)] hover:text-[var(--light)] hover:bg-white/5 border-transparent'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Far right: Status */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="font-mono text-xs text-[var(--dim)]">API CONNECTED</span>
        </div>
      </div>
    </nav>
  );
}
