import { ReportFrame, SectionHeading } from "../ui/ReportFrame";
import { C } from "../ui/theme";
import { analyzeJuniorMock, getBackgroundColor, JmLevel } from "./scoring";
import type { ReportPageProps } from "../reports";

const LEVEL_COLOR: Record<JmLevel, string> = { 精通: "#064b00", 熟練: "#8a4d00", 待加強: "#9b0018" };

// 國中模考：每科一頁。內容對應原成績單：
// 標題、學生資訊（科目／姓名／測驗項目／學校）、總學科能力等級＋答對題數（數學含非選題得分）、
// 兩欄知識點熟練度表（百分比熱力底色＋精通／熟練／待加強）、綜合能力評語、補習班標籤。
export function JuniorMockPage({ exam, subject, student, info, answer, school, setRef }: ReportPageProps) {
  const nonChoice = typeof answer.extra?.nonChoice === "number" ? answer.extra.nonChoice : null;
  const r = analyzeJuniorMock(exam, subject, answer.answers as string[], subject === "數學" ? nonChoice : null);
  if (!r) return null;

  const pairs: [typeof r.skills[number], typeof r.skills[number] | undefined][] = [];
  for (let i = 0; i < r.skills.length; i += 2) pairs.push([r.skills[i], r.skills[i + 1]]);
  // 知識點多的科目（社會 27 項）縮小列高，確保固定一頁 A4
  const dense = pairs.length > 11;
  const cellPad = dense ? "5px 8px" : "7px 9px";
  const fs = dense ? 11.5 : 12.5;

  const th = { textAlign: "left" as const, padding: "6px 9px", fontFamily: "monospace", fontSize: 9, color: C.muted, fontWeight: 400, letterSpacing: ".12em" };

  return (
    <ReportFrame
      school={school}
      kicker="ACADEMIC ANALYSIS REPORT"
      title={`${subject}學科能力深度評估報告`}
      info={[
        { label: "科目", value: subject },
        { label: "姓名", value: student },
        { label: "測驗項目", value: exam },
        { label: "學校", value: info.school ?? "" },
      ]}
      footer={<><span>{school.zh}</span><span>學科能力深度評估報告</span></>}
      setRef={setRef}
    >
      <div style={{ padding: "0 48px", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        {/* 總學科能力等級 */}
        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.rule}`, background: C.paperLight, marginBottom: 18 }}>
          <div style={{ padding: "12px 26px", borderRight: `1px solid ${C.rule}`, textAlign: "center", minWidth: 190 }}>
            <div style={{ fontSize: 9, letterSpacing: ".18em", color: C.muted, fontFamily: "monospace", marginBottom: 2 }}>總學科能力等級</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.accent, lineHeight: 1.1, fontFamily: "'Noto Serif TC', serif" }}>{r.gradeBand}</div>
          </div>
          <div style={{ padding: "12px 24px", fontSize: 14, color: C.ink, lineHeight: 1.9 }}>
            <div>答對題數：<b style={{ fontFamily: "monospace" }}>{r.correctCount} / {r.totalItems}</b></div>
            {subject === "數學" && <div>非選題得分：<b style={{ fontFamily: "monospace" }}>{nonChoice} / 6</b></div>}
          </div>
        </div>

        {/* 知識點熟練度分析 */}
        <SectionHeading>知識點熟練度分析</SectionHeading>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 18 }}>
          <thead>
            <tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
              <th style={th}>知識點</th><th style={{ ...th, width: 76 }}>掌握程度</th>
              <th style={{ ...th, borderLeft: `1px solid ${C.rule}` }}>知識點</th><th style={{ ...th, width: 76 }}>掌握程度</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map(([a, b]) => (
              <tr key={a.name} style={{ borderBottom: `1px solid ${C.ruleLight}` }}>
                <td style={{ padding: cellPad, fontSize: fs, fontWeight: 600, color: C.ink, background: getBackgroundColor(a.percentage) }}>{a.name} ({a.percentage}%)</td>
                <td style={{ padding: cellPad, fontSize: fs, fontWeight: 700, color: LEVEL_COLOR[a.level] }}>{a.level}</td>
                <td style={{ padding: cellPad, fontSize: fs, fontWeight: 600, color: C.ink, background: b ? getBackgroundColor(b.percentage) : "transparent", borderLeft: `1px solid ${C.rule}` }}>{b ? `${b.name} (${b.percentage}%)` : ""}</td>
                <td style={{ padding: cellPad, fontSize: fs, fontWeight: 700, color: b ? LEVEL_COLOR[b.level] : C.ink }}>{b?.level ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 綜合能力評語 */}
        <SectionHeading>綜合能力評語</SectionHeading>
        <div style={{ background: C.paperAlt, border: `1px solid ${C.ruleLight}`, padding: "12px 16px", fontSize: 13, color: C.ink, lineHeight: 1.9 }}>{r.message}</div>

        {/* 補習班標籤 */}
        <div style={{ marginTop: "auto", paddingBottom: 14, textAlign: "center", fontSize: 18, fontWeight: 700, letterSpacing: ".08em", color: C.ink }}>{school.zh}</div>
      </div>
    </ReportFrame>
  );
}
