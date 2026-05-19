import { AdminShell } from "@/components/admin/admin-shell"
import { ProtectedPage } from "@/components/auth/ProtectedPage"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedPage>
      <AdminShell>{children}</AdminShell>
    </ProtectedPage>
  )
}
