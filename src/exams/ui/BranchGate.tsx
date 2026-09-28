"use client";

import { ReactNode, useEffect, useState } from "react";
import { BRANCH_GROUPS } from "@/lib/branches";
import { C, GRAIN, branchKey } from "./theme";

// 分校選擇（與 FIVE 相同的畫面；每套系統各自記住選過的分校）
function BranchSelect({ moduleId, onSelect, title }: { moduleId: string; onSelect: (branch: string) => void; title: string }) {
  const [region, setRegion] = useState("");
  const [branch, setBranch] = useState("");
  const regionBranches = BRANCH_GROUPS.find(g => g.region === region)?.branches ?? [];

  function confirm() {
    if (!branch) return;
    localStorage.setItem(branchKey(moduleId), branch);
    onSelect(branch);
  }

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ position: "relative", background: C.paper, border: `1.5px solid ${C.ink}`, width: "100%", maxWidth: 480, boxShadow: "0 40px 80px -30px rgba(35,32,26,.45)" }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN }} />
        <div style={{ position: "relative", padding: "40px 44px 44px" }}>
          <div style={{ marginBottom: 32 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".32em", color: C.muted, marginBottom: 8 }}>BRANCH SELECTION · 分校選擇</div>
            <div className="serif" style={{ fontWeight: 700, fontSize: 24, color: C.ink, letterSpacing: ".04em", lineHeight: 1.2 }}>請選擇您的分校</div>
            <div className="serif" style={{ fontSize: 12, color: C.inkSoft, marginTop: 6 }}>{title}・選擇後將記住此分校</div>
          </div>

          <div style={{ borderTop: `2px solid ${C.ink}`, marginBottom: 3 }} />
          <div style={{ borderTop: `1px solid ${C.ink}`, marginBottom: 28 }} />

          <div style={{ marginBottom: 24 }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: C.muted, marginBottom: 8 }}>地區</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {BRANCH_GROUPS.map(g => (
                <button key={g.region} onClick={() => { setRegion(g.region); setBranch(""); }} className="serif"
                  style={{
                    padding: "6px 16px", border: `1.5px solid ${region === g.region ? C.ink : C.rule}`,
                    background: region === g.region ? C.ink : "transparent",
                    color: region === g.region ? C.paper : C.inkSoft,
                    fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: ".04em",
                  }}>
                  {g.region.replace("地區", "")}
                </button>
              ))}
            </div>
          </div>

          {region && (
            <div style={{ marginBottom: 32 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: C.muted, marginBottom: 8 }}>分校</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {regionBranches.map(b => (
                  <button key={b} onClick={() => setBranch(b)} className="serif"
                    style={{
                      padding: "6px 14px", border: `1.5px solid ${branch === b ? C.accent : C.rule}`,
                      background: branch === b ? C.accent : "transparent",
                      color: branch === b ? C.paper : C.inkSoft,
                      fontSize: 12, fontWeight: branch === b ? 700 : 400, cursor: "pointer", letterSpacing: ".04em",
                    }}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={confirm} disabled={!branch} className="serif"
            style={{
              width: "100%", padding: "12px 0", background: branch ? C.ink : C.rule, color: C.paper, border: "none",
              fontSize: 14, fontWeight: 700, letterSpacing: ".1em", cursor: branch ? "pointer" : "not-allowed",
            }}>
            {branch ? `進入「${branch}」名冊 →` : "請先選擇分校"}
          </button>

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: C.muted }}>← 返回主選單</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// 取得登入分校；尚未選擇時顯示選擇畫面
export function BranchGate({ moduleId, title, children }: { moduleId: string; title: string; children: (branch: string, changeBranch: () => void) => ReactNode }) {
  const [branch, setBranch] = useState<string | null>(null);

  useEffect(() => {
    setBranch(localStorage.getItem(branchKey(moduleId)) ?? "");
  }, [moduleId]);

  if (branch === null) {
    return (
      <div style={{ background: C.pageBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: ".2em", color: C.muted }}>載入中…</span>
      </div>
    );
  }
  if (!branch) return <BranchSelect moduleId={moduleId} title={title} onSelect={setBranch} />;
  return <>{children(branch, () => { localStorage.removeItem(branchKey(moduleId)); setBranch(""); })}</>;
}
