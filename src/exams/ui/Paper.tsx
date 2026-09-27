import { ReactNode } from "react";
import { C, GRAIN } from "./theme";

// 螢幕用的牛皮紙卡片外框（與 FIVE 名冊／填分頁相同）
export function PaperPage({ maxWidth, children, footer }: { maxWidth: number; children: ReactNode; footer?: ReactNode }) {
  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth }}>
        <div style={{ position: "relative", background: C.paper, border: `1.5px solid ${C.ink}`, boxShadow: "0 30px 70px -30px rgba(35,32,26,.5)" }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.5, backgroundImage: GRAIN }} />
          <div style={{ position: "relative" }}>{children}</div>
        </div>
        {footer && (
          <div className="mono" style={{ textAlign: "center", marginTop: 20, fontSize: 10, letterSpacing: ".2em", color: C.muted }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

export function DoubleRule({ margin = "18px 44px 0" }: { margin?: string }) {
  return (
    <>
      <div style={{ margin, borderTop: `2px solid ${C.ink}` }} />
      <div style={{ margin: margin.replace(/^\S+/, "3px"), borderTop: `1px solid ${C.ink}` }} />
    </>
  );
}

export function Loading({ text = "載入中…" }: { text?: string }) {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <span className="mono" style={{ fontSize: 11, letterSpacing: ".2em", color: C.muted }}>{text}</span>
    </div>
  );
}

export function ErrorLine({ text }: { text: string }) {
  return <div className="mono" style={{ padding: "12px 44px", fontSize: 11, letterSpacing: ".06em", color: C.accent }}>⚠ {text}</div>;
}
