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

  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  const closeParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
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

    if (/^\s*>\s?/.test(line)) {
      closeAll();
      out.push(`<blockquote>${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
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
