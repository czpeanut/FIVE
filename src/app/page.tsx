"use client";

import Link from "next/link";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

export default function Portal() {
  return (
    <div style={{ background: "#ddd3bd", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <div style={{ width: "100%", maxWidth: "720px" }}>

        {/* Paper Card */}
        <div style={{ position: "relative", background: "#f2ecdd", border: "1.5px solid #23201a", boxShadow: "0 30px 70px -30px rgba(35,32,26,.5)" }}>

          {/* Grain texture */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN_SVG }} />

          <div style={{ position: "relative" }}>
            {/* Masthead */}
            <div style={{ padding: "32px 44px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ width: 46, height: 46, border: "1.5px solid #b0402c", display: "flex", alignItems: "center", justifyContent: "center", color: "#b0402c", marginTop: 4 }}>
                  <span className="serif" style={{ fontWeight: 900, fontSize: 22 }}>學</span>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 11, letterSpacing: ".34em", color: "#9a917c" }}>LEARNING SYSTEM · PORTAL</div>
                  <div className="serif" style={{ fontWeight: 700, fontSize: 28, letterSpacing: ".04em", color: "#23201a", marginTop: 5, lineHeight: 1.1 }}>學城教育系統</div>
                  <div className="serif" style={{ fontSize: 13, color: "#6e685a", marginTop: 4 }}>請選擇要進入的系統</div>
                </div>
              </div>
            </div>

            {/* Double rule */}
            <div style={{ margin: "20px 44px 0", borderTop: "2px solid #23201a" }} />
            <div style={{ margin: "3px 44px 0", borderTop: "1px solid #23201a" }} />

            {/* Cards */}
            <div style={{ padding: "32px 44px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* AI 學習系統 */}
              <a href="https://codexstudy.com" style={{ textDecoration: "none", display: "block", border: "1.5px solid #cdc3ad", padding: "28px 24px", background: "#f7f2e6", transition: "border-color .18s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#23201a")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#cdc3ad")}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".25em", color: "#9a917c", marginBottom: 14 }}>SYSTEM · 01</div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
                <div className="serif" style={{ fontWeight: 700, fontSize: 18, color: "#23201a", letterSpacing: ".04em" }}>AI 解題學習系統</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#6e685a", lineHeight: 1.7 }}>拍照記錄・錯題本管理<br />弱點分析・錯題演練</div>
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 6, color: "#b0402c", fontSize: 13 }} className="mono">
                  <span>codexstudy.com</span>
                  <span>→</span>
                </div>
              </a>

              {/* 成績單系統 */}
              <Link href="/report" style={{ textDecoration: "none", display: "block", border: "1.5px solid #cdc3ad", padding: "28px 24px", background: "#f7f2e6", transition: "border-color .18s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#23201a")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#cdc3ad")}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: ".25em", color: "#9a917c", marginBottom: 14 }}>SYSTEM · 02</div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div className="serif" style={{ fontWeight: 700, fontSize: 18, color: "#23201a", letterSpacing: ".04em" }}>五力指標成績單</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#6e685a", lineHeight: 1.7 }}>測驗成績輸入・雷達圖<br />五力指標分析・PDF 報告</div>
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 6, color: "#b0402c", fontSize: 13 }} className="mono">
                  <span>進入系統</span>
                  <span>→</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mono" style={{ textAlign: "center", marginTop: 20, fontSize: 11, letterSpacing: ".2em", color: "#9a917c" }}>
          XUECHENG EDUCATION · 學城文理補習班
        </div>
      </div>
    </div>
  );
}
