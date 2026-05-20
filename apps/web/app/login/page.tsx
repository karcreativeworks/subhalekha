"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const inputClassName = cn(
  "flex h-9 w-full rounded-xl border border-input bg-input/30 px-3 py-1 text-sm shadow-xs transition-colors",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none",
)

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") ?? "/admin"

  const [clientId, setClientId] = useState("")
  const [clientKey, setClientKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientKey }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { message?: string }
        setError(data.message ?? "Invalid credentials")
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm space-y-8">
      <div className="space-y-2 text-center">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight hover:opacity-80"
        >
          Subhalekha
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Admin sign in</h1>
        <p className="text-sm text-muted-foreground">
          Sign in with your client credentials to manage uploads.
        </p>
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="clientId" className="text-sm font-medium">
            Username
          </label>
          <input
            id="clientId"
            type="text"
            className={inputClassName}
            placeholder="username"
            required
            autoComplete="username"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="clientKey" className="text-sm font-medium">
            Password
          </label>
          <input
            id="clientKey"
            type="password"
            className={inputClassName}
            placeholder="••••••••••••"
            required
            autoComplete="current-password"
            value={clientKey}
            onChange={(e) => setClientKey(e.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="text-primary hover:underline">
          Back to site
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-6 py-12">
      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Loading…</p>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
