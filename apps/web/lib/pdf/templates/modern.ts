import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import type { Resume } from "@/types/resume";

import { PDF_SANS } from "../fonts";
import { templateContent, type TemplateEntry } from "./content";
import type { ResumeTemplate } from "./types";

/**
 * Modern: typographic hierarchy instead of ornament. A large name over a
 * full-width rule, uppercase section headings on their own hairline, italic
 * grey meta lines, and middle dots separating the contact block. All the
 * character is carried by size, weight and spacing - the text layer stays one
 * column of plain runs, because the closed loop grades the layer, not the
 * look.
 */

const INK = "#111111";
const MUTED = "#555555";
const HAIRLINE = "#888888";

const PAGE_STYLE = {
  paddingVertical: 44,
  paddingHorizontal: 46,
  fontFamily: PDF_SANS,
  fontSize: 10,
  lineHeight: 1.35,
  color: INK
} as const;
const NAME_STYLE = { fontSize: 20, fontWeight: 700, marginBottom: 2 } as const;
const LABEL_STYLE = { fontSize: 11, color: MUTED, marginBottom: 3 } as const;
const CONTACT_STYLE = { fontSize: 9, color: MUTED, marginBottom: 6 } as const;
const HEADER_RULE_STYLE = {
  borderBottomWidth: 1.2,
  borderBottomColor: INK,
  marginBottom: 10
} as const;
const HEADING_STYLE = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  marginTop: 12,
  marginBottom: 5,
  paddingBottom: 2,
  borderBottomWidth: 0.6,
  borderBottomColor: HAIRLINE
} as const;
const HEADER_STYLE = { fontSize: 10.5, fontWeight: 700, marginBottom: 1 } as const;
const META_STYLE = { fontSize: 9.5, fontStyle: "italic" as const, color: MUTED, marginBottom: 2 } as const;
const BODY_STYLE = { fontSize: 10, marginBottom: 2 } as const;
const BULLET_STYLE = { fontSize: 10, marginBottom: 2, paddingLeft: 11 } as const;
const ENTRY_STYLE = { marginBottom: 7 } as const;

function entryBlock(entry: TemplateEntry, index: number): ReactElement {
  const children: ReactElement[] = [];
  if (entry.header !== undefined && entry.header !== "") {
    children.push(createElement(Text, { key: "header", style: HEADER_STYLE }, entry.header));
  }
  if (entry.meta !== undefined && entry.meta !== "") {
    children.push(createElement(Text, { key: "meta", style: META_STYLE }, entry.meta));
  }
  if (entry.body !== undefined && entry.body !== "") {
    children.push(createElement(Text, { key: "body", style: BODY_STYLE }, entry.body));
  }
  (entry.lines ?? []).forEach((line, lineIndex) => {
    children.push(createElement(Text, { key: `line-${lineIndex}`, style: BODY_STYLE }, line));
  });
  (entry.bullets ?? []).forEach((bullet, bulletIndex) => {
    children.push(
      createElement(Text, { key: `bullet-${bulletIndex}`, style: BULLET_STYLE }, `- ${bullet}`)
    );
  });
  return createElement(View, { key: `entry-${index}`, style: ENTRY_STYLE }, ...children);
}

export function modernDocument(resume: Resume): ReactElement {
  const content = templateContent(resume);

  const blocks: ReactElement[] = [];
  const hasHeader =
    content.name !== "" || content.label !== "" || content.contact.length > 0;

  if (content.name !== "") {
    blocks.push(createElement(Text, { key: "name", style: NAME_STYLE }, content.name));
  }
  if (content.label !== "") {
    blocks.push(createElement(Text, { key: "label", style: LABEL_STYLE }, content.label));
  }
  if (content.contact.length > 0) {
    blocks.push(
      createElement(Text, { key: "contact", style: CONTACT_STYLE }, content.contact.join("  ·  "))
    );
  }
  if (hasHeader) {
    blocks.push(createElement(View, { key: "rule", style: HEADER_RULE_STYLE }));
  }

  content.sections.forEach((section, sectionIndex) => {
    blocks.push(
      createElement(
        Text,
        { key: `heading-${sectionIndex}`, style: HEADING_STYLE },
        section.heading
      )
    );
    section.entries.forEach((entry, entryIndex) => {
      blocks.push(entryBlock(entry, sectionIndex * 100 + entryIndex));
    });
  });

  return createElement(
    Document,
    null,
    createElement(Page, { size: "A4", style: PAGE_STYLE }, ...blocks)
  );
}

export const modernTemplate: ResumeTemplate = {
  id: "modern",
  label: "Modern",
  document: modernDocument
};
