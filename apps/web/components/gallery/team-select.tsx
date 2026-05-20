"use client"

import { TEAM_VALUES, type Team } from "@/app/types/gallery"
import { TEAM_LABELS } from "@/lib/gallery/team"
import { Label } from "@/components/ui/label"
import { cn } from "@workspace/ui/lib/utils"

interface TeamSelectProps {
  value: Team
  onChange: (team: Team) => void
  label?: string
  className?: string
}

export function TeamSelect({
  value,
  onChange,
  label = "Team",
  className,
}: TeamSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Team)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {TEAM_VALUES.map((team) => (
          <option key={team} value={team}>
            {TEAM_LABELS[team]}
          </option>
        ))}
      </select>
    </div>
  )
}
