'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock3, Pause, Play, RotateCcw, AlertTriangle, MapPin, DollarSign } from 'lucide-react';

type TimerVariant = 'reservation' | 'rental' | 'overtime';

type InteractiveTimerProps = {
    title?: string;
    variant?: TimerVariant;
    targetTime?: number;
    startTime?: number;
    defaultMinutes?: number;
    spotAddress?: string;
    hourlyRate?: number;
    currency?: string;
    leaveByTime?: string;
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
        accent: 'from-[#0f4c81] to-[#2dd4bf]',
        accentStrong: '#0f4c81',
        accentSoft: 'bg-[#e6f4f4] dark:bg-[#072424]',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
        button: 'bg-[#0f4c81] hover:bg-[#0d3e68]',
        buttonHover: 'hover:bg-[#0d3e68]',
    },
    overtime: {
        accent: 'from-[#ef4444] to-[#f97316]',
        accentStrong: '#ef4444',
        accentSoft: 'bg-[#fef2f2] dark:bg-[#2b0f0f]',
        badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200 animate-pulse',
        button: 'bg-[#ef4444] hover:bg-[#dc2626]',
        buttonHover: 'hover:bg-[#dc2626]',
    },
};

function formatTime(totalSeconds: number) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;
}

export default function InteractiveTimer({
                                             title = 'Parking timer',
                                             variant = 'rental',
                                             targetTime,
                                             startTime,
                                             defaultMinutes = 15,
                                             spotAddress,
                                             hourlyRate = 4.0,
                                             currency = 'RON',
                                             leaveByTime,
                                         }: InteractiveTimerProps) {
    const [minutes, setMinutes] = useState(defaultMinutes);
    const [manualTimeLeft, setManualTimeLeft] = useState(defaultMinutes * 60);
    const [isRunningManual, setIsRunningManual] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const interval = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => window.clearInterval(interval);
    }, []);

    // Manual mode ticker
    useEffect(() => {
        if (targetTime || !isRunningManual) return;

        const interval = window.setInterval(() => {
            setManualTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsRunningManual(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => window.clearInterval(interval);
    }, [targetTime, isRunningManual]);

    const isTargetMode = Boolean(targetTime);
    const isOvertime = isTargetMode && targetTime ? now > targetTime : false;
    const currentVariant: TimerVariant = isOvertime ? 'overtime' : variant;
    const theme = themeMap[currentVariant];

    const targetSecondsLeft = targetTime ? Math.max(0, Math.ceil((targetTime - now) / 1000)) : 0;
    const overtimeSeconds = isOvertime && targetTime ? Math.floor((now - targetTime) / 1000) : 0;

    const extraCost = useMemo(() => {
        if (!isOvertime || overtimeSeconds <= 0) return 0;
        const cost = (overtimeSeconds / 3600) * hourlyRate;
        return Math.round(cost * 100) / 100;
    }, [isOvertime, overtimeSeconds, hourlyRate]);

    const displayTime = isTargetMode
        ? isOvertime
            ? `+${formatTime(overtimeSeconds)}`
            : formatTime(targetSecondsLeft)
        : formatTime(manualTimeLeft);

    const totalSeconds = useMemo(() => {
        if (targetTime && startTime && targetTime > startTime) {
            return Math.max(1, Math.ceil((targetTime - startTime) / 1000));
        }
        return Math.max(1, minutes * 60);
    }, [targetTime, startTime, minutes]);

    const progress = useMemo(() => {
        if (isOvertime) return 100;
        if (isTargetMode) {
            const elapsed = totalSeconds - targetSecondsLeft;
            return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
        }
        const elapsed = totalSeconds - manualTimeLeft;
        return (elapsed / totalSeconds) * 100;
    }, [isOvertime, isTargetMode, totalSeconds, targetSecondsLeft, manualTimeLeft]);

    const handleMinutesChange = (value: number) => {
        if (isTargetMode) return;
        const safeValue = Math.min(Math.max(value, 1), 120);
        setMinutes(safeValue);
        if (!isRunningManual) {
            setManualTimeLeft(safeValue * 60);
        }
    };

    const handleToggleManual = () => {
        if (manualTimeLeft === 0) {
            setManualTimeLeft(minutes * 60);
        }
        setIsRunningManual((prev) => !prev);
    };

    const handleResetManual = () => {
        setIsRunningManual(false);
        setManualTimeLeft(minutes * 60);
    };

    return (
        <div className={`rounded-[28px] border p-4 shadow-[0_18px_30px_rgba(15,32,35,0.08)] backdrop-blur-sm transition-all duration-300 ${
            isOvertime
                ? 'border-red-500/30 bg-red-50/40 dark:border-red-500/20 dark:bg-red-950/20'
                : 'border-black/5 bg-white/20 dark:border-white/10 dark:bg-white/5'
        }`}>
            {/* Header */}
            <div className="mb-3 flex items-center justify-between text-[#121212] dark:text-white">
                <div className="flex items-center gap-2">
                    {isOvertime ? (
                        <AlertTriangle className="h-5 w-5 text-red-500 animate-bounce" strokeWidth={2.2} />
                    ) : (
                        <Clock3 className="h-5 w-5" style={{ color: theme.accentStrong }} strokeWidth={2.2} />
                    )}
                    <div>
                        <span className="text-[17px] font-bold tracking-tight sm:text-[20px] block leading-tight">
                            {title}
                        </span>
                        {spotAddress && (
                            <span className="text-[11px] font-medium text-[#42565d] dark:text-[#dfeef0] flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate max-w-[220px]">{spotAddress}</span>
                            </span>
                        )}
                    </div>
                </div>

                <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                        isOvertime
                            ? theme.badge
                            : isTargetMode
                                ? targetSecondsLeft > 0
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                                : manualTimeLeft === 0
                                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                                    : isRunningManual
                                        ? theme.badge
                                        : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                    }`}
                >
                    {isOvertime
                        ? 'Overtime'
                        : isTargetMode
                            ? 'Active Parking'
                            : manualTimeLeft === 0
                                ? 'Finished'
                                : isRunningManual
                                    ? 'Running'
                                    : 'Ready'}
                </span>
            </div>

            {/* Main Timer Display */}
            <div className={`mb-3 rounded-2xl p-4 transition-colors ${theme.accentSoft}`}>
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#42565d] dark:text-[#dfeef0]/80 mb-1">
                        {isOvertime
                            ? 'Overtime Elapsed'
                            : isTargetMode
                                ? 'Time remaining until you must leave'
                                : 'Timer'}
                    </p>
                    <p className={`text-[42px] font-black tracking-[-0.06em] leading-none ${
                        isOvertime ? 'text-red-600 dark:text-red-400' : 'text-[#121212] dark:text-white'
                    }`}>
                        {displayTime}
                    </p>
                    {leaveByTime && !isOvertime && (
                        <p className="mt-2 text-xs font-medium text-[#42565d] dark:text-[#dfeef0]">
                            Please leave by <span className="font-bold text-[#121212] dark:text-white">{leaveByTime}</span>
                        </p>
                    )}
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${theme.accent} transition-all duration-500`}
                        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                    />
                </div>
            </div>

            {/* Overtime Extra Cost Notice */}
            {isOvertime && (
                <div className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-center dark:bg-red-500/15">
                    <div className="flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-sm mb-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>You are staying overtime!</span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-center gap-1">
                        <span className="text-xs text-[#42565d] dark:text-[#dfeef0]">Extra cost to pay:</span>
                        <span className="text-xl font-extrabold text-red-600 dark:text-red-400">
                            +{extraCost.toFixed(2)} {currency}
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[#52737c] dark:text-[#9db0b6]">
                        Rate: {hourlyRate.toFixed(2)} {currency}/hour
                    </p>
                </div>
            )}

            {/* Manual Controls (shown only if no targetTime) */}
            {!isTargetMode && (
                <>
                    <div className="mb-4 flex items-center gap-3">
                        <label className="flex-1 text-sm font-medium text-[#42565d] dark:text-[#dfeef0]">
                            Minutes
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={minutes}
                                onChange={(event) => handleMinutesChange(Number(event.target.value || 1))}
                                className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-base font-medium text-[#121212] outline-none ring-0 transition focus:border-[#0f4c81] dark:border-white/10 dark:bg-[#011b1b] dark:text-white"
                            />
                        </label>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleToggleManual}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.99] ${theme.button}`}
                        >
                            {isRunningManual ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            {isRunningManual ? 'Pause' : manualTimeLeft === 0 ? 'Start again' : 'Start'}
                        </button>

                        <button
                            type="button"
                            onClick={handleResetManual}
                            className="flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#121212] transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                            aria-label="Reset timer"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}