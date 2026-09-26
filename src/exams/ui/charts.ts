// 成績單圖表（純 SVG 字串，供螢幕預覽與 html2canvas 截圖共用）
import { C } from "./theme";

// 雷達圖直接沿用 FIVE 的 radarSvg，確保所有成績單的雷達圖外觀一致
export { radarSvg } from "@/components/PrintPage";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 橫向堆疊長條圖（國小學力檢測「各單元答對率分析」：答對率＋答錯率，0~100%）
export function stackedBarSvg(rows: { name: string; a: number; b: number }[], opts: { width: number; labelWidth: number; legend: [string, string] }): string {
  const { width, labelWidth, legend } = opts;
  const barH = 18, gap = 10, top = 30, right = 16;
  const plotW = width - labelWidth - right;
  const height = top + rows.length * (barH + gap) + 4;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
  // 圖例
  const lx = labelWidth;
  s += `<rect x="${lx}" y="6" width="10" height="10" fill="${C.accent}"/>`;
  s += `<text x="${lx + 15}" y="11" font-family="'Noto Serif TC',serif" font-size="11" fill="${C.ink}" dominant-baseline="central">${esc(legend[0])}</text>`;
  s += `<rect x="${lx + 72}" y="6" width="10" height="10" fill="${C.ruleLight}" stroke="${C.rule}" stroke-width="0.7"/>`;
  s += `<text x="${lx + 87}" y="11" font-family="'Noto Serif TC',serif" font-size="11" fill="${C.ink}" dominant-baseline="central">${esc(legend[1])}</text>`;
  // 格線
  [0, 25, 50, 75, 100].forEach(v => {
    const x = labelWidth + (plotW * v) / 100;
    s += `<line x1="${x.toFixed(1)}" y1="${top - 4}" x2="${x.toFixed(1)}" y2="${height - 2}" stroke="${C.rule}" stroke-width="0.6" stroke-dasharray="3 3"/>`;
  });
  rows.forEach((r, i) => {
    const y = top + i * (barH + gap);
    const wa = (plotW * r.a) / 100, wb = (plotW * r.b) / 100;
    s += `<text x="${labelWidth - 8}" y="${y + barH / 2}" font-family="'Noto Serif TC',serif" font-size="12" fill="${C.ink}" text-anchor="end" dominant-baseline="central">${esc(r.name)}</text>`;
    s += `<rect x="${labelWidth}" y="${y}" width="${wa.toFixed(1)}" height="${barH}" fill="${C.accent}"/>`;
    s += `<rect x="${(labelWidth + wa).toFixed(1)}" y="${y}" width="${wb.toFixed(1)}" height="${barH}" fill="${C.ruleLight}"/>`;
  });
  return s + "</svg>";
}
