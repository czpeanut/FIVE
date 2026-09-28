import { EXAM_MENU } from "@/exams/menu";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

interface Entry { href: string; no: string; seal: string; title: string; desc: string; tags: readonly string[]; external?: boolean }

// 成績單依學制分組；五力指標為國中（六升七銜接課程）
const GROUPS: { label: string; en: string; entries: Entry[] }[] = [
  {
    label: "國中", en: "JUNIOR HIGH",
    entries: [
      { href: "/report", no: "02", seal: "五", title: "五力指標成績單", desc: "六升七銜接・五週週測・五力雷達圖", tags: ["六升七", "國英數自"] },
      ...EXAM_MENU.filter(m => m.level === "國中").map(m => ({ href: `/exam/${m.id}`, no: m.no, seal: m.seal, title: m.title, desc: m.desc.join("・"), tags: m.tags })),
    ],
  },
  {
    label: "國小", en: "ELEMENTARY",
    entries: EXAM_MENU.filter(m => m.level === "國小").map(m => ({ href: `/exam/${m.id}`, no: m.no, seal: m.seal, title: m.title, desc: m.desc.join("・"), tags: m.tags })),
  },
];

const OTHER: Entry = { href: "https://codexstudy.com", no: "01", seal: "解", title: "AI 解題學習系統", desc: "拍照記錄・錯題本管理・弱點分析・錯題演練", tags: ["codexstudy.com"], external: true };

function Seal({ char }: { char: string }) {
  return (
    <svg className="pt-seal" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
      <rect x="0.75" y="0.75" width="42.5" height="42.5" fill="none" stroke="#b0402c" strokeWidth="1.5" />
      <text x="22" y="23" fontFamily="'Noto Serif TC',serif" fontSize="21" fontWeight="900" fill="#b0402c" textAnchor="middle" dominantBaseline="central">{char}</text>
    </svg>
  );
}

function Row({ e }: { e: Entry }) {
  return (
    <a className="pt-row" href={e.href} {...(e.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      <span className="pt-no mono">{e.no}</span>
      <Seal char={e.seal} />
      <span className="pt-body">
        <span className="pt-title serif">{e.title}</span>
        <span className="pt-desc">{e.desc}</span>
        <span className="pt-tags">{e.tags.map(t => <span key={t} className="pt-tag mono">{t}</span>)}</span>
      </span>
      <span className="pt-arrow mono">{e.external ? "↗" : "→"}</span>
    </a>
  );
}

const CSS = `
.pt-wrap { background:#ddd3bd; min-height:100vh; display:flex; justify-content:center; padding:48px 16px; }
.pt-inner { width:100%; max-width:760px; }
.pt-paper { position:relative; background:#f2ecdd; border:1.5px solid #23201a; box-shadow:0 30px 70px -30px rgba(35,32,26,.5); }
.pt-grain { position:absolute; inset:0; pointer-events:none; mix-blend-mode:multiply; opacity:.5; }
.pt-head { position:relative; padding:36px 48px 0; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.pt-kicker { font-size:10px; letter-spacing:.34em; color:#9a917c; }
.pt-name { font-weight:700; font-size:30px; letter-spacing:.06em; color:#23201a; margin-top:6px; line-height:1.15; }
.pt-sub { font-size:13px; color:#6e685a; margin-top:6px; }
.pt-stamp { flex-shrink:0; opacity:.78; }
.pt-rule1 { margin:22px 48px 0; border-top:2px solid #23201a; }
.pt-rule2 { margin:3px 48px 0; border-top:1px solid #23201a; }
.pt-section { position:relative; padding:26px 48px 4px; }
.pt-section + .pt-section { padding-top:18px; }
.pt-sec-head { display:flex; align-items:baseline; gap:12px; padding-bottom:8px; border-bottom:1px solid #cdc3ad; }
.pt-sec-label { font-weight:700; font-size:15px; color:#23201a; letter-spacing:.12em; white-space:nowrap; }
.pt-sec-en { font-size:9px; letter-spacing:.3em; color:#9a917c; }
.pt-sec-count { margin-left:auto; font-size:9px; letter-spacing:.2em; color:#9a917c; white-space:nowrap; }
.pt-row { position:relative; display:grid; grid-template-columns:28px 44px 1fr 24px; align-items:center; gap:18px; padding:18px 12px 18px 14px; margin:0 -12px 0 -14px; text-decoration:none; border-bottom:1px solid #e4dfd2; transition:background .15s; }
.pt-row::before { content:""; position:absolute; left:0; top:12px; bottom:12px; width:2px; background:#b0402c; transform:scaleY(0); transition:transform .18s; }
.pt-row:hover, .pt-row:focus-visible { background:#f7f2e6; outline:none; }
.pt-row:hover::before, .pt-row:focus-visible::before { transform:scaleY(1); }
.pt-row:last-child { border-bottom:none; }
.pt-no { font-size:11px; color:#9a917c; letter-spacing:.08em; }
.pt-body { display:flex; flex-direction:column; min-width:0; }
.pt-title { font-weight:700; font-size:18px; color:#23201a; letter-spacing:.04em; line-height:1.3; }
.pt-desc { font-size:12.5px; color:#6e685a; margin-top:4px; line-height:1.6; }
.pt-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
.pt-tag { font-size:10px; letter-spacing:.06em; color:#6e685a; border:1px solid #cdc3ad; padding:1px 7px; }
.pt-arrow { font-size:16px; color:#b0402c; justify-self:end; transition:transform .18s; }
.pt-row:hover .pt-arrow { transform:translateX(4px); }
.pt-foot { position:relative; padding:18px 48px 26px; margin-top:14px; border-top:1px solid #e4dfd2; display:flex; justify-content:space-between; gap:12px; font-size:10px; letter-spacing:.14em; color:#9a917c; }
.pt-caption { text-align:center; margin-top:18px; font-size:10px; letter-spacing:.24em; color:#9a917c; }
@media (max-width: 600px) {
  .pt-wrap { padding:20px 12px; }
  .pt-head { padding:26px 20px 0; }
  .pt-name { font-size:24px; }
  .pt-stamp { display:none; }
  .pt-rule1, .pt-rule2 { margin-left:20px; margin-right:20px; }
  .pt-section { padding-left:20px; padding-right:20px; }
  .pt-row { grid-template-columns:40px 1fr 18px; gap:14px; padding:16px 10px; margin:0 -10px; }
  .pt-no { display:none; }
  .pt-seal { width:40px; height:40px; }
  .pt-title { font-size:16.5px; }
  .pt-foot { padding:16px 20px 22px; flex-direction:column; gap:4px; }
  .pt-sec-en { display:none; }
  .pt-sub { font-size:12px; }
}
`;

export default function Portal() {
  const total = GROUPS.reduce((n, g) => n + g.entries.length, 0);
  return (
    <div className="pt-wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="pt-inner">
        <div className="pt-paper">
          <div className="pt-grain" style={{ backgroundImage: GRAIN_SVG }} />

          {/* 報頭 */}
          <div className="pt-head">
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Seal char="學" />
              <div>
                <div className="pt-kicker mono">LEARNING SYSTEM · PORTAL</div>
                <div className="pt-name serif">學城教育系統</div>
                <div className="pt-sub serif">成績單輸出・學習系統入口，請選擇要進入的系統</div>
              </div>
            </div>
            <svg className="pt-stamp" width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
              <g transform="rotate(-12 36 36)">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#b0402c" strokeWidth="2" />
                <circle cx="36" cy="36" r="25" fill="none" stroke="#b0402c" strokeWidth="0.8" />
                <text x="36" y="29" fontFamily="'Noto Serif TC',serif" fontSize="8" letterSpacing="1" fill="#b0402c" textAnchor="middle" dominantBaseline="central">學城教育</text>
                <text x="36" y="43" fontFamily="'Noto Serif TC',serif" fontSize="12" fontWeight="900" fill="#b0402c" textAnchor="middle" dominantBaseline="central">成績單</text>
              </g>
            </svg>
          </div>
          <div className="pt-rule1" />
          <div className="pt-rule2" />

          {/* 成績單系統（依學制分組） */}
          {GROUPS.map(g => (
            <section key={g.label} className="pt-section">
              <div className="pt-sec-head">
                <span className="pt-sec-label serif">{g.label}成績單</span>
                <span className="pt-sec-en mono">{g.en} · REPORT CARDS</span>
                <span className="pt-sec-count mono">{g.entries.length} 套</span>
              </div>
              {g.entries.map(e => <Row key={e.href} e={e} />)}
            </section>
          ))}

          {/* 其他系統 */}
          <section className="pt-section">
            <div className="pt-sec-head">
              <span className="pt-sec-label serif">其他系統</span>
              <span className="pt-sec-en mono">LEARNING</span>
            </div>
            <Row e={OTHER} />
          </section>

          <div className="pt-foot mono">
            <span>成績單系統 {total} 套・資料雲端保存</span>
            <span>選擇分校後即可登記成績、下載 PDF</span>
          </div>
        </div>

        <div className="pt-caption mono">XUECHENG EDUCATION · 學城文理補習班</div>
      </div>
    </div>
  );
}
