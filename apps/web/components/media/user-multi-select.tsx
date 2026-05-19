"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Loader2, Plus, User, X } from "lucide-react"

import type { User as SiteUser } from "@/app/types/users"
import { Badge } from "@/components/ui/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@workspace/ui/lib/utils"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface UserMultiSelectProps {
  taggedUsers: string[]
  onTaggedUsersChange: (userIds: string[]) => void
  label?: string
  className?: string
}

export function UserMultiSelect({
  taggedUsers,
  onTaggedUsersChange,
  label = "Users",
  className,
}: UserMultiSelectProps) {
  const [search, setSearch] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { data: users = [], isLoading, mutate } = useSWR<SiteUser[]>(
    "/api/users",
    fetcher,
  )

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users
    const query = search.toLowerCase()
    return users.filter(
      (user) =>
        user.displayName.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query),
    )
  }, [users, search])

  const getDisplayName = (userId: string) =>
    users.find((user) => user.id === userId)?.displayName ?? userId

  const toggleUser = (userId: string) => {
    onTaggedUsersChange(
      taggedUsers.includes(userId)
        ? taggedUsers.filter((id) => id !== userId)
        : [...taggedUsers, userId],
    )
  }

  const createUser = async () => {
    const name = search.trim()
    if (!name || isCreating) return

    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")

    setIsCreating(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, displayName: name }),
      })
      if (response.ok) {
        const newUser = (await response.json()) as SiteUser
        await mutate()
        onTaggedUsersChange([...taggedUsers, newUser.id])
        setSearch("")
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label ? (
        <Label className="flex items-center gap-2">
          <User className="size-4" />
          {label}
        </Label>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Tag users who appear in this media. They can sign in later to see photos
        they are tagged in.
      </p>

      {taggedUsers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {taggedUsers.map((userId) => (
            <Badge key={userId} variant="secondary" className="gap-1 pr-1">
              {getDisplayName(userId)}
              <button
                type="button"
                onClick={() =>
                  onTaggedUsersChange(
                    taggedUsers.filter((id) => id !== userId),
                  )
                }
                className="rounded-full p-0.5 hover:bg-muted"
                aria-label={`Remove ${getDisplayName(userId)}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      <Input
        placeholder="Search or add a user…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault()
            const exact = users.find(
              (user) =>
                user.id === search.trim().toLowerCase() ||
                user.displayName.toLowerCase() === search.trim().toLowerCase(),
            )
            if (exact) {
              toggleUser(exact.id)
              setSearch("")
              return
            }
            void createUser()
          }
        }}
      />

      <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border p-2">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            No users yet. Type a name and press Enter to add one.
          </p>
        ) : (
          filteredUsers.map((user) => {
            const selected = taggedUsers.includes(user.id)
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleUser(user.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
                  selected && "bg-primary/10 text-primary",
                )}
              >
                <span>{user.displayName}</span>
                <span className="text-xs text-muted-foreground">@{user.id}</span>
              </button>
            )
          })
        )}
      </div>

      {search.trim() &&
      !users.some(
        (user) =>
          user.displayName.toLowerCase() === search.trim().toLowerCase() ||
          user.id === search.trim().toLowerCase(),
      ) ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void createUser()}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          Add &quot;{search.trim()}&quot;
        </Button>
      ) : null}
    </div>
  )
}
