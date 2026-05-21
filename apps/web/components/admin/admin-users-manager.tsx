"use client"

import { useState } from "react"
import useSWR from "swr"
import { Loader2, Pencil, Plus, UserCog } from "lucide-react"
import { toast } from "sonner"

import {
  ADMIN_ACCESS_LABELS,
  ALL_ADMIN_ACCESS,
  type AdminAccessKey,
} from "@/lib/auth/access"
import type { AdminClientPublic } from "@/lib/db/admin-clients"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import {
  adminFetch,
  createAdminFetcher,
  useAdminClientId,
} from "@/lib/admin/admin-api"

type FormState = {
  clientId: string
  apiKey: string
  clientName: string
  access: AdminAccessKey[]
  isValid: boolean
}

const emptyForm = (): FormState => ({
  clientId: "",
  apiKey: "",
  clientName: "",
  access: [],
  isValid: true,
})

function AccessCheckboxes({
  value,
  onChange,
}: {
  value: AdminAccessKey[]
  onChange: (next: AdminAccessKey[]) => void
}) {
  return (
    <div className="space-y-2">
      <Label>Access permissions</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        {ALL_ADMIN_ACCESS.map((key) => {
          const checked = value.includes(key)
          return (
            <label
              key={key}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition-colors",
                checked ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  onChange(
                    checked
                      ? value.filter((item) => item !== key)
                      : [...value, key],
                  )
                }}
                className="size-4 rounded border-input"
              />
              <span>{ADMIN_ACCESS_LABELS[key]}</span>
              <span className="ml-auto font-mono text-xs text-muted-foreground">
                {key}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function AdminUsersManager() {
  const clientId = useAdminClientId()
  const { data: users = [], isLoading, mutate } = useSWR<AdminClientPublic[]>(
    clientId ? "/api/admin-users" : null,
    createAdminFetcher(clientId),
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm())
    setCreatedKey(null)
    setDialogOpen(true)
  }

  const openEdit = (user: AdminClientPublic) => {
    setEditingId(user.clientId)
    setForm({
      clientId: user.clientId,
      apiKey: "",
      clientName: user.clientName,
      access: (user.access ?? []).filter((key): key is AdminAccessKey =>
        ALL_ADMIN_ACCESS.includes(key as AdminAccessKey),
      ),
      isValid: user.isValid,
    })
    setCreatedKey(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (editingId) {
        const response = await adminFetch(
          `/api/admin-users/${editingId}`,
          clientId,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientName: form.clientName,
              ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
              access: form.access,
              isValid: form.isValid,
            }),
          },
        )
        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          throw new Error(data.error ?? "Update failed")
        }
        toast.success("Admin user updated")
      } else {
        if (!form.clientId.trim() || !form.apiKey.trim()) {
          toast.error("Client ID and client key are required")
          return
        }
        const response = await adminFetch("/api/admin-users", clientId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: form.clientId.trim(),
            apiKey: form.apiKey.trim(),
            clientName: form.clientName.trim() || form.clientId.trim(),
            access: form.access,
            isValid: form.isValid,
          }),
        })
        if (!response.ok) {
          const data = (await response.json()) as { error?: string }
          throw new Error(data.error ?? "Create failed")
        }
        const created = (await response.json()) as AdminClientPublic & {
          apiKey?: string
        }
        setCreatedKey(created.apiKey ?? form.apiKey)
        toast.success("Admin user created")
      }

      await mutate()
      if (editingId) {
        setDialogOpen(false)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save admin user",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async (targetClientId: string) => {
    if (!confirm(`Deactivate admin user "${targetClientId}"?`)) return

    const response = await adminFetch(
      `/api/admin-users/${targetClientId}`,
      clientId,
      { method: "DELETE" },
    )
    if (response.ok) {
      toast.success("Admin user deactivated")
      void mutate()
    } else {
      const data = (await response.json()) as { error?: string }
      toast.error(data.error ?? "Failed to deactivate")
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Admin users</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage who can sign in and which admin areas they can access.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          Add admin user
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No admin users yet. Create one to get started.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Client ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Access</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.clientId} className="border-t">
                  <td className="px-4 py-3 font-mono">{user.clientId}</td>
                  <td className="px-4 py-3">{user.clientName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(user.access ?? []).length ? (
                        user.access.map((key) => (
                          <Badge key={key} variant="secondary">
                            {ADMIN_ACCESS_LABELS[key as AdminAccessKey] ?? key}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isValid ? "default" : "outline"}>
                      {user.isValid ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      {user.isValid ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDeactivate(user.clientId)}
                        >
                          Deactivate
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="size-5" />
              {editingId ? "Edit admin user" : "New admin user"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!editingId ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="admin-client-id">Client ID</Label>
                  <Input
                    id="admin-client-id"
                    value={form.clientId}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        clientId: event.target.value,
                      }))
                    }
                    placeholder="e.g. priya"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-client-key">Client key</Label>
                  <Input
                    id="admin-client-key"
                    type="password"
                    value={form.apiKey}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        apiKey: event.target.value,
                      }))
                    }
                    placeholder="Sign-in password"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Client ID</Label>
                <p className="font-mono text-sm">{form.clientId}</p>
                <Label htmlFor="admin-new-key">New client key (optional)</Label>
                <Input
                  id="admin-new-key"
                  type="password"
                  value={form.apiKey}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, apiKey: event.target.value }))
                  }
                  placeholder="Leave blank to keep current key"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="admin-client-name">Display name</Label>
              <Input
                id="admin-client-name"
                value={form.clientName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    clientName: event.target.value,
                  }))
                }
              />
            </div>

            <AccessCheckboxes
              value={form.access}
              onChange={(access) => setForm((prev) => ({ ...prev, access }))}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isValid}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isValid: event.target.checked,
                  }))
                }
                className="size-4 rounded border-input"
              />
              Account is active
            </label>

            {createdKey ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium">User created. Save this client key:</p>
                <p className="mt-1 break-all font-mono">{createdKey}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {createdKey ? "Close" : "Cancel"}
            </Button>
            {!createdKey ? (
              <Button onClick={() => void handleSave()} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
