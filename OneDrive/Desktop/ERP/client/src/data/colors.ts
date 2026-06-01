/** Common product colors for wall clocks, watches, trimmers, etc. */
export const PRODUCT_COLOR_OPTIONS = [
  "Black",
  "Brown",
  "White",
  "Gold",
  "Silver",
  "Blue",
  "Red",
  "Green",
  "Rose Gold",
  "Ivory",
  "Grey",
  "Yellow",
  "Orange",
  "Multicolor"
] as const;

/** Build select options, keeping any existing value and server-managed palette. */
export function colorSelectOptions(existing?: string, fromServer: readonly string[] = []): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (c: string) => {
    const t = c.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  if (existing) {
    existing.split(/[|/,]/).forEach((part) => add(part.replace(/\s+/g, " ")));
  }
  for (const c of fromServer) add(c);
  for (const c of PRODUCT_COLOR_OPTIONS) add(c);
  return out;
}
