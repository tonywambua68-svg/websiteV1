/**
 * Product cleaning — strips HTML, marketing fluff and broken formatting while
 * PRESERVING technical specifications (never altered, only re-formatted).
 */

const MARKETING_NOISE = [
  /\b(best|top|hot|new)\s+(arrival|quality|seller|sale|price|deal)s?\b/gi,
  /\bfree\s+(shipping|delivery)\b[!]*\s*/gi,
  /\b(big\s+)?discount\b[!]*/gi,
  /\blimited\s+(time\s+)?offer\b/gi,
  /\bwholesale\s+(price|lot)\b/gi,
  /\bfactory\s+direct\b/gi,
  /\bhigh\s+quality\b/gi,
  /\bdrop\s?shipping\b/gi,
  /\bin\s+stock\s+now\b/gi,
  /\bbuy\s+now\b/gi,
  /\bsuper\s+sale\b/gi,
  /\bpromotion\b/gi,
  /\bdropshipping\b/gi,
];

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\u{2700}-\u{27BF}]/gu;

/** Strip HTML tags & decode the common entities. */
export function stripHtml(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/div|\/li|\/tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

/** Remove seller marketing text + emoji; collapse whitespace. */
export function cleanText(raw: string): string {
  let t = stripHtml(raw);
  t = t.replace(EMOJI_RE, "");
  for (const re of MARKETING_NOISE) t = t.replace(re, "");
  t = t.replace(/[!]{2,}/g, "!").replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

/** Clean a product name: title-case-ish tidy without changing meaning. */
export function cleanName(raw: string): string {
  let t = cleanText(raw);
  t = t.replace(/[|•·,;]+.*$/u, ""); // cut trailing keyword stuffing after separators
  t = t.replace(/\s{2,}/g, " ").trim();
  if (t.length > 90) t = `${t.slice(0, 87).trim()}…`;
  return t || raw.trim();
}

/** De-dupe spec keys (first occurrence wins) and normalise labels. */
export function cleanSpecs(specs: [string, string][]): [string, string][] {
  const seen = new Set<string>();
  const out: [string, string][] = [];
  for (const [k, v] of specs) {
    const key = k.trim().toLowerCase().replace(/\s+/g, " ");
    const val = stripHtml(String(v)).replace(/\s{2,}/g, " ").trim();
    if (!key || !val || seen.has(key)) continue;
    seen.add(key);
    out.push([key.replace(/\b\w/g, (c) => c.toUpperCase()), val]);
  }
  return out;
}

export interface CleanReport {
  name: string;
  description: string;
  specs: [string, string][];
  flags: string[];
}

export function cleanProduct(input: {
  name: string; description?: string; specs?: [string, string][];
}): CleanReport {
  const flags: string[] = [];
  const name = cleanName(input.name);
  if (name !== input.name.trim()) flags.push("Marketing text removed from title");

  const description = cleanText(input.description ?? "");
  if (!description) flags.push("No usable description — write one before publishing");

  const specs = cleanSpecs(input.specs ?? []);
  if ((input.specs?.length ?? 0) > specs.length) flags.push("Duplicate/empty spec rows removed");

  return { name, description, specs, flags };
}
