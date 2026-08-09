'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  Dumbbell,
  LayoutDashboard,
  PlayCircle,
  History,
  TrendingUp,
  Trophy,
  Activity,
  Settings,
  BookOpen,
  User as UserIcon,
} from 'lucide-react';

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

  const { data: meData } = useQuery({
    queryKey: ['userSettings'],
    queryFn: () => apiFetch('/api/users/me'),
  });

  const user = meData?.user || { name: 'Demo Gym Athlete', email: 'dev@gymtracker.local' };

  if (pathname === '/') return null;

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-emerald-400">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span>GYM<span className="text-zinc-100 font-light">TRACKER</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile / Status */}
        <div className="flex items-center gap-3">
          <Link
            href="/workout"
            className="flex items-center gap-2 rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/10"
          >
            <PlayCircle className="h-4 w-4 fill-zinc-950 text-emerald-500" />
            <span>Active Workout</span>
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/30 transition-all text-xs font-bold text-zinc-200"
          >
            {user.image ? (
              <img src={user.image} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="hidden sm:inline max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
          </Link>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg px-2 py-2">
        <div className="grid grid-cols-4 gap-1">
          {navItems.slice(0, 8).map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium ${
                  isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-400'
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
