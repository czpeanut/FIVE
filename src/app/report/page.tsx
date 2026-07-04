"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRANCH_GROUPS, getSchoolInfo } from "@/lib/branches";
import { SUBJECTS, WEEKS, WEEK_ZH } from "@/lib/types";
import {
  getStudentList, addStudent, removeStudent,
  getStudentProgress, isStudentComplete,
} from "@/lib/store";

const BRANCH_KEY = "selectedBranch_v1";
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

/* ── 分校選擇畫面 ── */
function BranchSelect({ onSelect }: { onSelect: (branch: string) => void }) {
  const [region, setRegion] = useState("");
  const [branch, setBranch] = useState("");
  const regionBranches = BRANCH_GROUPS.find(g => g.region === region)?.branches ?? [];

  function confirm() {
    if (!branch) return;
    localStorage.setItem(BRANCH_KEY, branch);
    onSelect(branch);
  }

  return (
    <div style={{ background: "#ddd3bd", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "relative", background: "#f2ecdd", border: "1.5px solid #23201a", width: "100%", maxWidth: 480, boxShadow: "0 40px 80px -30px rgba(35,32,26,.45)" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN }} />
        <div style={{ position: "relative", padding: "40px 44px 44px" }}>

          {/* 標頭 */}
          <div style={{ marginBottom: 32 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".32em", color: "#9a917c", marginBottom: 8 }}>BRANCH SELECTION · 分校選擇</div>
            <div className="serif" style={{ fontWeight: 700, fontSize: 24, color: "#23201a", letterSpacing: ".04em", lineHeight: 1.2 }}>請選擇您的分校</div>
            <div className="serif" style={{ fontSize: 12, color: "#6e685a", marginTop: 6 }}>選擇後將記住此分校，下次直接進入名冊</div>
          </div>

          <div style={{ borderTop: "2px solid #23201a", marginBottom: 3 }} />
          <div style={{ borderTop: "1px solid #23201a", marginBottom: 28 }} />

          {/* 地區 */}
          <div style={{ marginBottom: 24 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: "#9a917c", marginBottom: 8 }}>地區</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BRANCH_GROUPS.map(g => (
                <button key={g.region} onClick={() => { setRegion(g.region); setBranch(""); }}
                  className="serif"
                  style={{
                    padding: "6px 16px", border: `1.5px solid ${region === g.region ? "#23201a" : "#cdc3ad"}`,
                    background: region === g.region ? "#23201a" : "transparent",
                    color: region === g.region ? "#f2ecdd" : "#6e685a",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: ".04em",
                  }}>
                  {g.region.replace("地區", "")}
                </button>
              ))}
            </div>
          </div>

          {/* 分校 */}
          {region && (
            <div style={{ marginBottom: 32 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: "#9a917c", marginBottom: 8 }}>分校</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {regionBranches.map(b => (
                  <button key={b} onClick={() => setBranch(b)}
                    className="serif"
                    style={{
                      padding: "6px 14px", border: `1.5px solid ${branch === b ? "#b0402c" : "#cdc3ad"}`,
                      background: branch === b ? "#b0402c" : "transparent",
                      color: branch === b ? "#f2ecdd" : "#6e685a",
                      fontSize: 12, fontWeight: branch === b ? 700 : 400, cursor: "pointer", letterSpacing: ".04em",
                    }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 確認按鈕 */}
          <button onClick={confirm} disabled={!branch}
            className="serif"
            style={{
              width: "100%", padding: "12px 0",
              background: branch ? "#23201a" : "#cdc3ad",
              color: "#f2ecdd", border: "none",
              fontSize: 14, fontWeight: 700, letterSpacing: ".1em",
              cursor: branch ? "pointer" : "not-allowed",
            }}>
            {branch ? `進入「${branch}」名冊 →` : "請先選擇分校"}
          </button>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#9a917c" }}>← 返回主選單</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 名冊主畫面 ── */
function Roster({ branch, onChangeBranch }: { branch: string; onChangeBranch: () => void }) {
  const school = getSchoolInfo(branch);
  const [students, setStudents] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setStudents(getStudentList(branch));
  }, [branch]);

  function handleAddStudent() {
    const name = newName.trim();
    if (!name || students.includes(name)) return;
    addStudent(branch, name);
    setStudents(getStudentList(branch));
    setNewName("");
    setShowAdd(false);
  }

  function handleRemove(name: string) {
    if (!confirm(`確定刪除「${name}」的所有成績資料？`)) return;
    removeStudent(branch, name);
    setStudents(getStudentList(branch));
  }

  return (
    <div style={{ background: "#ddd3bd", minHeight: "100vh", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "960px" }}>
        <div style={{ position: "relative", background: "#f2ecdd", border: "1.5px solid #23201a", boxShadow: "0 30px 70px -30px rgba(35,32,26,.5)" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN }} />
          <div style={{ position: "relative" }}>

            {/* 標頭 */}
            <div style={{ padding: "28px 44px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 44, height: 44, border: "1.5px solid #b0402c", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0402c", marginTop: 2 }}>
                  <span className="serif" style={{ fontWeight: 900, fontSize: 20 }}>{school.char}</span>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: ".34em", color: "#9a917c" }}>{school.en} · REGISTRY</div>
                  <div className="serif" style={{ fontWeight: 700, fontSize: 26, letterSpacing: ".04em", color: "#23201a", marginTop: 4, lineHeight: 1.1 }}>五力指標成績管理</div>
                  <div className="serif" style={{ fontSize: 12, color: "#6e685a", marginTop: 3 }}>
                    {branch}　六升七銜接課程　五週逐次填入・完成後輸出報告
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", marginTop: 2 }}>
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", border: "1px solid #cdc3ad", padding: "5px 12px" }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#6e685a" }}>← 返回選單</span>
                </Link>
                <button onClick={onChangeBranch} style={{ background: "transparent", border: "1px solid #cdc3ad", padding: "5px 12px", cursor: "pointer" }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: "#9a917c" }}>切換分校</span>
                </button>
              </div>
            </div>

            <div style={{ margin: "18px 44px 0", borderTop: "2px solid #23201a" }} />
            <div style={{ margin: "3px 44px 0", borderTop: "1px solid #23201a" }} />

            {/* 新增學生列 */}
            <div style={{ padding: "16px 44px", borderBottom: "1px solid #cdc3ad", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(true)} className="serif"
                style={{ padding: "7px 20px", background: "#23201a", color: "#f2ecdd", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: ".06em" }}>
                ＋ 新增學生
              </button>
            </div>

            {showAdd && (
              <div style={{ padding: "14px 44px", background: "#f7f2e6", borderBottom: "1px solid #cdc3ad", display: "flex", alignItems: "center", gap: 16 }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: "#9a917c" }}>新增學生姓名</div>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddStudent()}
                  autoFocus placeholder="輸入姓名…"
                  style={{ background: "transparent", border: "none", borderBottom: "1.5px solid #23201a", padding: "3px 0", fontFamily: "'Noto Serif TC', serif", fontSize: 15, color: "#23201a", outline: "none", minWidth: 140 }} />
                <button onClick={handleAddStudent} className="serif"
                  style={{ padding: "5px 16px", background: "#23201a", color: "#f2ecdd", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>確認新增</button>
                <button onClick={() => { setShowAdd(false); setNewName(""); }}
                  style={{ background: "transparent", border: "none", color: "#9a917c", fontSize: 13, cursor: "pointer" }}>取消</button>
              </div>
            )}

            {/* 空狀態 */}
            {students.length === 0 && (
              <div style={{ padding: "40px 44px", textAlign: "center" }}>
                <div className="serif" style={{ color: "#9a917c", fontSize: 14 }}>尚無學生資料，請點擊「新增學生」</div>
              </div>
            )}

            {/* 學生表格 */}
            {students.length > 0 && (
              <div style={{ padding: "0 44px 32px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "160px repeat(4, 1fr) 80px 100px", borderBottom: "1.5px solid #23201a", paddingTop: 20, paddingBottom: 8 }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: "#9a917c" }}>姓名</div>
                  {SUBJECTS.map(s => (
                    <div key={s} className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#9a917c", textAlign: "center" }}>{s}科</div>
                  ))}
                  <div className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#9a917c", textAlign: "center" }}>完成度</div>
                  <div />
                </div>

                {students.map((name, si) => {
                  const prog = getStudentProgress(branch, name);
                  const done = isStudentComplete(branch, name);
                  const totalCells = SUBJECTS.length * WEEKS.length;
                  const filledCells = SUBJECTS.reduce((acc, s) => acc + WEEKS.filter(w => prog[s]?.[w]).length, 0);

                  return (
                    <div key={name} style={{ display: "grid", gridTemplateColumns: "160px repeat(4, 1fr) 80px 100px", borderBottom: "1px solid #e4dfd2", alignItems: "center", padding: "10px 0", background: si % 2 === 0 ? "transparent" : "rgba(0,0,0,.015)" }}>
                      <div className="serif" style={{ fontSize: 14, color: "#23201a", fontWeight: done ? 700 : 400 }}>
                        {done && <span style={{ color: "#b0402c", marginRight: 4 }}>✓</span>}
                        {name}
                      </div>

                      {SUBJECTS.map(subj => (
                        <div key={subj} style={{ display: "flex", justifyContent: "center" }}>
                          <div style={{ display: "flex", gap: 3 }}>
                            {WEEKS.map((w, wi) => {
                              const filled = prog[subj]?.[w];
                              return (
                                <a key={w}
                                  href={`/report/input?branch=${encodeURIComponent(branch)}&student=${encodeURIComponent(name)}&subject=${encodeURIComponent(subj)}&week=${w}`}
                                  title={`${name} ${subj} 第${WEEK_ZH[wi]}週`}
                                  style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", background: filled ? "#b0402c" : "#e4dfd2", border: `1px solid ${filled ? "#b0402c" : "#cdc3ad"}`, textDecoration: "none", fontSize: 7, color: filled ? "#f2ecdd" : "#9a917c", fontFamily: "monospace" }}>
                                  {wi + 1}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      <div style={{ textAlign: "center" }}>
                        <span className="mono" style={{ fontSize: 12, color: done ? "#b0402c" : "#6e685a", fontWeight: done ? 700 : 400 }}>
                          {filledCells}/{totalCells}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <a href={`/report/view?branch=${encodeURIComponent(branch)}&student=${encodeURIComponent(name)}`}
                          style={{ padding: "4px 10px", background: done ? "#b0402c" : "#9a917c", color: "#f2ecdd", textDecoration: "none", fontSize: 11, fontFamily: "'Noto Serif TC', serif", fontWeight: 600, letterSpacing: ".04em" }}>
                          出報告
                        </a>
                        <button onClick={() => handleRemove(name)}
                          style={{ background: "transparent", border: "1px solid #cdc3ad", padding: "4px 8px", fontSize: 11, color: "#9a917c", cursor: "pointer" }}>
                          刪除
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 圖例 */}
            {students.length > 0 && (
              <div style={{ padding: "0 44px 24px", display: "flex", alignItems: "center", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 14, height: 14, background: "#b0402c", border: "1px solid #b0402c" }} />
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#9a917c" }}>已填入</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 14, height: 14, background: "#e4dfd2", border: "1px solid #cdc3ad" }} />
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#9a917c" }}>未填入（點擊填入）</span>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: "#9a917c" }}>五週全部填完後「出報告」變為磚紅色</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mono" style={{ textAlign: "center", marginTop: 20, fontSize: 10, letterSpacing: ".2em", color: "#9a917c" }}>
          {school.en} · {branch}
        </div>
      </div>
    </div>
  );
}

/* ── 主元件：登入狀態管理 ── */
export default function ReportHub() {
  const [branch, setBranch] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(BRANCH_KEY);
    setBranch(saved ?? "");
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ background: "#ddd3bd", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: ".2em", color: "#9a917c" }}>載入中…</span>
      </div>
    );
  }

  if (!branch) {
    return <BranchSelect onSelect={b => setBranch(b)} />;
  }

  return <Roster branch={branch} onChangeBranch={() => {
    localStorage.removeItem(BRANCH_KEY);
    setBranch("");
  }} />;
}
