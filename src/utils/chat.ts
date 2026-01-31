export const getRoomKey = (userId1: string, userId2: string) => {
  const [x, y] = [String(userId1), String(userId2)].sort();
  return `chat:${x}:${y}`;
};
