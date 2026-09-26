"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import indicatorDB from "@/data/indicators.json";
import { IndicatorDB, SUBJECTS, WEEKS, WEEK_ZH, Subject, WeekKey } from "@/lib/types";
import { getStudentAnswers, saveAnswers } from "@/lib/store";

const db = indicatorDB as unknown as IndicatorDB;
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

function InputForm() {
  const router = useRouter();
  const params = useSearchParams();
  const branch  = params.get("branch")  || "";
  const student = params.get("student") || "";
  const subject = (params.get("subject") || "國文") as Subject;
  const week    = (params.get("week")    || "W1")  as WeekKey;

  const indicators = db[subject]?.weeks[week] ?? [];
  const [flags, setFlags] = useState<boolean[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    getStudentAnswers(branch, student).then(answers => {
      if (cancelled) return;
      const existing = answers[subject]?.[week] ?? null;
      setFlags(existing ?? Array(indicators.length).fill(true));
      setLoaded(true);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, student, subject, week]);

  // Subject / week navigation
  const subjIdx = SUBJECTS.indexOf(subject);

  function toggle(i: number) {
    setFlags(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
    setSaved(false);
  }

  async function handleSave(): Promise<boolean> {
    setSaving(true);
    setSaveError(null);
    try {
      await saveAnswers(branch, student, subject, week, flags);
      setSaved(true);
      return true;
    } catch (e) {
      setSaved(false);
      setSaveError(e instanceof Error ? e.message : "儲存失敗，請檢查網路連線後重試");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndBack() {
    const ok = await handleSave();
    if (!ok) return;
    // 用完整頁面導航返回名冊，避免 Next.js 用戶端快取顯示過期的完成度
    window.location.href = `/report?branch=${encodeURIComponent(branch)}`;
  }

  async function navigate(s: Subject, w: WeekKey) {
    const ok = await handleSave();
    if (!ok) return;
    router.push(`/report/input?branch=${encodeURIComponent(branch)}&student=${encodeURIComponent(student)}&subject=${encodeURIComponent(s)}&week=${w}`);
  }

  const correctCount = flags.filter(Boolean).length;

  return (
    <div style={{ background: "#ddd3bd", minHeight: "100vh", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "720px" }}>
        <div style={{ position: "relative", background: "#f2ecdd", border: "1.5px solid #23201a", boxShadow: "0 30px 70px -30px rgba(35,32,26,.5)" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN }} />
          <div style={{ position: "relative" }}>

            {/* Masthead */}
            <div style={{ padding: "24px 40px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".28em", color: "#9a917c" }}>SCORE ENTRY · 成績填入</div>
                <div className="serif" style={{ fontWeight: 700, fontSize: 22, color: "#23201a", marginTop: 4, letterSpacing: ".04em" }}>{student}</div>
                <div className="mono" style={{ fontSize: 10, color: "#6e685a", marginTop: 3, letterSpacing: ".1em" }}>{branch}</div>
              </div>
              <button
                onClick={() => { window.location.href = `/report?branch=${encodeURIComponent(branch)}`; }}
                style={{ background: "transparent", border: "1px solid #cdc3ad", padding: "5px 12px", cursor: "pointer" }}
              >
                <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#6e685a" }}>← 返回名冊</span>
              </button>
            </div>

            <div style={{ margin: "16px 40px 0", borderTop: "2px solid #23201a" }} />
            <div style={{ margin: "3px 40px 0", borderTop: "1px solid #23201a" }} />

            {/* Subject × Week tabs */}
            <div style={{ padding: "0 40px", borderBottom: "1px solid #cdc3ad" }}>
              {/* Subject row */}
              <div style={{ display: "flex", gap: 0, marginTop: 14 }}>
                {SUBJECTS.map(s => (
                  <button
                    key={s}
                    onClick={() => navigate(s, week)}
                    className="serif"
                    style={{
                      padding: "6px 18px", border: "none", cursor: "pointer",
                      fontWeight: 600, fontSize: 13, letterSpacing: ".04em",
                      background: s === subject ? "#23201a" : "transparent",
                      color: s === subject ? "#f2ecdd" : "#9a917c",
                      borderBottom: s === subject ? "2px solid #23201a" : "none",
                    }}
                  >
                    {s}科
                  </button>
                ))}
              </div>
              {/* Week row */}
              <div style={{ display: "flex", gap: 0, marginTop: 6 }}>
                {WEEKS.map((w, i) => (
                  <button
                    key={w}
                    onClick={() => navigate(subject, w)}
                    className="serif"
                    style={{
                      padding: "4px 14px", border: "none", cursor: "pointer",
                      fontSize: 12, letterSpacing: ".04em",
                      color: w === week ? "#b0402c" : "#9a917c",
                      fontWeight: w === week ? 700 : 400,
                      borderBottom: w === week ? "2px solid #b0402c" : "2px solid transparent",
                      background: "transparent",
                    }}
                  >
                    第{WEEK_ZH[i]}週
                  </button>
                ))}
              </div>
            </div>

            {/* Info bar */}
            <div style={{ padding: "10px 40px", borderBottom: "1px solid #e4dfd2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: "#9a917c" }}>每題作答結果 · 點擊切換</span>
              <span className="mono" style={{ fontSize: 11, color: "#6e685a" }}>
                答對 <span style={{ color: "#b0402c", fontWeight: 600 }}>{correctCount}</span> / {indicators.length} 題
              </span>
            </div>

            {/* Question list */}
            {!loaded ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <span className="mono" style={{ fontSize: 11, letterSpacing: ".2em", color: "#9a917c" }}>載入中…</span>
              </div>
            ) : (
            <div>
              {indicators.map((ind, i) => (
                <div
                  key={i}
                  onClick={() => toggle(i)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 40px",
                    borderBottom: "1px solid #e4dfd2",
                    cursor: "pointer",
                    background: flags[i] ? "transparent" : "rgba(176,64,44,.04)",
                    transition: "background .12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                    <span className="mono" style={{ fontSize: 12, color: "#9a917c", minWidth: 32 }}>Q{String(i + 1).padStart(2, "0")}</span>
                    <span className="serif" style={{ fontSize: 14, color: "#23201a" }}>{ind}</span>
                  </div>
                  <div style={{
                    padding: "3px 14px",
                    border: `1px solid ${flags[i] ? "#23201a" : "#b0402c"}`,
                    color: flags[i] ? "#23201a" : "#b0402c",
                    fontSize: 12, fontWeight: 600, letterSpacing: ".06em",
                    userSelect: "none",
                  }}>
                    {flags[i] ? "✓ 答對" : "✗ 答錯"}
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Save buttons */}
            <div style={{ padding: "20px 40px 28px", display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center" }}>
              {saveError && <span className="mono" style={{ fontSize: 10, letterSpacing: ".08em", color: "#b0402c" }}>⚠ {saveError}</span>}
              {!saveError && saved && <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#6e685a" }}>已儲存 ✓</span>}
              <button onClick={handleSave} disabled={!loaded || saving} className="serif" style={{ padding: "8px 20px", border: "1.5px solid #23201a", background: "transparent", fontSize: 13, fontWeight: 600, color: "#23201a", cursor: loaded && !saving ? "pointer" : "not-allowed", letterSpacing: ".06em", opacity: loaded && !saving ? 1 : 0.5 }}>
                {saving ? "儲存中…" : "儲存"}
              </button>
              <button onClick={handleSaveAndBack} disabled={!loaded || saving} className="serif" style={{ padding: "8px 24px", border: "1.5px solid #23201a", background: "#23201a", fontSize: 13, fontWeight: 600, color: "#f2ecdd", cursor: loaded && !saving ? "pointer" : "not-allowed", letterSpacing: ".06em", opacity: loaded && !saving ? 1 : 0.5 }}>
                {saving ? "儲存中…" : "儲存並返回名冊"}
              </button>
            </div>
          </div>
        </div>

        {/* Adjacent week quick-nav */}
        <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8 }}>
            {subjIdx > 0 && (
              <button onClick={() => navigate(SUBJECTS[subjIdx - 1], week)} className="serif"
                style={{ padding: "8px 18px", border: "1.5px solid #23201a", background: "transparent", fontSize: 12, color: "#23201a", cursor: "pointer" }}>
                ← {SUBJECTS[subjIdx - 1]}科
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {subjIdx < SUBJECTS.length - 1 && (
              <button onClick={() => navigate(SUBJECTS[subjIdx + 1], week)} className="serif"
                style={{ padding: "8px 18px", border: "1.5px solid #23201a", background: "#23201a", fontSize: 12, color: "#f2ecdd", cursor: "pointer" }}>
                {SUBJECTS[subjIdx + 1]}科 →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InputPage() {
  return <Suspense><InputForm /></Suspense>;
}
