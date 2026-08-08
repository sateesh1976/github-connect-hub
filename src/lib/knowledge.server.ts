const SHEET_ID = "1rRHn9K-tdnSqwWAB9pFfZ5qMfSQSUV5I3Cq2OGCSP6c";
const GID = "310942919";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { text: string; fetchedAt: number } | null = null;

/** Minimal RFC4180 CSV parser (handles quoted fields and embedded newlines). */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

function toKnowledgeText(rows: string[][]): string {
  const [header, ...body] = rows;
  if (!header) return "";
  const headers = header.map((h) => h.trim());


  return body
    .map((cells) =>
      headers
        .map((h, index) => {
          const value = (cells[index] ?? "").trim();
          if (!value) return "";
          return headers.length <= 2 && index === 0 ? `${value}:` : `${h}: ${value}`;
        })
        .filter(Boolean)
        .join(" "),
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

export async function getKnowledgeBase(): Promise<
  { ok: true; text: string } | { ok: false; error: string }
> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return { ok: true, text: cache.text };
  }

  try {
    const res = await fetch(CSV_URL, { headers: { Accept: "text/csv" } });
    if (!res.ok) {
      console.error("Knowledge base fetch failed", res.status);
      if (cache) return { ok: true, text: cache.text };
      return { ok: false, error: "The knowledge base is temporarily unavailable." };
    }

    const csv = await res.text();
    if (csv.trim().startsWith("<")) {
      if (cache) return { ok: true, text: cache.text };
      return { ok: false, error: "The knowledge base is not publicly readable." };
    }

    const text = toKnowledgeText(parseCsv(csv));
    if (!text) {
      if (cache) return { ok: true, text: cache.text };
      return { ok: false, error: "The knowledge base is empty." };
    }

    cache = { text, fetchedAt: now };
    return { ok: true, text };
  } catch (error) {
    console.error("Knowledge base error", error);
    if (cache) return { ok: true, text: cache.text };
    return { ok: false, error: "Could not reach the knowledge base." };
  }
}
