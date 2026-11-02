import { FLOOR } from "@/config/decay";
export function decayFloor(peak: number, mastery: number) {
  return (
    peak *
    (FLOOR.baseRetention +
      (Math.min(100, mastery) / 100) * FLOOR.masteryRetention)
  );
}
