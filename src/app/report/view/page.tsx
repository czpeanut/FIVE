"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import indicatorDB from "@/data/indicators.json";
import descDB from "@/data/descriptions.json";
import { IndicatorDB, SUBJECTS, WEEKS, WEEK_ZH, Subject } from "@/lib/types";
import { getStudentAnswers, StudentAnswers, emptyStudentAnswers } from "@/lib/store";
import { calcAggregateScores } from "@/lib/scoring";
import { getSchoolInfo } from "@/lib/branches";
import RadarChart from "@/components/RadarChart";
import { PrintPage } from "@/components/PrintPage";

const db = indicatorDB as unknown as IndicatorDB;
const desc = descDB as Record<string, { indicators: string[]; descriptions: string[] }>;
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

/* ─── 螢幕預覽：單科區塊（使用 Chart.js 雷達圖） ─── */
function SubjectBlock({ subject, answers }: {
  subject: Subject; answers: StudentAnswers;
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

  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: "1px solid #cdc3ad", paddingBottom: 6, marginBottom: 10 }}>
        <span className="serif" style={{ fontWeight: 700, fontSize: 15, color: "#23201a" }}>{subject}科</span>
        {filled > 0
          ? <><span className="mono" style={{ fontSize: 9, color: "#9a917c" }}>已施測 {filled} 週・共 {totalCorrect}/{totalQ} 題答對</span>
              <span className="mono" style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: pct >= 80 ? "#23201a" : pct >= 60 ? "#6e685a" : "#b0402c" }}>{pct}%</span></>
          : <span className="mono" style={{ fontSize: 9, color: "#cdc3ad" }}>尚未施測</span>
        }
      </div>
      <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
        {WEEK_ZH.map((zh, i) => {
          const active = weekFilled[i];
          return (
            <div key={i} style={{ padding: "2px 8px", border: `1px solid ${active ? "#b0402c" : "#cdc3ad"}`, background: active ? "#b0402c" : "transparent" }}>
              <span className="mono" style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: active ? "#f2ecdd" : "#cdc3ad" }}>第{zh}週</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 16, marginBottom: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 7, letterSpacing: ".16em", color: "#9a917c", marginBottom: 5 }}>能力雷達圖</div>
          <RadarChart scores={scores} />
        </div>
        <div>
          <div className="mono" style={{ fontSize: 7, letterSpacing: ".16em", color: "#9a917c", marginBottom: 5 }}>五力指標彙整得分</div>
          {filled === 0
            ? <div style={{ display: "flex", alignItems: "center", height: 120, justifyContent: "center" }}><span className="mono" style={{ fontSize: 10, color: "#cdc3ad" }}>— 無資料 —</span></div>
            : <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: "1.5px solid #23201a" }}>
                  <th style={{ textAlign: "left", padding: "4px 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9a917c", fontWeight: 400 }}>能力指標</th>
                  <th style={{ textAlign: "center", padding: "4px 4px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9a917c", fontWeight: 400 }}>答對</th>
                  <th style={{ textAlign: "right", padding: "4px 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: "#9a917c", fontWeight: 400 }}>得分率</th>
                </tr></thead>
                <tbody>{scores.map(s => (
                  <tr key={s.indicator} style={{ borderBottom: "1px solid #e4dfd2" }}>
                    <td style={{ padding: "7px 6px", fontFamily: "'Noto Serif TC',serif", fontSize: 12, color: "#23201a" }}>{s.indicator}</td>
                    <td style={{ textAlign: "center", padding: "7px 4px", fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#6e685a" }}>{s.correct}/{s.total}</td>
                    <td style={{ textAlign: "right", padding: "7px 6px", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: s.percent >= 50 ? "#6e685a" : "#b0402c" }}>{s.percent}%</td>
                  </tr>
                ))}</tbody>
              </table>
          }
        </div>
      </div>
      <div style={{ background: "#f7f2e6", border: "1px solid #e4dfd2", padding: "10px 14px" }}>
        <div className="mono" style={{ fontSize: 7, letterSpacing: ".22em", color: "#9a917c", marginBottom: 7 }}>五力指標說明</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 18px" }}>
          {subjDesc.indicators.map((name, i) => (
            <div key={name} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 15, height: 15, border: "1px solid #b0402c", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                <span className="mono" style={{ fontSize: 7, color: "#b0402c", lineHeight: 1 }}>{i + 1}</span>
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

/* ─── 主頁面 ─── */
function ViewReport() {
  const params  = useSearchParams();
  const branch  = params.get("branch")  || "";
  const student = params.get("student") || "";
  const school  = getSchoolInfo(branch);

  const [mounted,   setMounted]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [answers,   setAnswers]   = useState<StudentAnswers>(emptyStudentAnswers());
  const printRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    let cancelled = false;
    getStudentAnswers(branch, student).then(a => { if (!cancelled) { setAnswers(a); setMounted(true); } });
    return () => { cancelled = true; };
  }, [branch, student]);

  async function downloadPdf() {
    setExporting(true);
    try {
      await document.fonts.ready;
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF }   = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw  = pdf.internal.pageSize.getWidth();
      const ph  = pdf.internal.pageSize.getHeight();
      let first = true;

      for (let i = 0; i < SUBJECTS.length; i++) {
        const el = printRefs.current[i];
        if (!el) continue;
        const canvas = await html2canvas(el, {
          scale: 2, useCORS: true, backgroundColor: "#f2ecdd", logging: false,
        });
        // 每科固定一頁 A4，直接填滿頁面（794×1123 比例即 A4，不分段以免浮點誤差多出空白頁）
        if (!first) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pw, ph);
        first = false;
      }
      pdf.save(`${student}_五力指標成績單.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ background: "#ddd3bd", minHeight: "100vh", padding: "32px 20px 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "840px" }}>

        {/* 工具列 */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
          <a href="/report"
            style={{ padding: "7px 16px", border: "1.5px solid #23201a", background: "transparent", fontSize: 12, color: "#23201a", textDecoration: "none", fontFamily: "'Noto Serif TC',serif", fontWeight: 600, letterSpacing: ".04em" }}>
            ← 返回名冊
          </a>
          <span className="mono" style={{ fontSize: 11, color: "#6e685a", letterSpacing: ".08em" }}>{student}　{branch}</span>
          <button onClick={downloadPdf} disabled={exporting || !mounted} className="serif"
            style={{ marginLeft: "auto", padding: "7px 24px", border: "1.5px solid #23201a", background: "#23201a", fontSize: 12, fontWeight: 600, color: "#f2ecdd", cursor: exporting ? "wait" : "pointer", letterSpacing: ".06em", opacity: exporting ? 0.6 : 1 }}>
            {exporting ? "產生中…" : "下載 PDF"}
          </button>
        </div>

        {/* 螢幕預覽卡片 */}
        {mounted ? (
          <div style={{ position: "relative", background: "#f2ecdd", border: "1.5px solid #23201a", boxShadow: "0 30px 70px -30px rgba(35,32,26,.5)" }}>
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN }} />
            <div style={{ position: "relative", padding: "28px 40px 36px" }}>
              {/* 標頭 */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 40, height: 40, border: "1.5px solid #b0402c", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0402c" }}>
                    <span className="serif" style={{ fontWeight: 900, fontSize: 18, lineHeight: 1 }}>{school.char}</span>
                  </div>
                  <div>
                    <div className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#9a917c" }}>{school.zh}　五力指標成績單</div>
                    <div className="serif" style={{ fontWeight: 700, fontSize: 21, color: "#23201a", marginTop: 3, letterSpacing: ".04em" }}>五力指標測驗成績單</div>
                  </div>
                </div>
                <div style={{ width: 58, height: 58, border: "2.5px solid #b0402c", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#b0402c", opacity: 0.72, transform: "rotate(-13deg)", flexShrink: 0 }}>
                  <span className="serif" style={{ fontSize: 9, letterSpacing: ".14em" }}>{school.zh}</span>
                  <span className="serif" style={{ fontSize: 13, fontWeight: 900 }}>認定</span>
                </div>
              </div>
              <div style={{ borderTop: "2px solid #23201a", margin: "10px 0 3px" }} />
              <div style={{ borderTop: "1px solid #23201a", marginBottom: 18 }} />
              {/* 資訊條 */}
              <div style={{ display: "flex", border: "1px solid #cdc3ad", borderBottom: "1.5px solid #23201a", marginBottom: 22 }}>
                {[{ label: "學生姓名", value: student }, { label: "分校", value: branch }, { label: "課程", value: "六升七銜接課程" }].map((item, i) => (
                  <div key={item.label} style={{ flex: 1, padding: "8px 12px", borderRight: i < 2 ? "1px solid #cdc3ad" : "none" }}>
                    <div className="mono" style={{ fontSize: 7, letterSpacing: ".18em", color: "#9a917c", marginBottom: 3 }}>{item.label}</div>
                    <div className="serif" style={{ fontSize: 13, fontWeight: 600, color: "#23201a" }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {SUBJECTS.map(s => <SubjectBlock key={s} subject={s} answers={answers} />)}
            </div>
          </div>
        ) : (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: ".2em", color: "#9a917c" }}>載入中…</span>
          </div>
        )}

        {/* 隱藏列印頁（供 html2canvas 截圖，不可見但有 layout） */}
        {mounted && (
          <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none", overflow: "hidden" }}>
            {SUBJECTS.map((subj, i) => (
              <PrintPage key={subj} branch={branch} student={student} subject={subj}
                school={school} answers={answers}
                setRef={el => { printRefs.current[i] = el; }}
              />
            ))}
          </div>
        )}

        {mounted && (
          <div className="mono" style={{ textAlign: "center", marginTop: 24, fontSize: 10, letterSpacing: ".2em", color: "#9a917c" }}>
            {school.zh}　{branch}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ViewPage() {
  return <Suspense><ViewReport /></Suspense>;
}
