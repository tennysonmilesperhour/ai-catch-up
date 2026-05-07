// Renders a JSON-LD <script type="application/ld+json"> tag. Escapes
// "</script>" defensively so embedded values can never break out of the
// inline script. React strips dangerouslySetInnerHTML through this exact
// path safely; we use it because JSON.stringify already produces valid
// JSON and we don't want React to wrap it in extra escaping.

type Props = { data: Record<string, unknown> | Record<string, unknown>[] };

export function JsonLd({ data }: Props) {
  const json = JSON.stringify(data).replace(/<\/(script)/gi, "<\\/$1");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
