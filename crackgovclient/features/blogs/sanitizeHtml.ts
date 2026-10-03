const allowedTags = new Set(["a", "article", "b", "blockquote", "br", "caption", "code", "dd", "div", "dl", "dt", "em", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "pre", "small", "span", "strong", "sub", "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul"]);
const voidTags = new Set(["br", "hr", "img"]);
const allowedAttributes = new Set(["alt", "aria-label", "class", "colspan", "height", "href", "loading", "rel", "rowspan", "src", "target", "title", "width"]);

function safeUrl(value: string, attribute: string): boolean {
  const normalized = value
    .replace(/&#(?:x([0-9a-f]+)|(\d+));?/gi, (_, hex: string | undefined, decimal: string | undefined) => String.fromCharCode(parseInt(hex ?? decimal ?? "0", hex ? 16 : 10)))
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n")
    .replace(/[\u0000-\u0020]+/g, "")
    .toLowerCase();
  if (/^(javascript|vbscript|data):/.test(normalized)) return false;
  if (/^(https?:|mailto:|tel:)/.test(normalized)) return true;
  return normalized.startsWith("/") || (attribute === "href" && (normalized.startsWith("#") || normalized.startsWith("?")));
}

/** Keep common article markup while removing scripts, embeds, event handlers and unsafe URLs. */
export function sanitizeBlogHtml(html: string): string {
  const withoutDangerousBlocks = html
    .replace(/<(script|style|iframe|object|embed|form|svg|math|video|audio|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|svg|math|video|audio|template)\b[^>]*\/?>/gi, "");
  return withoutDangerousBlocks.replace(/<\/?([a-z][a-z0-9:-]*)\b([^>]*)>/gi, (match, rawTag: string, rawAttributes: string) => {
    const tag = rawTag.toLowerCase();
    if (!allowedTags.has(tag)) return "";
    const closing = /^<\s*\//.test(match);
    if (closing) return voidTags.has(tag) ? "" : `</${tag}>`;
    let attributes = "";
    rawAttributes.replace(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g, (_whole, rawName: string, doubleValue: string | undefined, singleValue: string | undefined, bareValue: string | undefined) => {
      const name = rawName.toLowerCase();
      const value = doubleValue ?? singleValue ?? bareValue ?? "";
      if (!allowedAttributes.has(name) || name.startsWith("on")) return "";
      if ((name === "href" || name === "src") && !safeUrl(value, name)) return "";
      const escaped = value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      attributes += ` ${name}="${escaped}"`;
      return "";
    });
    if (tag === "a" && /\starget="_blank"/i.test(attributes) && !/\srel=/i.test(attributes)) attributes += ' rel="noopener noreferrer"';
    return `<${tag}${attributes}${voidTags.has(tag) ? " />" : ""}>`;
  });
}
