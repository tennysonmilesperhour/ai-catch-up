import { LaunchChecklist } from "@/components/admin/LaunchChecklist";

export const metadata = { title: "Launch Checklist" };

export default function LaunchChecklistPage() {
  return (
    <div>
      <header className="admin-header">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Launch Checklist
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl">
          Three phases from scaffold to launch. State is saved in your
          browser, so this checklist remembers where you left off on this
          device.
        </p>
      </header>
      <LaunchChecklist />
    </div>
  );
}
