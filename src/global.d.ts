// Android JavascriptInterface の型定義（全ファイル共通）
declare global {
  interface Window {
    AppBridge?: {
      openUrl: (url: string) => void;
      saveCsvWithPicker?: (csvContent: string, suggestedName: string) => void;
      openCsvWithPicker?: () => void;
      startDmmScraper?: (existingTitlesJson?: string, keepAwake?: boolean, fullScanMode?: boolean) => void;
    };
  }
}

export {};
