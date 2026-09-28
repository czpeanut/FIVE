// 牛皮紙風格色票（與 FIVE 相同，集中給整合模組使用）
export const C = {
  pageBg: "#ddd3bd",
  paper: "#f2ecdd",
  paperAlt: "#f0eadb",
  paperLight: "#f7f2e6",
  ink: "#23201a",
  inkSoft: "#6e685a",
  muted: "#9a917c",
  rule: "#cdc3ad",
  ruleLight: "#e4dfd2",
  accent: "#b0402c",
};

export const SERIF = "'Noto Serif TC', serif";
export const MONO = "'JetBrains Mono', monospace";

export const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

// 分校登入記憶：每套系統各自記住，不與 FIVE（selectedBranch_v1）或其他系統共用，
// 避免在某一套系統選過分校後，其他系統一進去就跳過分校清單
export const branchKey = (moduleId: string) => `examBranch_v1_${moduleId}`;
