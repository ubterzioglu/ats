import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

import type { Resume, ResumeProjectItem, ResumeWorkItem } from "@/types/resume";

import { renderContactParts, renderDateRange, renderLocation } from "./presentation";

/**
 * The canonical resume as a DOCX, written for the two readers that matter:
 * a recruiter's Word and a parsing engine. That means one column, no tables,
 * no text boxes, no headers or footers, real heading styles, plain bullet
 * lists and text that is text - the same discipline the PDF templates get.
 *
 * The document contains only what the resume contains: a section without
 * entries is not rendered, an absent field leaves no placeholder, and an
 * empty string renders as the open-ended role it declares. Nothing is
 * invented on the way out.
 */

const DEFAULT_FONT = "Calibri";

function contactLine(resume: Resume): string {
  return renderContactParts(resume).join(" | ");
}

function heading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 220, after: 80 } });
}

function body(text: string, options: { readonly italic?: boolean } = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: options.italic === true })],
    spacing: { after: 60 }
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 40 } });
}

function entryHeader(primary: string, secondary?: string): Paragraph {
  const children = [new TextRun({ text: primary, bold: true })];
  if (secondary !== undefined && secondary !== "") {
    children.push(new TextRun({ text: `, ${secondary}` }));
  }
  return new Paragraph({ children, spacing: { before: 100, after: 20 } });
}

function workSection(items: readonly ResumeWorkItem[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const item of items) {
    const primary = [item.position, item.name].filter(Boolean)[0] ?? "";
    const secondary = primary === item.position ? item.name : "";
    if (primary !== "") paragraphs.push(entryHeader(primary, secondary));
    const range = renderDateRange(item.startDate, item.endDate);
    if (range !== null) paragraphs.push(body(range, { italic: true }));
    if (item.summary !== undefined && item.summary !== "") paragraphs.push(body(item.summary));
    for (const highlight of item.highlights ?? []) paragraphs.push(bullet(highlight));
  }
  return paragraphs;
}

function projectSection(items: readonly ResumeProjectItem[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const item of items) {
    if (item.name !== undefined && item.name !== "") paragraphs.push(entryHeader(item.name));
    const range = renderDateRange(item.startDate, item.endDate);
    const meta = [range, item.entity, item.type].filter(Boolean).join(" - ");
    if (meta !== "") paragraphs.push(body(meta, { italic: true }));
    if (item.description !== undefined && item.description !== "") {
      paragraphs.push(body(item.description));
    }
    for (const highlight of item.highlights ?? []) paragraphs.push(bullet(highlight));
    const roles = (item.roles ?? []).filter(Boolean);
    if (roles.length > 0) paragraphs.push(body(`Roles: ${roles.join(", ")}`));
    const keywords = (item.keywords ?? []).filter(Boolean);
    if (keywords.length > 0) paragraphs.push(body(keywords.join(", ")));
  }
  return paragraphs;
}

function educationSection(resume: Resume): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  for (const item of resume.education ?? []) {
    const title = [item.studyType, item.area].filter(Boolean).join(", ");
    if (title !== "") paragraphs.push(entryHeader(title, item.institution));
    else if (item.institution !== undefined && item.institution !== "") {
      paragraphs.push(entryHeader(item.institution));
    }
    const range = renderDateRange(item.startDate, item.endDate);
    if (range !== null) paragraphs.push(body(range, { italic: true }));
    if (item.score !== undefined && item.score !== "") paragraphs.push(body(`Score: ${item.score}`));
    for (const course of item.courses ?? []) paragraphs.push(bullet(course));
  }
  return paragraphs;
}

/** Builds the document children: a section appears only when it has content. */
export function resumeParagraphs(resume: Resume): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const basics = resume.basics;

  if (basics?.name !== undefined && basics.name !== "") {
    paragraphs.push(new Paragraph({ text: basics.name, heading: HeadingLevel.TITLE }));
  }
  if (basics?.label !== undefined && basics.label !== "") paragraphs.push(body(basics.label));
  const contact = contactLine(resume);
  if (contact !== "") paragraphs.push(body(contact));
  if (basics?.summary !== undefined && basics.summary !== "") {
    paragraphs.push(heading("Summary"));
    paragraphs.push(body(basics.summary));
  }

  if ((resume.work ?? []).length > 0) {
    paragraphs.push(heading("Experience"));
    paragraphs.push(...workSection(resume.work ?? []));
  }
  if ((resume.projects ?? []).length > 0) {
    paragraphs.push(heading("Projects"));
    paragraphs.push(...projectSection(resume.projects ?? []));
  }
  if ((resume.education ?? []).length > 0) {
    paragraphs.push(heading("Education"));
    paragraphs.push(...educationSection(resume));
  }
  if ((resume.skills ?? []).length > 0) {
    paragraphs.push(heading("Skills"));
    for (const skill of resume.skills ?? []) {
      const keywords = (skill.keywords ?? []).filter(Boolean).join(", ");
      const level = skill.level !== undefined && skill.level !== "" ? ` (${skill.level})` : "";
      const line = [`${skill.name ?? ""}${level}`, keywords].filter(Boolean).join(": ");
      if (line !== "") paragraphs.push(body(line));
    }
  }
  if ((resume.languages ?? []).length > 0) {
    paragraphs.push(heading("Languages"));
    for (const language of resume.languages ?? []) {
      const line = [language.language, language.fluency].filter(Boolean).join(" - ");
      if (line !== "") paragraphs.push(body(line));
    }
  }
  if ((resume.awards ?? []).length > 0) {
    paragraphs.push(heading("Awards"));
    for (const award of resume.awards ?? []) {
      const meta = [award.awarder, award.date].filter(Boolean).join(", ");
      if (award.title !== undefined && award.title !== "") paragraphs.push(entryHeader(award.title));
      if (meta !== "") paragraphs.push(body(meta, { italic: true }));
      if (award.summary !== undefined && award.summary !== "") paragraphs.push(body(award.summary));
    }
  }
  if ((resume.publications ?? []).length > 0) {
    paragraphs.push(heading("Publications"));
    for (const publication of resume.publications ?? []) {
      const meta = [publication.publisher, publication.releaseDate].filter(Boolean).join(", ");
      if (publication.name !== undefined && publication.name !== "") {
        paragraphs.push(entryHeader(publication.name));
      }
      if (meta !== "") paragraphs.push(body(meta, { italic: true }));
      if (publication.summary !== undefined && publication.summary !== "") {
        paragraphs.push(body(publication.summary));
      }
    }
  }
  if ((resume.volunteer ?? []).length > 0) {
    paragraphs.push(heading("Volunteer"));
    for (const item of resume.volunteer ?? []) {
      const primary = [item.position, item.organization].filter(Boolean)[0] ?? "";
      const secondary = primary === item.position ? item.organization : "";
      if (primary !== "") paragraphs.push(entryHeader(primary, secondary));
      const range = renderDateRange(item.startDate, item.endDate);
      if (range !== null) paragraphs.push(body(range, { italic: true }));
      if (item.summary !== undefined && item.summary !== "") paragraphs.push(body(item.summary));
      for (const highlight of item.highlights ?? []) paragraphs.push(bullet(highlight));
    }
  }
  if ((resume.interests ?? []).length > 0) {
    paragraphs.push(heading("Interests"));
    for (const interest of resume.interests ?? []) {
      const keywords = (interest.keywords ?? []).filter(Boolean).join(", ");
      const line = [interest.name, keywords].filter(Boolean).join(": ");
      if (line !== "") paragraphs.push(body(line));
    }
  }
  if ((resume.references ?? []).length > 0) {
    paragraphs.push(heading("References"));
    for (const reference of resume.references ?? []) {
      const line = [reference.name, reference.reference].filter(Boolean).join(" - ");
      if (line !== "") paragraphs.push(body(line));
    }
  }

  return paragraphs;
}

function resumeDocument(resume: Resume): Document {
  return new Document({
    styles: {
      default: {
        document: { run: { font: DEFAULT_FONT, size: 22 } }
      }
    },
    sections: [{ properties: {}, children: resumeParagraphs(resume) }]
  });
}

/** The download form for the browser button: Packer.toBlob works in both worlds. */
export async function renderResumeDocxBlob(resume: Resume): Promise<Blob> {
  return Packer.toBlob(resumeDocument(resume));
}

/** Bytes for tests and any node-side caller. */
export async function renderResumeDocx(resume: Resume): Promise<Uint8Array> {
  const blob = await renderResumeDocxBlob(resume);
  return new Uint8Array(await blob.arrayBuffer());
}
