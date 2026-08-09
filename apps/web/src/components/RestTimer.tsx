'use client';

import React, { useState, useEffect } from 'react';
import { Timer, SkipForward, Plus, X } from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  onFinish?: () => void;
}

export function RestTimer({ initialSeconds = 90, onFinish }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setTimeLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (onFinish) onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onFinish]);

  if (!isRunning && timeLeft === 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const add30Seconds = () => {
    setTimeLeft(prev => prev + 30);
    setIsRunning(true);
  };

  const skipTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    if (onFinish) onFinish();
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-zinc-900/90 p-3 shadow-2xl backdrop-blur-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 animate-pulse">
        <Timer className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-400/80">Rest Timer</p>
        <p className="text-xl font-mono font-bold text-zinc-100">{formattedTime}</p>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        <button
          onClick={add30Seconds}
          className="flex h-8 items-center gap-1 rounded-lg bg-zinc-800 px-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>30s</span>
        </button>
        <button
          onClick={skipTimer}
          className="flex h-8 items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/30 transition-colors"
        >
          <SkipForward className="h-3.5 w-3.5" />
          <span>Skip</span>
        </button>
      </div>
    </div>
  );
}
