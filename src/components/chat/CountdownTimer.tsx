import { useState, useEffect } from "react";
import { getRemainingTime } from "@/utils/time";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(expiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getRemainingTime(expiresAt);
      setTimeLeft(remaining);

      if (remaining.isExpired && onExpire) {
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <span className="text-xs text-message-expired flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Expired
      </span>
    );
  }

  return (
    <span className="text-xs opacity-70 flex items-center gap-1">
      <Clock className="w-3 h-3" />
      {timeLeft.hours}h {timeLeft.minutes}m
    </span>
  );
}
