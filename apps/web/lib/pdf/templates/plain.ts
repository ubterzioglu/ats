import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import type { Resume } from "@/types/resume";

import { PDF_SANS } from "../fonts";
import { templateContent, type TemplateEntry } from "./content";
import type { ResumeTemplate } from "./types";

/**
 * Plain: the quiet document. Eleven point type, sentence-case headings, air
 * between the entries and no ornament at all - no rules, no caps, no colour
 * beyond one grey for dates. For committees that read text, not design.
 * The layout discipline is identical to every template: one column, stacked
 * text runs, hyphen bullets.
 */

const INK = "#111111";
const MUTED = "#555555";

const PAGE_STYLE = {
  paddingVertical: 48,
  paddingHorizontal: 52,
  fontFamily: PDF_SANS,
  fontSize: 11,
  lineHeight: 1.4,
  color: INK
} as const;
const NAME_STYLE = { fontSize: 17, fontWeight: 700, marginBottom: 2 } as const;
const LABEL_STYLE = { fontSize: 11.5, marginBottom: 2 } as const;
const CONTACT_STYLE = { fontSize: 10, color: MUTED, marginBottom: 10 } as const;
const HEADING_STYLE = { fontSize: 12, fontWeight: 700, marginTop: 14, marginBottom: 5 } as const;
const HEADER_STYLE = { fontSize: 11, fontWeight: 700, marginBottom: 1 } as const;
const META_STYLE = { fontSize: 10, color: MUTED, marginBottom: 2 } as const;
const BODY_STYLE = { fontSize: 11, marginBottom: 2 } as const;
const BULLET_STYLE = { fontSize: 11, marginBottom: 2, paddingLeft: 12 } as const;
const ENTRY_STYLE = { marginBottom: 8 } as const;

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

export function plainDocument(resume: Resume): ReactElement {
  const content = templateContent(resume);

  const blocks: ReactElement[] = [];
  if (content.name !== "") {
    blocks.push(createElement(Text, { key: "name", style: NAME_STYLE }, content.name));
  }
  if (content.label !== "") {
    blocks.push(createElement(Text, { key: "label", style: LABEL_STYLE }, content.label));
  }
  if (content.contact.length > 0) {
    blocks.push(
      createElement(Text, { key: "contact", style: CONTACT_STYLE }, content.contact.join(", "))
    );
  }

  content.sections.forEach((section, sectionIndex) => {
    blocks.push(
      createElement(Text, { key: `heading-${sectionIndex}`, style: HEADING_STYLE }, section.heading)
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

export const plainTemplate: ResumeTemplate = {
  id: "plain",
  label: "Plain",
  document: plainDocument
};
