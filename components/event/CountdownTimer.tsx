"use client";

import { useState, useEffect } from "react";
import { formatDuration } from "@/lib/utils/date-helpers";

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

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  if (timeRemaining <= 0) {
    return null;
  }

  return (
    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Registration Opens In
      </h3>
      <div className="text-3xl font-bold text-blue-600 mb-2">
        {formatDuration(timeRemaining)}
      </div>
      <p className="text-sm text-gray-600">
        Check-in will be available soon. Keep this page open!
      </p>
    </div>
  );
}
