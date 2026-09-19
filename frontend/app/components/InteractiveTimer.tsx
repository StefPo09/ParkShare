'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, Pause, Play, RotateCcw } from 'lucide-react';

type TimerVariant = 'reservation' | 'rental';

type InteractiveTimerProps = {
  title?: string;
  variant?: TimerVariant;
  targetTime?: number;
  defaultMinutes?: number;
};

const themeMap: Record<
  TimerVariant,
  {
    accent: string;
    accentStrong: string;
    accentSoft: string;
    badge: string;
    button: string;
    buttonHover: string;
  }
> = {
  reservation: {
    accent: 'from-[#0f4c81] to-[#04b697]',
    accentStrong: '#0f4c81',
    accentSoft: 'bg-[#dfeef0] dark:bg-[#0b1c2c]',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
    button: 'bg-[#0f4c81] hover:bg-[#0d3e68]',
    buttonHover: 'hover:bg-[#0d3e68]',
  },
  rental: {
    accent: 'from-[#f59e0b] to-[#f97316]',
    accentStrong: '#f59e0b',
    accentSoft: 'bg-[#fff7ed] dark:bg-[#2b1d0f]',
    badge: 'bg-amber-100 text-amber-700 dark:bg-orange-500/20 dark:text-orange-200',
    button: 'bg-[#f59e0b] hover:bg-[#d97706]',
    buttonHover: 'hover:bg-[#d97706]',
  },
};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

export default function InteractiveTimer({
  title = 'Parking timer',
  variant = 'reservation',
  targetTime,
  defaultMinutes = 15,
}: InteractiveTimerProps) {
  const [minutes, setMinutes] = useState(defaultMinutes);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (targetTime) {
      return Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
    }

    return defaultMinutes * 60;
  });
  const [isRunning, setIsRunning] = useState(Boolean(targetTime));

  const theme = themeMap[variant];
  const totalSeconds = useMemo(() => Math.max(1, minutes * 60), [minutes]);
  const progress = useMemo(() => {
    if (timeLeft <= 0) return 100;
    const elapsed = totalSeconds - timeLeft;
    return (elapsed / totalSeconds) * 100;
  }, [timeLeft, totalSeconds]);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (targetTime) {
        const nextTimeLeft = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
        setTimeLeft(nextTimeLeft);

        if (nextTimeLeft <= 0) {
          setIsRunning(false);
        }

        return;
      }

      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          setIsRunning(false);
          return 0;
        }

        return currentTime - 1;
      });
    };

    tick();
    const interval = window.setInterval(tick, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, targetTime]);

  const handleMinutesChange = (value: number) => {
    if (targetTime) return;

    const safeValue = Math.min(Math.max(value, 1), 120);
    setMinutes(safeValue);

    if (!isRunning) {
      setTimeLeft(safeValue * 60);
    }
  };

  const handleToggleTimer = () => {
    if (targetTime) {
      setIsRunning((current) => !current);
      return;
    }

    if (timeLeft === 0) {
      setTimeLeft(minutes * 60);
    }

    setIsRunning((current) => !current);
  };

  const handleReset = () => {
    if (targetTime) {
      setTimeLeft(Math.max(0, Math.ceil((targetTime - Date.now()) / 1000)));
      setIsRunning(true);
      return;
    }

    setIsRunning(false);
    setTimeLeft(minutes * 60);
  };

  return (
    <div className="rounded-[28px] border border-black/5 bg-white/20 p-4 shadow-[0_18px_30px_rgba(15,32,35,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex items-center justify-between text-[#121212] dark:text-white">
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" style={{ color: theme.accentStrong }} strokeWidth={2.2} />
          <span className="text-[18px] font-bold tracking-tight sm:text-[22px]">
            {title}
          </span>
        </div>

        <span
          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            timeLeft === 0
              ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
              : isRunning
                ? theme.badge
                : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200'
          }`}
        >
          {timeLeft === 0 ? 'Finished' : isRunning ? 'Running' : 'Ready'}
        </span>
      </div>

      <div className={`mb-4 rounded-2xl p-4 ${theme.accentSoft}`}>
        <p className="text-center text-[42px] font-black tracking-[-0.06em] text-[#121212] dark:text-white">
          {formatTime(timeLeft)}
        </p>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${theme.accent} transition-all duration-500`}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="flex-1 text-sm font-medium text-[#42565d] dark:text-[#dfeef0]">
          Minutes
          <input
            type="number"
            min={1}
            max={120}
            value={minutes}
            readOnly={Boolean(targetTime)}
            onChange={(event) => handleMinutesChange(Number(event.target.value || 1))}
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-base font-medium text-[#121212] outline-none ring-0 transition focus:border-[#0f4c81] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#011b1b] dark:text-white"
          />
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleToggleTimer}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99] ${theme.button}`}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {isRunning ? 'Pause' : timeLeft === 0 ? 'Start again' : 'Start'}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#121212] transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          aria-label="Reset timer"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
