'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  LayoutDashboard,
  PlayCircle,
  History,
  TrendingUp,
  Trophy,
  Activity,
  Settings,
  BookOpen,
} from 'lucide-react';
import { useMeData } from '@/lib/use-data';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workout', href: '/workout', icon: PlayCircle },
  { name: 'History', href: '/history', icon: History },
  { name: 'Exercises', href: '/exercises', icon: BookOpen },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
  { name: 'Records', href: '/records', icon: Trophy },
  { name: 'Body', href: '/body', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: meData } = useMeData();
  const user = meData?.user;

  if (pathname === '/') return null;

  const isGuest = user?.id === 'guest';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07080c]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="group flex items-center gap-2.5">
          <div className="glow-ring flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-[#04120c]">
            <Zap className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            Pulse<span className="text-glow-green">Fit</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-0.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/workout"
            className="btn-primary hidden sm:inline-flex px-4 py-2 text-[13px]"
          >
            <PlayCircle className="h-4 w-4" />
            <span>Train</span>
          </Link>

          {user ? (
            <Link
              href="/settings"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5 hover:border-emerald-500/40 transition-all"
              title={isGuest ? 'Guest — sign in to save' : user.email}
            >
              {user.image ? (
                <img src={user.image} alt={user.name} className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <div className="font-display flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/30 to-teal-500/20 text-sm font-bold text-emerald-300">
                  {user.name?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
              <span className="hidden md:inline max-w-[110px] truncate text-xs font-bold text-zinc-200">
                {user.name?.split(' ')[0]}
              </span>
              {isGuest && (
                <span className="hidden md:inline rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                  Guest
                </span>
              )}
            </Link>
          ) : (
            <Link href="/" className="btn-primary px-4 py-2 text-[13px]">
              <span>Sign in</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-[#0a0b10]/95 backdrop-blur-xl px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-4 gap-1">
          {navItems.slice(0, 8).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-emerald-300 bg-emerald-500/10' : 'text-zinc-500'
                }`}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span className="truncate max-w-full px-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
