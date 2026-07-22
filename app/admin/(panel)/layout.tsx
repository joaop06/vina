import { AdminBusyProvider } from "@/components/admin/AdminBusy";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminToaster } from "@/components/admin/AdminToaster";
import { ConfirmProvider } from "@/components/admin/ConfirmDialog";
import { mediaUrl } from "@/src/lib/front/format";
import { getCachedSiteConfig } from "@/src/lib/cache/storefront-reads";
import { clearSession } from "@/src/lib/auth/session";
import { redirect } from "next/navigation";

async function logout() {
  "use server";
  await clearSession();
  redirect("/admin/login");
}

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getCachedSiteConfig();
  return (
    <ConfirmProvider>
      <AdminBusyProvider>
        <AdminToaster />
        <div className="admin-shell">
          <AdminSidebar
            logoutAction={logout}
            storeName={site.nomeLoja}
            logoUrl={mediaUrl(site.logo?.path)}
          />
          <div className="admin-main">{children}</div>
        </div>
      </AdminBusyProvider>
    </ConfirmProvider>
  );
}
