import Papa from "papaparse";
import { Work } from "../types";

// Stable ID from productUrl (djb2 hash → hex string)
function hashUrl(url: string): string {
  let h = 5381;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) + h) ^ url.charCodeAt(i);
    h = h >>> 0; // keep unsigned 32-bit
  }
  return h.toString(16).padStart(8, "0");
}

function detectSource(url: string): Work["source"] {
  if (/dmm\.co\.jp/i.test(url)) return "dmm";
  if (/dlsite\.com/i.test(url)) return "dlsite";
  return "other";
}

function parseActors(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[,、／/]/)
    .map((a) => a.trim())
    .filter(Boolean);
}

type RawRow = Record<string, string>;

// Flexible header → field mapping
const COLUMN_MAP: Record<string, string> = {
  title: "title",
  name: "title",
  work_title: "title",
  作品名: "title",
  タイトル: "title",

  circle: "circle",
  brand: "circle",
  circle_name: "circle",
  maker: "circle",
  サークル名: "circle",
  サークル: "circle",
  ブランド: "circle",

  actors: "actors",
  actor: "actors",
  cv: "actors",
  voice: "actors",
  creator: "actors",
  声優: "actors",
  キャスト: "actors",

  thumbnail_url: "thumbnailUrl",
  thumbnail: "thumbnailUrl",
  image_url: "thumbnailUrl",
  img_url: "thumbnailUrl",
  サムネイル: "thumbnailUrl",
  画像url: "thumbnailUrl",

  product_url: "productUrl",
  url: "productUrl",
  link: "productUrl",
  page_url: "productUrl",
  作品url: "productUrl",
  作品リンク: "productUrl",
};

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, "_");
}

export interface ParseCSVResult {
  works: Work[];
  errors: number;
}

export function parseCSV(csvContent: string): ParseCSVResult {
  const result = Papa.parse<RawRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return { works: [], errors: result.errors.length };
  }

  const headers = result.meta.fields ?? [];
  const keyMap = new Map<string, string>();
  for (const h of headers) {
    const mapped = COLUMN_MAP[normalizeKey(h)];
    if (mapped) keyMap.set(h, mapped);
  }

  let errors = 0;
  const works: Work[] = [];
  const now = new Date().toISOString();

  for (const row of result.data) {
    const partial: Partial<Record<string, unknown>> = {};

    for (const [rawKey, field] of keyMap) {
      const val = (row[rawKey] ?? "").trim();
      if (field === "actors") {
        partial.actors = parseActors(val);
      } else {
        partial[field] = val;
      }
    }

    const title = (partial.title as string | undefined) ?? "";
    const productUrl = (partial.productUrl as string | undefined) ?? "";

    if (!title || !productUrl) {
      errors++;
      continue;
    }

    works.push({
      id: hashUrl(productUrl),
      title,
      circle: (partial.circle as string | undefined) ?? "",
      actors: (partial.actors as string[] | undefined) ?? [],
      thumbnailUrl: (partial.thumbnailUrl as string | undefined) ?? "",
      productUrl,
      source: detectSource(productUrl),
      importedAt: now,
    });
  }

  return { works, errors: errors + result.errors.length };
}
