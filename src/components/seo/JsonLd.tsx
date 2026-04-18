/**
 * JsonLd — server component that renders a <script type="application/ld+json">
 * tag with the given payload.
 *
 * Escapes "<" in the stringified JSON to prevent </script>-injection should
 * user-supplied data ever flow through (e.g. a bio containing "<script>").
 *
 * Must remain a server component (no 'use client') so the JSON-LD ships in
 * the prerendered HTML — Google's crawler / Rich Results Test reads it there.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
