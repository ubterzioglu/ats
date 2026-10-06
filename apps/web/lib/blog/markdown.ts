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

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const html: string[] = [];
  let inCodeBlock = false;
  let inList = false;
  let listType: "ul" | "ol" = "ul";
  let paragraph: string[] = [];

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

  for (const line of lines) {
    const trimmed = line.trim();

    // Code block
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        html.push("</code></pre>");
        inCodeBlock = false;
      } else {
        flushParagraph();
        flushList();
        html.push("<pre><code>");
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html.push(escapeHtml(line));
      continue;
    }

    // Empty line
    if (trimmed.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = (headingMatch[1] ?? "#").length;
      const text = inlineMarkdown(headingMatch[2] ?? "");
      html.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    // Unordered list
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

    // Ordered list
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

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      html.push("<hr>");
      continue;
    }

    // Paragraph text
    flushList();
    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  if (inCodeBlock) {
    html.push("</code></pre>");
  }

  return html.join("\n");
}
