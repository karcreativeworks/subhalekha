import { TEAM_VALUES, type Team } from "@/app/types/gallery"

export function isValidTeam(value: unknown): value is Team {
  return (
    typeof value === "string" &&
    (TEAM_VALUES as readonly string[]).includes(value)
  )
}

export const TEAM_LABELS: Record<Team, string> = {
  bride: "Bride",
  groom: "Groom",
  both: "Both",
}
