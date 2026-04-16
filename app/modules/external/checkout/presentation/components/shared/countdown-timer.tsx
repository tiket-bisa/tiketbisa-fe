import { useState, useEffect } from "react";

const STORAGE_KEY = "tiketbisa_checkout_deadline";

export interface CountdownTimerProps {
  initialMinutes?: number;
  onExpire?: () => void;
  className?: string;
}

export function CountdownTimer({ initialMinutes = 15, onExpire, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let deadline = sessionStorage.getItem(STORAGE_KEY);
    
    if (!deadline) {
      const newDeadline = Date.now() + initialMinutes * 60 * 1000;
      sessionStorage.setItem(STORAGE_KEY, newDeadline.toString());
      deadline = newDeadline.toString();
    }

    const calculateTimeLeft = () => {
      const difference = parseInt(deadline!) - Date.now();
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());
  }, [initialMinutes]);

  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft < 60;
  
  // Colors based on urgency
  const containerStyles = isUrgent 
    ? "bg-red-50 border-red-200 shadow-red-100" 
    : "bg-orange-50 border-orange-200 shadow-orange-100";
  
  const textStyles = isUrgent 
    ? "text-red-600 animate-pulse" 
    : "text-orange-600";

  const dividerStyles = isUrgent 
    ? "bg-red-200" 
    : "bg-orange-200";

  const labelStyles = isUrgent 
    ? "text-red-400" 
    : "text-orange-400";

  const subLabelStyles = isUrgent 
    ? "text-red-600" 
    : "text-orange-600";

  return (
    <div className={`flex items-center justify-center gap-6 py-4 px-8 border-2 rounded-3xl shadow-sm transition-colors duration-500 animate-in fade-in ${containerStyles} ${className}`}>
      <span className={`text-2xl font-black font-mono tracking-tight ${textStyles}`}>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      
      <div className={`h-6 w-[2px] ${dividerStyles}`} />
      
      <div className="flex flex-col">
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${labelStyles}`}>
          Sisa Waktu
        </span>
        <span className={`text-xs font-bold mt-1 uppercase tracking-tighter ${subLabelStyles}`}>
          Batas Waktu Tersisa
        </span>
      </div>
    </div>
  );
}
