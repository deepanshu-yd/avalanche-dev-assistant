import * as cheerio from "cheerio";

/**
 * Best-effort HTML → plaintext/markdown-like converter.
 * Removes nav/footers/sidebars/scripts/styles and returns readable text with headings.
 * This is intentionally simple and fast for hackathon use.
 */
export function htmlToReadableMarkdown(html: string): string {
  const $ = cheerio.load(html);

  // Remove non-content elements
  $("nav, footer, header, script, style, aside, .sidebar, .toc, .table-of-contents").remove();

  // Normalize links to [text](href)
  $("a").each((_i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href") || "";
    if (href && text) {
      $(el).replaceWith(`[${text}](${href})`);
    } else {
      $(el).replaceWith(text);
    }
  });

  // Convert headings to markdown
  for (let i = 1; i <= 3; i++) {
    $(`h${i}`).each((_idx, el) => {
      const t = $(el).text().trim();
      $(el).replaceWith(`${"#".repeat(i)} ${t}\n\n`);
    });
  }

  // Paragraphs and list items
  $("li").each((_i, el) => {
    const t = $(el).text().trim();
    $(el).replaceWith(`- ${t}\n`);
  });
  $("p").each((_i, el) => {
    const t = $(el).text().trim();
    $(el).replaceWith(`${t}\n\n`);
  });

  const text = $("body").text();
  return collapseWhitespace(text);
}

export function collapseWhitespace(s: string): string {
  return s.replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
