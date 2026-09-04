/**
 * A small markdown renderer, for the build documents.
 *
 * Deliberately not a library. The build guides are written by us in a known
 * subset of markdown, they are read by thirteen year olds on school
 * Chromebooks, and the output has to be a self-contained page with no request
 * to a CDN. A dependency would buy features nothing here uses and cost the one
 * property that matters, which is that the page always renders.
 *
 * It escapes everything before it emits anything, so a stray angle bracket in a
 * student's own sentence cannot become markup.
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Inline formatting, applied after escaping. */
function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=[\s).,!?]|$)/g, "$1<em>$2</em>")
    // Images before links: `![alt](src)` starts with a `[` and would otherwise
    // be read as a link with a stray bang in front of it.
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/** A `- [ ]` or `- [x]` line becomes a checkbox students can actually tick. */
function listItem(text: string): string {
  const task = text.match(/^\[([ xX])\]\s+(.*)$/);
  if (!task) return `<li>${inline(text)}</li>`;
  const checked = task[1].toLowerCase() === "x" ? " checked" : "";
  return `<li class="task"><label><input type="checkbox"${checked} /> <span>${inline(task[2])}</span></label></li>`;
}

function tableRow(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paragraph: string[] = [];
  let inCode = false;
  let code: string[] = [];
  let inTable = false;
  let quote: string[] = [];

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const closeParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ");
    paragraph = [];
    // A paragraph holding nothing but an image becomes a figure, and its alt
    // text becomes the caption. One piece of writing doing both jobs is the
    // point: a diagram nobody can describe in a sentence is a diagram that is
    // not explaining anything.
    const lone = text.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
    if (lone) {
      out.push(
        `<figure><img src="${escapeHtml(lone[2])}" alt="${escapeHtml(lone[1])}" loading="lazy" />` +
          (lone[1] ? `<figcaption>${inline(lone[1])}</figcaption>` : "") +
          `</figure>`,
      );
      return;
    }
    out.push(`<p>${inline(text)}</p>`);
  };
  const closeQuote = () => {
    if (quote.length === 0) return;
    out.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`);
    quote = [];
  };
  const closeTable = () => {
    if (inTable) {
      out.push("</tbody></table></div>");
      inTable = false;
    }
  };
  const closeAll = () => {
    closeParagraph();
    closeList();
    closeQuote();
    closeTable();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (/^```/.test(line.trim())) {
      if (inCode) {
        out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        closeAll();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    if (line.trim() === "") {
      closeAll();
      continue;
    }

    // A quote ends at the first line that is not quoted, whatever kind of line
    // that turns out to be. Checked once here rather than in each branch below,
    // because the branch somebody forgets is the one that breaks it.
    if (quote.length > 0 && !/^\s*>\s?/.test(line)) closeQuote();

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeAll();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      closeAll();
      out.push("<hr />");
      continue;
    }

    // Tables: a header row followed by a separator row of dashes.
    if (/^\s*\|/.test(line) && /^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? "")) {
      closeParagraph();
      closeList();
      const headers = tableRow(line.trim());
      out.push(
        `<div class="table-scroll"><table><thead><tr>${headers
          .map((h) => `<th>${inline(h)}</th>`)
          .join("")}</tr></thead><tbody>`,
      );
      inTable = true;
      i += 1;
      continue;
    }
    if (inTable) {
      if (/^\s*\|/.test(line)) {
        out.push(`<tr>${tableRow(line.trim()).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`);
        continue;
      }
      closeTable();
    }

    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    if (bullet) {
      closeParagraph();
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(listItem(bullet[1]));
      continue;
    }

    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (numbered) {
      closeParagraph();
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inline(numbered[1])}</li>`);
      continue;
    }

    // Consecutive quoted lines are one quote. Emitting one blockquote per line
    // turned a wrapped four line aside into four stacked boxes, which read as
    // four separate remarks rather than one paragraph.
    if (/^\s*>\s?/.test(line)) {
      closeParagraph();
      closeList();
      closeTable();
      quote.push(line.replace(/^\s*>\s?/, ""));
      continue;
    }

    // An indented line under a list item belongs to that item.
    //
    // Every one of these documents wraps at eighty columns, so a long bullet is
    // two or three lines. Without this the second line escapes the list and
    // renders as a paragraph hanging underneath it, which is exactly as wrong
    // as it looks.
    const last = out[out.length - 1];
    if (listType && /^\s+\S/.test(line) && last?.endsWith("</li>")) {
      out.pop();
      const text = ` ${inline(line.trim())}`;
      // A task item's text lives inside a label and a span, so the
      // continuation has to go in there with it rather than after the box.
      out.push(
        last.endsWith("</span></label></li>")
          ? last.replace(/<\/span><\/label><\/li>$/, `${text}</span></label></li>`)
          : last.replace(/<\/li>$/, `${text}</li>`),
      );
      continue;
    }

    // A continuation line joins the paragraph, matching how these files wrap.
    closeList();
    paragraph.push(line.trim());
  }

  if (inCode && code.length > 0) out.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  closeAll();
  return out.join("\n");
}
