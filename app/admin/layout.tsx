import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

const tabGroups = [
  {
    heading: "Workspace",
    tabs: [
      { label: "Overview", href: "/admin" },
      { label: "Pulse", href: "/admin/pulse" },
      { label: "Plan", href: "/admin/plan" },
      { label: "Schedule", href: "/admin/schedule" },
      { label: "Nexus map", href: "/admin/nexus" },
      { label: "Prompts", href: "/admin/prompts" },
      { label: "Workflows", href: "/admin/workflows" },
      { label: "Decisions", href: "/admin/decisions" },
      { label: "Launch checklist", href: "/admin/checklist" },
      { label: "CLAUDE.md", href: "/admin/claude-md" },
      { label: "Invocations", href: "/admin/invocations" },
      { label: "Monthly memo", href: "/admin/memo" },
    ],
  },
  {
    heading: "Account",
    tabs: [{ label: "Settings", href: "/admin/settings" }],
  },
];

const flatTabs = tabGroups.flatMap((g) => g.tabs);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="aurora-page min-h-screen flex flex-col md:flex-row">
      <AdminSidebar groups={tabGroups} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileNav tabs={flatTabs} />
        <main className="flex-1 px-6 md:px-10 py-10 md:py-12 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
