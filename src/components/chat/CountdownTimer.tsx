import { useState, useEffect } from "react";
import { getRemainingTime } from "@/utils/time";

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
    return <span>0h 00m</span>;
  }

  return (
    <span>
      {timeLeft.hours}h {timeLeft.minutes}m
    </span>
  );
}
