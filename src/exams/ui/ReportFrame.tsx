import { ReactNode } from "react";
import { C, SERIF } from "./theme";

// A4 成績單頁框（794×1123，固定一頁、overflow hidden；排版與 FIVE 的 PrintPage 標頭一致）
// 需要精確置中的小元件（校徽、印章）一律用 SVG，避免 html2canvas 垂直偏移。
export function ReportFrame({ school, kicker, title, info, children, footer, setRef }: {
  school: { zh: string; char: string };
  kicker: string;
  title: string;
  info: { label: string; value: string }[];
  children: ReactNode;
  footer?: ReactNode;
  setRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={setRef} style={{ width: 794, height: 1123, background: C.paper, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: SERIF, flexShrink: 0 }}>
      <div style={{ padding: "40px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <svg width="46" height="46" style={{ flexShrink: 0 }}>
              <rect x="0.75" y="0.75" width="44.5" height="44.5" fill="none" stroke={C.accent} strokeWidth="1.5" />
              <text x="23" y="24" fontFamily={SERIF} fontSize="22" fontWeight="900" fill={C.accent} textAnchor="middle" dominantBaseline="central">{school.char}</text>
            </svg>
            <div>
              <div style={{ fontSize: 10, letterSpacing: ".06em", color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>{school.zh}　{kicker}</div>
              <div style={{ fontWeight: 700, fontSize: 24, color: C.ink, letterSpacing: ".04em" }}>{title}</div>
            </div>
          </div>
          <svg width="76" height="76" style={{ flexShrink: 0, opacity: 0.75 }}>
            <g transform="rotate(-13 38 38)">
              <rect x="7" y="7" width="62" height="62" fill="none" stroke={C.accent} strokeWidth="2.5" />
              <text x="38" y="31" fontFamily={SERIF} fontSize="9" letterSpacing="1.2" fill={C.accent} textAnchor="middle" dominantBaseline="central">{school.zh}</text>
              <text x="38" y="47" fontFamily={SERIF} fontSize="14" fontWeight="900" fill={C.accent} textAnchor="middle" dominantBaseline="central">認定</text>
            </g>
          </svg>
        </div>
        <div style={{ borderTop: `2px solid ${C.ink}`, margin: "10px 0 3px" }} />
        <div style={{ borderTop: `1px solid ${C.ink}`, marginBottom: 16 }} />

        <div style={{ display: "flex", border: `1px solid ${C.rule}`, borderBottom: `1.5px solid ${C.ink}`, marginBottom: 18 }}>
          {info.map((item, i) => (
            <div key={item.label} style={{ flex: 1, minWidth: 0, padding: "9px 12px", borderRight: i < info.length - 1 ? `1px solid ${C.rule}` : "none" }}>
              <div style={{ fontSize: 8, letterSpacing: ".18em", color: C.muted, marginBottom: 4, fontFamily: "monospace" }}>{item.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.value || "—"}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>{children}</div>

      {footer && (
        <div style={{ padding: "10px 48px 18px", borderTop: `1px solid ${C.ruleLight}`, fontSize: 10, color: C.muted, fontFamily: "monospace", letterSpacing: ".08em", display: "flex", justifyContent: "space-between" }}>
          {footer}
        </div>
      )}
    </div>
  );
}

// 區段小標（與 FIVE 的「能力雷達圖」「五力指標說明」相同字樣）
export function SectionLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ fontSize: 8, letterSpacing: ".16em", color: C.muted, marginBottom: 6, fontFamily: "monospace", ...style }}>{children}</div>;
}

// 區段大標（取代原系統各自的標題樣式）
export function SectionHeading({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: `1px solid ${C.rule}`, paddingBottom: 7, marginBottom: 12 }}>
      <span style={{ fontWeight: 700, fontSize: 17, color: C.ink, letterSpacing: ".04em" }}>{children}</span>
      {right}
    </div>
  );
}
