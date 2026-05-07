import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// Tabs the buyer (non-admin authed user) sees. Coding guide intentionally
// excluded, it's a one-time read linked from /setup intro and outputs +
// available via ⌘K, doesn't need a sidebar slot.
const BUYER_TAB_GROUPS = [
  {
    heading: "Workspace",
    tabs: [
      { label: "Pulse", href: "/admin/pulse" },
      { label: "Prompts", href: "/admin/prompts" },
      { label: "Roster", href: "/admin/roster" },
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

// Tabs Tennyson (admin role) sees. Includes everything the buyer sees
// plus the vendor-side surfaces (Plan, Schedule, Nexus map, Workflows,
// Decisions, Launch checklist) for product management.
const ADMIN_TAB_GROUPS = [
  {
    heading: "Workspace",
    tabs: [
      { label: "Overview", href: "/admin" },
      { label: "Pulse", href: "/admin/pulse" },
      { label: "Plan", href: "/admin/plan" },
      { label: "Schedule", href: "/admin/schedule" },
      { label: "Nexus map", href: "/admin/nexus" },
      { label: "Prompts", href: "/admin/prompts" },
      { label: "Roster", href: "/admin/roster" },
      { label: "Workflows", href: "/admin/workflows" },
      { label: "Decisions", href: "/admin/decisions" },
      { label: "Launch checklist", href: "/admin/checklist" },
      { label: "CLAUDE.md", href: "/admin/claude-md" },
      { label: "Coding guide", href: "/admin/coding-guide" },
      { label: "Invocations", href: "/admin/invocations" },
      { label: "Monthly memo", href: "/admin/memo" },
    ],
  },
  {
    heading: "Account",
    tabs: [{ label: "Settings", href: "/admin/settings" }],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees a session exists by the time we reach here, so
  // the role read can't be null in practice, but we treat absence as a
  // buyer for safety.
  const c = await cookies();
  const session = await verifySession(c.get(SESSION_COOKIE)?.value);
  const isAdmin = session?.role === "admin";

  const tabGroups = isAdmin ? ADMIN_TAB_GROUPS : BUYER_TAB_GROUPS;
  const flatTabs = tabGroups.flatMap((g) => g.tabs);

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
