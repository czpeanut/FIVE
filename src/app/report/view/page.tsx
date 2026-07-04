"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import indicatorDB from "@/data/indicators.json";
import descDB from "@/data/descriptions.json";
import { IndicatorDB, SUBJECTS, WEEKS, WEEK_ZH, Subject } from "@/lib/types";
import { getAnswers } from "@/lib/store";
import { calcAggregateScores } from "@/lib/scoring";
import { getSchoolInfo } from "@/lib/branches";
import RadarChart from "@/components/RadarChart";

const db = indicatorDB as unknown as IndicatorDB;
const desc = descDB as Record<string, { indicators: string[]; descriptions: string[] }>;
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

/* ─── SVG 雷達圖（用於列印，無 canvas 依賴） ─── */
function radarSvg(
  scores: { indicator: string; percent: number }[],
  size = 220
): string {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.32;
  const n = scores.length;
  if (n === 0) return `<svg width="${size}" height="${size}"></svg>`;
  const angles = scores.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);
  const pt = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angles[i]),
    y: cy + r * ratio * Math.sin(angles[i]),
  });
  const poly = (ratio: number) =>
    scores.map((_, i) => pt(i, ratio)).map((p, i) =>
      `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
  // grid
  [0.25, 0.5, 0.75, 1].forEach(l => {
    s += `<path d="${poly(l)}" fill="none" stroke="#cdc3ad" stroke-width="0.7"/>`;
  });
  // axes
  scores.forEach((_, i) => {
    const o = pt(i, 1);
    s += `<line x1="${cx}" y1="${cy}" x2="${o.x.toFixed(1)}" y2="${o.y.toFixed(1)}" stroke="#cdc3ad" stroke-width="0.7"/>`;
  });
  // data
  const dataPath = scores.map((sc, i) => pt(i, sc.percent / 100))
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  s += `<path d="${dataPath}" fill="rgba(176,64,44,0.15)" stroke="rgb(176,64,44)" stroke-width="1.5"/>`;
  scores.forEach((sc, i) => {
    const p = pt(i, sc.percent / 100);
    s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="rgb(176,64,44)"/>`;
  });
  // labels
  scores.forEach((sc, i) => {
    const lx = cx + (r + 22) * Math.cos(angles[i]);
    const ly = cy + (r + 22) * Math.sin(angles[i]);
    const cos = Math.cos(angles[i]);
    const anchor = cos > 0.15 ? "start" : cos < -0.15 ? "end" : "middle";
    s += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-family="'Noto Serif TC',serif" font-size="9" fill="#23201a" text-anchor="${anchor}" dominant-baseline="middle">${sc.indicator}</text>`;
  });
  // tick labels
  [25, 50, 75, 100].forEach(v => {
    const p = pt(0, v / 100);
    s += `<text x="${(p.x + 3).toFixed(1)}" y="${p.y.toFixed(1)}" font-family="monospace" font-size="6" fill="#9a917c" text-anchor="start" dominant-baseline="middle">${v}</text>`;
  });
  s += "</svg>";
  return s;
}

/* ─── 產生列印視窗 HTML ─── */
function buildPrintHtml(branch: string, student: string): string {
  const school = getSchoolInfo(branch);
  const filledWeeks = WEEKS.map(w =>
    SUBJECTS.some(s => getAnswers(branch, student, s, w) !== null)
  );
  const filledCount = filledWeeks.filter(Boolean).length;

  const weekBadgesHtml = WEEKS.map((_, i) => {
    const active = filledWeeks[i];
    return `<div style="padding:3px 10px;border:1.5px solid ${active ? "#b0402c" : "#cdc3ad"};background:${active ? "#b0402c" : "transparent"};display:flex;flex-direction:column;align-items:center;gap:2px;">
      <span style="font-size:6px;letter-spacing:.14em;color:${active ? "#f2ecdd" : "#cdc3ad"};font-family:monospace">W${i + 1}</span>
      <span style="font-size:11px;font-weight:${active ? 700 : 400};color:${active ? "#f2ecdd" : "#cdc3ad"};font-family:serif">第${WEEK_ZH[i]}週</span>
    </div>`;
  }).join("");

  const header = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">
      <div style="display:flex;align-items:flex-start;gap:16px;">
        <div style="width:46px;height:46px;border:1.5px solid #b0402c;display:flex;align-items:center;justify-content:center;color:#b0402c;flex-shrink:0;">
          <span style="font-family:serif;font-weight:900;font-size:22px;">${school.char}</span>
        </div>
        <div>
          <div style="font-size:9px;letter-spacing:.28em;color:#9a917c;font-family:monospace;">${school.en} · 五力指標成績單</div>
          <div style="font-family:serif;font-weight:700;font-size:24px;color:#23201a;margin-top:4px;letter-spacing:.04em;">五力指標測驗成績單</div>
        </div>
      </div>
      <div style="width:62px;height:62px;border:2.5px solid #b0402c;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#b0402c;opacity:.72;transform:rotate(-13deg);flex-shrink:0;">
        <span style="font-family:serif;font-size:8px;letter-spacing:.18em;">${school.zh}</span>
        <span style="font-family:serif;font-size:14px;font-weight:900;">認定</span>
        <span style="font-family:monospace;font-size:6px;">CERTIFIED</span>
      </div>
    </div>
    <div style="border-top:2px solid #23201a;margin:10px 0 3px;"></div>
    <div style="border-top:1px solid #23201a;margin-bottom:16px;"></div>
    <div style="display:flex;border-top:1px solid #cdc3ad;border-bottom:1.5px solid #23201a;margin-bottom:22px;">
      <div style="flex:1.2;padding:10px 14px;border-right:1px solid #cdc3ad;">
        <div style="font-size:7px;letter-spacing:.18em;color:#9a917c;margin-bottom:4px;font-family:monospace;">學生姓名</div>
        <div style="font-family:serif;font-size:16px;font-weight:600;color:#23201a;">${student}</div>
      </div>
      <div style="flex:1;padding:10px 14px;border-right:1px solid #cdc3ad;">
        <div style="font-size:7px;letter-spacing:.18em;color:#9a917c;margin-bottom:4px;font-family:monospace;">分校</div>
        <div style="font-family:serif;font-size:15px;font-weight:600;color:#23201a;">${branch}</div>
      </div>
      <div style="flex:1;padding:10px 14px;border-right:1px solid #cdc3ad;">
        <div style="font-size:7px;letter-spacing:.18em;color:#9a917c;margin-bottom:4px;font-family:monospace;">課程</div>
        <div style="font-family:serif;font-size:15px;font-weight:600;color:#23201a;">六升七銜接課程</div>
      </div>
      <div style="flex:2.4;padding:10px 14px;">
        <div style="font-size:7px;letter-spacing:.18em;color:#9a917c;margin-bottom:7px;font-family:monospace;">施測週次（${filledCount}/5 週）</div>
        <div style="display:flex;gap:7px;">${weekBadgesHtml}</div>
      </div>
    </div>`;

  const pages = SUBJECTS.map((subj) => {
    const weekIndicators = WEEKS.map(w => db[subj].weeks[w] ?? []);
    const weekAnswers    = WEEKS.map(w => getAnswers(branch, student, subj, w));
    const filled         = weekAnswers.filter(Boolean).length;
    const scores         = filled > 0 ? calcAggregateScores(weekIndicators, weekAnswers) : [];
    const totalCorrect   = weekAnswers.reduce<number>((a, ans) => a + (ans?.filter(Boolean).length ?? 0), 0);
    const totalQ         = weekAnswers.reduce<number>((a, ans) => a + (ans?.length ?? 0), 0);
    const pct            = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0;
    const subjDesc       = desc[subj];
    const svg            = radarSvg(scores, 260);

    const scoreRows = scores.map(s =>
      `<tr>
        <td style="padding:9px 8px;font-family:serif;font-size:13px;color:#23201a;">${s.indicator}</td>
        <td style="text-align:center;padding:9px 6px;font-family:monospace;font-size:12px;color:#6e685a;">${s.correct}/${s.total}</td>
        <td style="text-align:right;padding:9px 8px;font-family:monospace;font-size:14px;font-weight:700;color:${s.percent >= 50 ? "#23201a" : "#b0402c"};">${s.percent}%</td>
      </tr>`
    ).join("");

    const descBoxes = subjDesc.indicators.map((name, i) =>
      `<div style="display:flex;gap:10px;align-items:flex-start;">
        <div style="flex-shrink:0;width:20px;height:20px;border:1.5px solid #b0402c;display:flex;align-items:center;justify-content:center;margin-top:2px;">
          <span style="font-family:monospace;font-size:10px;color:#b0402c;font-weight:600;">${i + 1}</span>
        </div>
        <div>
          <div style="font-family:serif;font-size:13px;font-weight:700;color:#23201a;line-height:1.4;">${name}</div>
          <div style="font-size:12px;color:#6e685a;line-height:1.7;margin-top:3px;">${subjDesc.descriptions[i]}</div>
        </div>
      </div>`
    ).join("");

    return `
    <div class="page" style="background:#f2ecdd;display:flex;flex-direction:column;">
      <div style="padding:14mm 16mm 10mm;">
        ${header}

        <!-- 科目標題 -->
        <div style="display:flex;align-items:baseline;gap:12px;border-bottom:1px solid #cdc3ad;padding-bottom:8px;margin-bottom:18px;">
          <span style="font-family:serif;font-weight:700;font-size:20px;color:#23201a;letter-spacing:.04em;">${subj}科</span>
          ${filled > 0
            ? `<span style="font-family:monospace;font-size:10px;letter-spacing:.12em;color:#9a917c;">已施測 ${filled} 週・共 ${totalCorrect}/${totalQ} 題答對</span>
               <span style="margin-left:auto;font-family:monospace;font-size:15px;font-weight:700;color:${pct >= 80 ? "#23201a" : pct >= 60 ? "#6e685a" : "#b0402c"};">${pct}%</span>`
            : `<span style="font-family:monospace;font-size:10px;color:#cdc3ad;">尚未施測</span>`
          }
        </div>

        <!-- 雷達 + 得分表 -->
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <div style="flex-shrink:0;">
            <div style="font-family:monospace;font-size:8px;letter-spacing:.16em;color:#9a917c;margin-bottom:6px;">能力雷達圖</div>
            ${svg}
          </div>
          <div style="flex:1;">
            <div style="font-family:monospace;font-size:8px;letter-spacing:.16em;color:#9a917c;margin-bottom:6px;">五力指標彙整得分</div>
            ${filled === 0
              ? `<div style="height:120px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:11px;color:#cdc3ad;">— 無資料 —</div>`
              : `<table style="width:100%;border-collapse:collapse;">
                  <thead>
                    <tr style="border-bottom:1.5px solid #23201a;">
                      <th style="text-align:left;padding:6px 8px;font-family:monospace;font-size:9px;letter-spacing:.1em;color:#9a917c;font-weight:400;">能力指標</th>
                      <th style="text-align:center;padding:6px 6px;font-family:monospace;font-size:9px;color:#9a917c;font-weight:400;">答對</th>
                      <th style="text-align:right;padding:6px 8px;font-family:monospace;font-size:9px;color:#9a917c;font-weight:400;">得分率</th>
                    </tr>
                  </thead>
                  <tbody>${scoreRows}</tbody>
                </table>`
            }
          </div>
        </div>
      </div>

      <!-- 五力說明：flex-grow 撐滿剩餘版面 -->
      <div style="flex:1;background:#f0eadb;border-top:1px solid #e4dfd2;padding:16px 16mm 14mm;">
        <div style="font-family:monospace;font-size:8px;letter-spacing:.22em;color:#9a917c;margin-bottom:14px;">五力指標說明</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px 30px;">
          ${descBoxes}
        </div>
      </div>
    </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<title>${student}　五力指標成績單</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #ddd3bd; font-family: 'Noto Serif TC', serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4; margin: 0; }
  .page { page-break-after: always; break-after: page; min-height: 297mm; box-sizing: border-box; }
  .page:last-child { page-break-after: auto; break-after: auto; }
  @media print {
    body { background: #f2ecdd; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
  tr { border-bottom: 1px solid #e4dfd2; }
</style>
</head>
<body>${pages}</body>
</html>`;
}

/* ─── 螢幕預覽：單科區塊 ─── */
function SubjectBlock({ branch, student, subject }: {
  branch: string; student: string; subject: Subject;
}) {
  const weekIndicators = WEEKS.map(w => db[subject].weeks[w] ?? []);
  const weekAnswers    = WEEKS.map(w => getAnswers(branch, student, subject, w));
  const filled         = weekAnswers.filter(Boolean).length;
  const scores         = filled > 0 ? calcAggregateScores(weekIndicators, weekAnswers) : [];
  const totalCorrect   = weekAnswers.reduce<number>((a, ans) => a + (ans?.filter(Boolean).length ?? 0), 0);
  const totalQ         = weekAnswers.reduce<number>((a, ans) => a + (ans?.length ?? 0), 0);
  const pct            = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0;
  const subjDesc       = desc[subject];

  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: "1px solid #cdc3ad", paddingBottom: 6, marginBottom: 12 }}>
        <span className="serif" style={{ fontWeight: 700, fontSize: 15, color: "#23201a" }}>{subject}科</span>
        {filled > 0
          ? <><span className="mono" style={{ fontSize: 9, color: "#9a917c" }}>已施測 {filled} 週・共 {totalCorrect}/{totalQ} 題答對</span>
              <span className="mono" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: pct >= 80 ? "#23201a" : pct >= 60 ? "#6e685a" : "#b0402c" }}>{pct}%</span></>
          : <span className="mono" style={{ fontSize: 9, color: "#cdc3ad" }}>尚未施測</span>
        }
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 16, marginBottom: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 7, letterSpacing: ".16em", color: "#9a917c", marginBottom: 5 }}>能力雷達圖</div>
          <RadarChart scores={scores} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: 7, letterSpacing: ".16em", color: "#9a917c", marginBottom: 5 }}>五力指標彙整得分</div>
          {filled === 0 ? (
            <div style={{ display: "flex", alignItems: "center", height: 120, justifyContent: "center" }}>
              <span className="mono" style={{ fontSize: 10, color: "#cdc3ad" }}>— 無資料 —</span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid #23201a" }}>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9a917c", fontWeight: 400 }}>能力指標</th>
                  <th style={{ textAlign: "center", padding: "4px 4px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9a917c", fontWeight: 400 }}>答對</th>
                  <th style={{ textAlign: "right", padding: "4px 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9a917c", fontWeight: 400 }}>得分率</th>
                </tr>
              </thead>
              <tbody>
                {scores.map(s => (
                  <tr key={s.indicator} style={{ borderBottom: "1px solid #e4dfd2" }}>
                    <td style={{ padding: "7px 6px", fontFamily: "'Noto Serif TC',serif", fontSize: 12, color: "#23201a" }}>{s.indicator}</td>
                    <td style={{ textAlign: "center", padding: "7px 4px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6e685a" }}>{s.correct}/{s.total}</td>
                    <td style={{ textAlign: "right", padding: "7px 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: s.percent >= 50 ? "#6e685a" : "#b0402c" }}>{s.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div style={{ background: "#f7f2e6", border: "1px solid #e4dfd2", padding: "10px 14px" }}>
        <div className="mono" style={{ fontSize: 7, letterSpacing: ".22em", color: "#9a917c", marginBottom: 7 }}>五力指標說明</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 18px" }}>
          {subjDesc.indicators.map((name, i) => (
            <div key={name} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 15, height: 15, border: "1px solid #b0402c", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                <span className="mono" style={{ fontSize: 7, color: "#b0402c" }}>{i + 1}</span>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 10, fontWeight: 700, color: "#23201a", lineHeight: 1.3 }}>{name}</div>
                <div style={{ fontSize: 9, color: "#6e685a", lineHeight: 1.5, marginTop: 1 }}>{subjDesc.descriptions[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ViewReport() {
  const params  = useSearchParams();
  const branch  = params.get("branch")  || "";
  const student = params.get("student") || "";
  const school = getSchoolInfo(branch);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const filledWeeks = mounted
    ? WEEKS.map(w => SUBJECTS.some(s => getAnswers(branch, student, s, w) !== null))
    : Array(5).fill(false);
  const filledCount = filledWeeks.filter(Boolean).length;

  function openPrint() {
    const html = buildPrintHtml(branch, student);
    const win = window.open("", "_blank");
    if (!win) { alert("請允許彈出視窗"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Wait for fonts to load then print
    setTimeout(() => win.print(), 1200);
  }

  return (
    <div style={{ background: "#ddd3bd", minHeight: "100vh", padding: "32px 20px 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "840px" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
          <Link href={`/report?branch=${encodeURIComponent(branch)}`}
            style={{ padding: "7px 16px", border: "1.5px solid #23201a", background: "transparent", fontSize: 12, color: "#23201a", textDecoration: "none", fontFamily: "'Noto Serif TC',serif", fontWeight: 600, letterSpacing: ".04em" }}>
            ← 返回名冊
          </Link>
          <span className="mono" style={{ fontSize: 11, color: "#6e685a", letterSpacing: ".08em" }}>{student}　{branch}</span>
          <button onClick={openPrint} className="serif"
            style={{ marginLeft: "auto", padding: "7px 24px", border: "1.5px solid #23201a", background: "#23201a", fontSize: 12, fontWeight: 600, color: "#f2ecdd", cursor: "pointer", letterSpacing: ".06em" }}>
            列印 / 下載 PDF
          </button>
        </div>

        {/* Screen preview card */}
        {mounted ? (
          <div style={{ position: "relative", background: "#f2ecdd", border: "1.5px solid #23201a", boxShadow: "0 30px 70px -30px rgba(35,32,26,.5)" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN }} />
            <div style={{ position: "relative", padding: "28px 40px 36px" }}>
              {/* Masthead */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 40, height: 40, border: "1.5px solid #b0402c", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0402c" }}>
                    <span className="serif" style={{ fontWeight: 900, fontSize: 18 }}>{school.char}</span>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".28em", color: "#9a917c" }}>{school.en} · 五力指標成績單</div>
                    <div className="serif" style={{ fontWeight: 700, fontSize: 21, color: "#23201a", marginTop: 3, letterSpacing: ".04em" }}>五力指標測驗成績單</div>
                  </div>
                </div>
                <div style={{ width: 58, height: 58, border: "2.5px solid #b0402c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#b0402c", opacity: 0.72, transform: "rotate(-13deg)", flexShrink: 0 }}>
                  <span className="serif" style={{ fontSize: 7, letterSpacing: ".18em" }}>{school.zh}</span>
                  <span className="serif" style={{ fontSize: 13, fontWeight: 900 }}>認定</span>
                  <span className="mono" style={{ fontSize: 6 }}>CERTIFIED</span>
                </div>
              </div>
              <div style={{ borderTop: "2px solid #23201a", margin: "10px 0 3px" }} />
              <div style={{ borderTop: "1px solid #23201a", marginBottom: 18 }} />
              {/* Info strip */}
              <div style={{ display: "flex", borderTop: "1px solid #cdc3ad", borderBottom: "1.5px solid #23201a", marginBottom: 22, flexWrap: "wrap" }}>
                {[{ label: "學生姓名", value: student }, { label: "分校", value: branch }, { label: "課程", value: "六升七銜接課程" }].map((item, i) => (
                  <div key={item.label} style={{ flex: i === 0 ? 1.2 : 1, padding: "8px 12px", borderRight: "1px solid #cdc3ad" }}>
                    <div className="mono" style={{ fontSize: 7, letterSpacing: ".18em", color: "#9a917c", marginBottom: 3 }}>{item.label}</div>
                    <div className="serif" style={{ fontSize: 13, fontWeight: 600, color: "#23201a" }}>{item.value}</div>
                  </div>
                ))}
                <div style={{ flex: 2.4, padding: "8px 12px" }}>
                  <div className="mono" style={{ fontSize: 7, letterSpacing: ".18em", color: "#9a917c", marginBottom: 5 }}>
                    施測週次<span style={{ marginLeft: 8, color: filledCount === 5 ? "#b0402c" : "#9a917c" }}>（{filledCount}/5 週）</span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {WEEK_ZH.map((zh, i) => {
                      const active = filledWeeks[i];
                      return (
                        <div key={i} style={{ padding: "3px 10px", border: `1.5px solid ${active ? "#b0402c" : "#cdc3ad"}`, background: active ? "#b0402c" : "transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <span className="mono" style={{ fontSize: 6, letterSpacing: ".14em", color: active ? "#f2ecdd" : "#cdc3ad" }}>W{i + 1}</span>
                          <span className="serif" style={{ fontSize: 11, fontWeight: active ? 700 : 400, color: active ? "#f2ecdd" : "#cdc3ad" }}>第{zh}週</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* Subjects */}
              {SUBJECTS.map(s => <SubjectBlock key={s} branch={branch} student={student} subject={s} />)}
            </div>
          </div>
        ) : (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".2em", color: "#9a917c" }}>載入中…</span>
          </div>
        )}

        {mounted && (
          <div className="mono" style={{ textAlign: "center", marginTop: 24, fontSize: 10, letterSpacing: ".2em", color: "#9a917c" }}>
            {school.en} · {branch}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ViewPage() {
  return <Suspense><ViewReport /></Suspense>;
}
