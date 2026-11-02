import type { RankDefinition } from "@/types";
export function rankFor(rating: number, ranks: RankDefinition[]) {
  return [...ranks].reverse().find((r) => rating >= r.threshold) ?? ranks[0];
}
export function rankProgress(rating: number, ranks: RankDefinition[]) {
  const current = rankFor(rating, ranks);
  const next = ranks[ranks.indexOf(current) + 1];
  return {
    current,
    next,
    percent: next
      ? Math.min(
          100,
          Math.max(
            0,
            ((rating - current.threshold) /
              (next.threshold - current.threshold)) *
              100,
          ),
        )
      : 100,
  };
}
