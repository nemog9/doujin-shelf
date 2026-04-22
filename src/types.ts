export interface Work {
  id: string;          // auto-generated: hash of productUrl
  productId?: string;
  title: string;
  circle: string;
  actors: string[];    // 声優（複数可）
  thumbnailUrl: string;
  productUrl: string;
  source: "dmm" | "dlsite" | "other"; // URL から自動判定
  importedAt: string;
}

export interface ImportResult {
  added: number;
  duplicates: number;
  errors: number;
  total: number;
  filename: string;
}

export type SortField = "importedAt" | "title" | "circle";
export type LinkOpenMode = "external" | "inApp";
