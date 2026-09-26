// 首頁選單用的系統清單（不引用題庫資料，避免首頁載入過大）
export const EXAM_MENU = [
  { id: "junior-mock", no: "03", icon: "📝", title: "國中模考成績單", desc: ["國二・國三模擬考", "等級判定・知識點熟練度"] },
  { id: "elementary", no: "04", icon: "📈", title: "國小學力檢測成績單", desc: ["國小四～六年級", "五力指標・知識向度分析"] },
  { id: "elementary-basic", no: "05", icon: "🎯", title: "國小學科能力檢測成績單", desc: ["國語文・英語文・數學科", "能力雷達圖・綜合等級・排名"] },
] as const;

export function menuItem(id: string) {
  return EXAM_MENU.find(m => m.id === id)!;
}
