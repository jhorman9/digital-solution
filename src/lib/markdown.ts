function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderInline(value: string) {
  let html = escapeHtml(value);
  html = html.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  html = html.replace(
    /\[([^\]]+)\]\(((?:https?:\/\/|mailto:)[^\s)\"]+)\)/g,
    (_match, label: string, href: string) =>
      `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${label}</a>`,
  );
  html = html
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  html = html
    .replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+)_/g, "<em>$1</em>");
  return html;
}

export function renderMarkdown(source: string | null | undefined) {
  const lines = String(source || "")
    .replaceAll("\r\n", "\n")
    .split("\n");
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let ordered = false;
  let inCode = false;
  let codeLines: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p>${paragraph.map(renderInline).join("<br />")}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const tag = ordered ? "ol" : "ul";
      blocks.push(
        `<${tag}>${list.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${tag}>`,
      );
      list = [];
      ordered = false;
    }
  };
  const flushCode = () => {
    if (codeLines.length) {
      blocks.push(
        `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      codeLines = [];
    }
  };
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      flushParagraph();
      flushList();
      if (inCode) flushCode();
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        `<h${heading[1].length}>${renderInline(heading[2])}</h${heading[1].length}>`,
      );
      continue;
    }
    const item =
      line.match(/^\s*[-*+]\s+(.+)$/) || line.match(/^\s*\d+\.\s+(.+)$/);
    if (item) {
      flushParagraph();
      const nextOrdered = /^\s*\d+\./.test(line);
      if (list.length && ordered !== nextOrdered) flushList();
      ordered = nextOrdered;
      list.push(item[1]);
      continue;
    }
    if (/^>\s?/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push(
        `<blockquote>${renderInline(line.replace(/^>\s?/, ""))}</blockquote>`,
      );
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  if (inCode) flushCode();
  flushParagraph();
  flushList();
  return (
    blocks.join("") || '<p class="markdown-empty">Sin contenido todavía.</p>'
  );
}
