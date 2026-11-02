export function momentum(count: number) {
  return count >= 5
    ? "Locked In"
    : count >= 3
      ? "High"
      : count === 2
        ? "Stable"
        : count === 1
          ? "Low"
          : "Dormant";
}
