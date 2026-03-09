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
    <div className={`flex items-center justify-center gap-6 py-5 px-8 bg-white border border-gray-100 rounded-3xl shadow-sm ${className}`}>
      <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <div className="h-6 w-[2px] bg-gray-100" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none">
          Sisa Waktu
        </span>
        <span className="text-xs font-bold text-gray-600 mt-1 uppercase tracking-tighter">
          Batas Waktu Tersisa
        </span>
      </div>
    </div>
  );
}
