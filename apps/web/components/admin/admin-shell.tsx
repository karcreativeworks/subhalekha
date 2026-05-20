"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarDays,
  ImageIcon,
  Images,
  LayoutDashboard,
  LogOut,
  UserCog,
} from "lucide-react"
import { Toaster } from "sonner"

import {
  ADMIN_ACCESS,
  ADMIN_ACCESS_LABELS,
  hasAccess,
} from "@/lib/auth/access"
import { useSession } from "@/components/session-provider"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const navItems = [
  {
    href: "/admin/media",
    label: "Media Uploader",
    icon: ImageIcon,
    access: ADMIN_ACCESS.MEDIA_UPLOADER,
    breadcrumb: "Media Uploader",
  },
  {
    href: "/admin/events",
    label: "Events",
    icon: CalendarDays,
    access: ADMIN_ACCESS.EVENTS_MANAGER,
    breadcrumb: "Events",
  },
  {
    href: "/admin/gallery-blocks",
    label: "Gallery Blocks",
    icon: Images,
    access: ADMIN_ACCESS.GALLERY_BLOCKS_MANAGER,
    breadcrumb: "Gallery Blocks",
  },
  {
    href: "/admin/users",
    label: "Admin Users",
    icon: UserCog,
    access: ADMIN_ACCESS.ADMIN_USERS,
    breadcrumb: "Admin Users",
  },
] as const

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const sessionContext = useSession()
  const access = sessionContext?.session?.access ?? []

  const visibleNav = navItems.filter((item) => hasAccess(access, item.access))
  const activeNav =
    visibleNav.find((item) => pathname.startsWith(item.href)) ??
    navItems.find((item) => pathname.startsWith(item.href))

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex min-h-svh bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="border-b p-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Subhalekha
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Admin dashboard</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleNav.length ? (
            visibleNav.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No sections available for your account.
            </p>
          )}
        </nav>

        <div className="space-y-3 border-t p-4">
          {sessionContext?.session?.clientId ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Signed in as{" "}
                <span className="font-mono text-foreground">
                  {sessionContext.session.clientId}
                </span>
              </p>
              {access.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {access.map((key) => (
                    <span
                      key={key}
                      className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {ADMIN_ACCESS_LABELS[
                        key as keyof typeof ADMIN_ACCESS_LABELS
                      ] ?? key}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => void handleLogout()}
          >
            <LogOut className="mr-2 size-4" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LayoutDashboard className="size-4" />
            <span>Admin</span>
            <span>/</span>
            <span className="text-foreground">
              {activeNav?.breadcrumb ?? "Dashboard"}
            </span>
          </div>
          <Button variant="outline" asChild>
            <Link href="/">View site</Link>
          </Button>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
