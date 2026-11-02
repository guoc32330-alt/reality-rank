import type { SkillId } from "@/types";
export const SKILLS: { id: SkillId; name: string; description: string }[] = [
  {
    id: "coding",
    name: "Coding",
    description: "Turn knowledge into working code.",
  },
  { id: "ai", name: "AI", description: "Understand it. Build with it." },
  {
    id: "fitness",
    name: "Fitness",
    description: "Build a body you can rely on.",
  },
  { id: "school", name: "School", description: "Own the fundamentals." },
  {
    id: "project",
    name: "Project",
    description: "Ship something that matters.",
  },
  {
    id: "social",
    name: "Social",
    description: "Show up for real connections.",
  },
];
