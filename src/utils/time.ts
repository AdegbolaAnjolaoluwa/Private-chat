export function getRemainingTime(expiresAt: string): {
  total: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const total = expiry - now;

  if (total <= 0) {
    return {
      total: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }

  return {
    total,
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    isExpired: false,
  };
}

export function getExpiryTime(createdAt: string, hoursToExpire: number = 2): string {
  const created = new Date(createdAt);
  const expiry = new Date(created.getTime() + hoursToExpire * 60 * 60 * 1000);
  return expiry.toISOString();
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `${minutes}m ago`;
  }

  if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  }

  return date.toLocaleDateString();
}
