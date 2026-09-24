import "@/components/public/layouts";
import "../layout-tokens.css";
import "@/components/admin/shell/admin.css";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
