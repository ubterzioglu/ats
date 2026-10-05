import type { JsonLdNode } from "@/lib/seo";

interface JsonLdProps {
  readonly data: JsonLdNode | readonly JsonLdNode[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
