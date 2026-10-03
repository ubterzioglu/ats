import { Document, Page, Text, View } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import type { Resume } from "@/types/resume";

import { PDF_SANS } from "../fonts";
import { templateContent, type TemplateEntry } from "./content";
import type { ResumeTemplate } from "./types";

/**
 * Dense: the one-page workhorse. Small type, tight leading, uppercase
 * section headings under a hairline - maximum document per page. The layout
 * discipline is the same in every template: one column, stacked text runs,
 * no tables, no side-by-side runs the parser would read across, hyphen
 * bullets because a symbol font is a parser hazard and a hyphen is not.
 */

const INK = "#111111";
const MUTED = "#444444";

const PAGE_STYLE = {
  paddingVertical: 30,
  paddingHorizontal: 34,
  fontFamily: PDF_SANS,
  fontSize: 9,
  lineHeight: 1.3,
  color: INK
} as const;
const NAME_STYLE = { fontSize: 15, fontWeight: 700, marginBottom: 1 } as const;
const LABEL_STYLE = { fontSize: 9.5, marginBottom: 1 } as const;
const CONTACT_STYLE = { fontSize: 8.5, color: MUTED, marginBottom: 6 } as const;
const HEADING_STYLE = {
  fontSize: 9,
  fontWeight: 700,
  marginTop: 7,
  marginBottom: 3,
  paddingTop: 2,
  borderTopWidth: 0.5,
  borderTopColor: INK
} as const;
const HEADER_STYLE = { fontSize: 9.5, fontWeight: 700, marginBottom: 1 } as const;
const META_STYLE = { fontSize: 8.5, color: MUTED, marginBottom: 1 } as const;
const BODY_STYLE = { fontSize: 9, marginBottom: 1 } as const;
const BULLET_STYLE = { fontSize: 9, marginBottom: 1, paddingLeft: 9 } as const;
const ENTRY_STYLE = { marginBottom: 4 } as const;

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

export function denseDocument(resume: Resume): ReactElement {
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
      createElement(
        Text,
        { key: `heading-${sectionIndex}`, style: HEADING_STYLE },
        section.heading.toUpperCase()
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

export const denseTemplate: ResumeTemplate = {
  id: "dense",
  label: "Dense",
  document: denseDocument
};
