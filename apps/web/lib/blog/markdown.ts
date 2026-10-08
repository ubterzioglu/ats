/**
 * Minimal markdown to HTML converter for blog posts.
 * Handles headings, paragraphs, lists, links, code blocks, bold, italic.
 * Does NOT allow raw HTML to prevent XSS.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text: string): string {
  let result = escapeHtml(text);
  
  // Bold: **text** or __text__
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  
  // Italic: *text* or _text_
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/_(.+?)_/g, "<em>$1</em>");
  
  // Code: `code`
  result = result.replace(/`(.+?)`/g, "<code>$1</code>");
  
  // Links: [text](url)
  result = result.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" rel="noopener">$1</a>');
  
  return result;
}

function parseTableRow(line: string): readonly string[] {
  const cells = line.split("|").slice(1, -1);
  return cells.map((c) => c.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)+\|$/.test(line.trim());
}

function renderTable(rows: readonly (readonly string[])[]): string {
  if (rows.length < 2) return "";
  const header = rows[0] ?? [];
  const body = rows.slice(2);
  const thCells = header.map((c) => `<th>${inlineMarkdown(c)}</th>`).join("");
  const bodyRows = body
    .map((row) => `<tr>${row.map((c) => `<td>${inlineMarkdown(c)}</td>`).join("")}</tr>`)
    .join("\n");
  return `<div class="overflow-x-auto my-6"><table><thead><tr>${thCells}</tr></thead><tbody>\n${bodyRows}\n</tbody></table></div>`;
}

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let listType: "ul" | "ol" = "ul";
  let paragraph: string[] = [];
  let tableRows: string[][] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (inList) {
      html.push(`</${listType}>`);
      inList = false;
    }
  }

  function flushTable() {
    if (tableRows.length > 0) {
      const rendered = renderTable(tableRows);
      if (rendered) html.push(rendered);
      tableRows = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        flushTable();
        html.push("<pre><code>");
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(lines[i]!));
      continue;
    }

    if (trimmed.length === 0) {
      flushParagraph();
      flushList();
      flushTable();
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushParagraph();
      flushList();
      if (isTableSeparator(trimmed)) {
        tableRows.push([]);
      } else {
        tableRows.push([...parseTableRow(trimmed)]);
      }
      continue;
    }

    flushTable();

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = (headingMatch[1] ?? "#").length;
      const text = inlineMarkdown(headingMatch[2] ?? "");
      html.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      flushParagraph();
      if (!inList || listType !== "ul") {
        flushList();
        html.push("<ul>");
        inList = true;
        listType = "ul";
      }
      const text = inlineMarkdown(trimmed.replace(/^[-*+]\s+/, ""));
      html.push(`<li>${text}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (!inList || listType !== "ol") {
        flushList();
        html.push("<ol>");
        inList = true;
        listType = "ol";
      }
      const text = inlineMarkdown(trimmed.replace(/^\d+\.\s+/, ""));
      html.push(`<li>${text}</li>`);
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push("<hr>");
      continue;
    }

    if (/^>\s*/.test(trimmed)) {
      flushParagraph();
      flushList();
      flushTable();
      const bqLines: string[] = [];
      while (i < lines.length && lines[i]!.trim().startsWith(">")) {
        bqLines.push(lines[i]!.trim().replace(/^>\s*/, ""));
        i++;
      }
      i--;
      const isNumberedList = bqLines.every((l) => /^\d+\.\s+/.test(l));
      if (isNumberedList) {
        const items = bqLines.map((l) => `<li>${inlineMarkdown(l.replace(/^\d+\.\s+/, ""))}</li>`).join("\n");
        html.push(`<blockquote><ol>${items}</ol></blockquote>`);
      } else {
        const content = bqLines.map((l) => `<p>${inlineMarkdown(l)}</p>`).join("\n");
        html.push(`<blockquote>${content}</blockquote>`);
      }
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  flushTable();
  if (inCodeBlock) {
    html.push("</code></pre>");
  }

  return html.join("\n");
}
