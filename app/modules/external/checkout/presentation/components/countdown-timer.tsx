import { useState, useEffect } from "react";

export interface CountdownTimerProps {
  initialMinutes?: number;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ initialMinutes = 15, onExpire, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={`flex items-center justify-between p-5 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-2xl ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-primary/10 rounded-xl">
          <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-sm font-bold text-gray-700">Selesaikan dalam</span>
      </div>
      <span className="text-xl font-mono font-black text-brand-primary">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
