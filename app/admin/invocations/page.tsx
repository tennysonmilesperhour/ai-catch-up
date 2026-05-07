import { InvocationsTable } from "@/components/admin/InvocationsTable";

export const metadata = { title: "Invocations" };

export default function InvocationsPage() {
  return (
    <div className="max-w-5xl">
      <header className="admin-header">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)]">
          Invocations
        </h1>
        <p className="text-[var(--color-muted-dark)] mt-2 max-w-3xl leading-relaxed">
          Every prompt you've fired through the workspace, with token cost
          and the exact text sent. Stored in this browser only; clears
          when localStorage clears. Last 30 runs.
        </p>
      </header>
      <InvocationsTable />
    </div>
  );
}
