import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

const tabs = [
  { label: "Plan", href: "/admin/plan" },
  { label: "Schedule", href: "/admin/schedule" },
  { label: "Nexus", href: "/admin/nexus" },
  { label: "Prompts", href: "/admin/prompts" },
  { label: "Decisions", href: "/admin/decisions" },
  { label: "Launch Checklist", href: "/admin/checklist" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--color-cream)]">
      <AdminSidebar tabs={tabs} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileNav tabs={tabs} />
        <main className="flex-1 px-6 md:px-10 py-10 md:py-12 max-w-5xl w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
