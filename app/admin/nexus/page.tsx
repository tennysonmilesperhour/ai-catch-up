import { Nexus } from "@/components/admin/Nexus";
import { domains, links, nodes } from "@/components/admin/nexus-data";

export const metadata = { title: "Nexus" };

export default function NexusPage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-[var(--color-dark)] mb-2">
          Nexus
        </h1>
        <p className="text-[var(--color-muted-dark)]">
          A living map of the onboarding. Drag a node, hover to see neighbors,
          click for detail.
        </p>
      </header>
      <Nexus domains={domains} nodes={nodes} links={links} />
    </div>
  );
}
