import indicatorDB from "@/data/indicators.json";
import descDB from "@/data/descriptions.json";
import { IndicatorDB, WEEKS, WEEK_ZH, Subject } from "@/lib/types";
import { StudentAnswers } from "@/lib/store";
import { calcAggregateScores } from "@/lib/scoring";

const db = indicatorDB as unknown as IndicatorDB;
const desc = descDB as Record<string, { indicators: string[]; descriptions: string[] }>;

/* ─── SVG 雷達圖（用於 PDF 截圖，無 canvas 依賴） ─── */
export function radarSvg(scores: { indicator: string; percent: number }[], size = 260): string {
  const cx = size / 2, cy = size / 2;
  const r  = size * 0.32;
  const n  = scores.length;
  if (n === 0) return `<svg width="${size}" height="${size}"></svg>`;
  const angles = scores.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
  const pt = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angles[i]),
    y: cy + r * ratio * Math.sin(angles[i]),
  });
  const poly = (ratio: number) =>
    scores.map((_, i) => pt(i, ratio))
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  const PAD = 90; // 左右留白，避免軸標籤（如「資料分析與不確定性理解力」等長標籤）被裁切
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${size + PAD * 2}" height="${size}" viewBox="${-PAD} 0 ${size + PAD * 2} ${size}">`;
  [0.25, 0.5, 0.75, 1].forEach(l =>
    (s += `<path d="${poly(l)}" fill="none" stroke="#cdc3ad" stroke-width="0.7"/>`));
  scores.forEach((_, i) => {
    const o = pt(i, 1);
    s += `<line x1="${cx}" y1="${cy}" x2="${o.x.toFixed(1)}" y2="${o.y.toFixed(1)}" stroke="#cdc3ad" stroke-width="0.7"/>`;
  });
  const dp = scores.map((sc, i) => pt(i, sc.percent / 100))
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  s += `<path d="${dp}" fill="rgba(176,64,44,0.15)" stroke="rgb(176,64,44)" stroke-width="1.5"/>`;
  scores.forEach((sc, i) => {
    const p = pt(i, sc.percent / 100);
    s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="rgb(176,64,44)"/>`;
  });
  scores.forEach((sc, i) => {
    const lx = cx + (r + 24) * Math.cos(angles[i]);
    const ly = cy + (r + 24) * Math.sin(angles[i]);
    const cos = Math.cos(angles[i]);
    const anchor = cos > 0.15 ? "start" : cos < -0.15 ? "end" : "middle";
    const len = sc.indicator.length;
    const fontSize = len <= 6 ? 10 : len <= 9 ? 9 : 8; // 長標籤縮小字級以減少裁切風險
    s += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-family="'Noto Serif TC',serif" font-size="${fontSize}" fill="#23201a" text-anchor="${anchor}" dominant-baseline="middle">${sc.indicator}</text>`;
  });
  [25, 50, 75, 100].forEach(v => {
    const p = pt(0, v / 100);
    s += `<text x="${(p.x + 3).toFixed(1)}" y="${p.y.toFixed(1)}" font-family="monospace" font-size="7" fill="#9a917c" text-anchor="start" dominant-baseline="middle">${v}</text>`;
  });
  return s + "</svg>";
}

/* ─── 隱藏列印頁（供 html2canvas 截圖）─── */
export function PrintPage({ branch, student, subject, school, answers, setRef }: {
  branch: string; student: string; subject: Subject;
  school: { zh: string; char: string };
  answers: StudentAnswers;
  setRef: (el: HTMLDivElement | null) => void;
}) {
  const weekIndicators = WEEKS.map(w => db[subject].weeks[w] ?? []);
  const weekAnswers    = WEEKS.map(w => answers[subject]?.[w] ?? null);
  const weekFilled     = weekAnswers.map(a => a !== null);
  const filled         = weekAnswers.filter(Boolean).length;
  const scores         = filled > 0 ? calcAggregateScores(weekIndicators, weekAnswers) : [];
  const totalCorrect   = weekAnswers.reduce<number>((a, ans) => a + (ans?.filter(Boolean).length ?? 0), 0);
  const totalQ         = weekAnswers.reduce<number>((a, ans) => a + (ans?.length ?? 0), 0);
  const pct            = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0;
  const subjDesc       = desc[subject];
  const svg            = radarSvg(scores, 260);

  const F = (s: string | number) => String(s); // helper

  return (
    <div ref={setRef} style={{ width: 794, height: 1123, background: "#f2ecdd", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Noto Serif TC', serif" }}>
      {/* 上方內容區 */}
      <div style={{ padding: "40px 48px 24px" }}>
        {/* 標頭 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <svg width="46" height="46" style={{ flexShrink: 0 }}>
              <rect x="0.75" y="0.75" width="44.5" height="44.5" fill="none" stroke="#b0402c" strokeWidth="1.5" />
              <text x="23" y="24" fontFamily="'Noto Serif TC',serif" fontSize="22" fontWeight="900" fill="#b0402c" textAnchor="middle" dominantBaseline="central">{school.char}</text>
            </svg>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".06em", color: "#9a917c", fontFamily: "monospace", marginBottom: 4 }}>{school.zh}　五力指標成績單</div>
              <div style={{ fontWeight: 700, fontSize: 24, color: "#23201a", letterSpacing: ".04em" }}>五力指標測驗成績單</div>
            </div>
          </div>
          <svg width="76" height="76" style={{ flexShrink: 0, opacity: 0.75 }}>
            <g transform="rotate(-13 38 38)">
              <rect x="7" y="7" width="62" height="62" fill="none" stroke="#b0402c" strokeWidth="2.5" />
              <text x="38" y="31" fontFamily="'Noto Serif TC',serif" fontSize="9" letterSpacing="1.2" fill="#b0402c" textAnchor="middle" dominantBaseline="central">{school.zh}</text>
              <text x="38" y="47" fontFamily="'Noto Serif TC',serif" fontSize="14" fontWeight="900" fill="#b0402c" textAnchor="middle" dominantBaseline="central">認定</text>
            </g>
          </svg>
        </div>
        <div style={{ borderTop: "2px solid #23201a", margin: "10px 0 3px" }} />
        <div style={{ borderTop: "1px solid #23201a", marginBottom: 16 }} />

        {/* 資訊條 */}
        <div style={{ display: "flex", border: "1px solid #cdc3ad", borderBottom: "1.5px solid #23201a", marginBottom: 22 }}>
          {[{ label: "學生姓名", value: student }, { label: "分校", value: branch }, { label: "課程", value: "六升七銜接課程" }].map((item, i) => (
            <div key={item.label} style={{ flex: 1, padding: "10px 14px", borderRight: i < 2 ? "1px solid #cdc3ad" : "none" }}>
              <div style={{ fontSize: 8, letterSpacing: ".18em", color: "#9a917c", marginBottom: 4, fontFamily: "monospace" }}>{item.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#23201a" }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* 科目標題 */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: "1px solid #cdc3ad", paddingBottom: 8, marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 20, color: "#23201a", letterSpacing: ".04em" }}>{subject}科</span>
          {filled > 0
            ? <><span style={{ fontSize: 10, color: "#9a917c", fontFamily: "monospace" }}>已施測 {F(filled)} 週・共 {F(totalCorrect)}/{F(totalQ)} 題答對</span>
                <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 700, fontFamily: "monospace", color: pct >= 80 ? "#23201a" : pct >= 60 ? "#6e685a" : "#b0402c" }}>{F(pct)}%</span></>
            : <span style={{ fontSize: 10, color: "#cdc3ad", fontFamily: "monospace" }}>尚未施測</span>
          }
        </div>
        <div style={{ display: "flex", gap: 7, marginBottom: 20 }}>
          {WEEK_ZH.map((zh, i) => {
            const active = weekFilled[i];
            return (
              <div key={i} style={{ padding: "3px 10px", border: `1.5px solid ${active ? "#b0402c" : "#cdc3ad"}`, background: active ? "#b0402c" : "transparent" }}>
                <span style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? "#f2ecdd" : "#cdc3ad" }}>第{zh}週</span>
              </div>
            );
          })}
        </div>

        {/* 雷達 + 得分表 */}
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 0 }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 8, letterSpacing: ".16em", color: "#9a917c", marginBottom: 6, fontFamily: "monospace" }}>能力雷達圖</div>
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, letterSpacing: ".16em", color: "#9a917c", marginBottom: 6, fontFamily: "monospace" }}>五力指標彙整得分</div>
            {filled === 0
              ? <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#cdc3ad", fontFamily: "monospace" }}>— 無資料 —</div>
              : <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ borderBottom: "1.5px solid #23201a" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c", fontWeight: 400 }}>能力指標</th>
                    <th style={{ textAlign: "center", padding: "6px 6px", fontFamily: "monospace", fontSize: 9, color: "#9a917c", fontWeight: 400 }}>答對</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c", fontWeight: 400 }}>得分率</th>
                  </tr></thead>
                  <tbody>{scores.map(s => (
                    <tr key={s.indicator} style={{ borderBottom: "1px solid #e4dfd2" }}>
                      <td style={{ padding: "9px 8px", fontSize: 13, color: "#23201a" }}>{s.indicator}</td>
                      <td style={{ textAlign: "center", padding: "9px 6px", fontFamily: "monospace", fontSize: 12, color: "#6e685a" }}>{s.correct}/{s.total}</td>
                      <td style={{ textAlign: "right", padding: "9px 8px", fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: s.percent >= 50 ? "#23201a" : "#b0402c" }}>{s.percent}%</td>
                    </tr>
                  ))}</tbody>
                </table>
            }
          </div>
        </div>
      </div>

      {/* 五力說明：flex-grow 撐滿剩餘版面 */}
      <div style={{ flex: 1, background: "#f0eadb", borderTop: "1px solid #e4dfd2", padding: "18px 48px 36px" }}>
        <div style={{ fontSize: 8, letterSpacing: ".22em", color: "#9a917c", marginBottom: 16, fontFamily: "monospace" }}>五力指標說明</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
          {subjDesc.indicators.map((name, i) => (
            <div key={name} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <svg width="20" height="20" style={{ flexShrink: 0, marginTop: 2 }}>
                <rect x="0.75" y="0.75" width="18.5" height="18.5" fill="none" stroke="#b0402c" strokeWidth="1.5" />
                <text x="10" y="10.5" fontFamily="monospace" fontSize="10" fontWeight="600" fill="#b0402c" textAnchor="middle" dominantBaseline="central">{i + 1}</text>
              </svg>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#23201a", lineHeight: 1.4, marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 12, color: "#6e685a", lineHeight: 1.7 }}>{subjDesc.descriptions[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
