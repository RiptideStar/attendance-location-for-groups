"use client";

import { useState, useEffect, useMemo } from "react";

interface CountdownTimerProps {
  targetTime: Date | string;
  onComplete: () => void;
}

export function CountdownTimer({ targetTime, onComplete }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const target = typeof targetTime === "string" ? new Date(targetTime) : targetTime;

    const updateTimer = () => {
      const now = new Date();
      const remaining = target.getTime() - now.getTime();

      if (remaining <= 0) {
        setTimeRemaining(0);
        onComplete();
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  const { days, hours, minutes, seconds } = useMemo(() => {
    const totalSeconds = Math.floor(timeRemaining / 1000);
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }, [timeRemaining]);

  if (timeRemaining <= 0) {
    return null;
  }

  return (
    <div className="card p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Registration Opens In
      </h3>

      <div className="flex items-center justify-center gap-3 mb-6">
        {days > 0 && (
          <>
            <TimeUnit value={days} label="days" />
            <Separator />
          </>
        )}
        <TimeUnit value={hours} label="hours" />
        <Separator />
        <TimeUnit value={minutes} label="min" />
        <Separator />
        <TimeUnit value={seconds} label="sec" />
      </div>

      <p className="text-sm text-gray-600">
        Keep this page open - check-in will be available soon
      </p>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 rounded-xl bg-indigo-50 flex items-center justify-center mb-1">
        <span className="text-2xl font-bold text-indigo-600 tabular-nums">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center h-16 text-indigo-300">
      <span className="text-2xl font-bold">:</span>
    </div>
  );
}
