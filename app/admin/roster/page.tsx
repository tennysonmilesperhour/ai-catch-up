import { RosterSelector } from "@/components/admin/RosterSelector";

export const metadata = { title: "Roster" };

export default function RosterPage() {
  return (
    <div>
      <header className="admin-header">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)] mb-3">
          Roster &middot; 12 slots
        </p>
        <h1 className="font-display text-3xl md:text-5xl text-[var(--color-dark)] mb-2 leading-[1.05]">
          Pick your{" "}
          <span className="italic headline-gradient">starting roster.</span>
        </h1>
        <p className="text-[var(--color-muted-dark)] max-w-2xl mt-3 leading-relaxed">
          Twelve categories, one tool per slot. Choose a default, sign up,
          integrate it. Each card glows once it&apos;s live so you can see
          the shape of your stack at a glance.
        </p>
      </header>
      <RosterSelector />
    </div>
  );
}
