import { ReportFrame, SectionHeading, SectionLabel } from "../ui/ReportFrame";
import { C } from "../ui/theme";
import { radarSvg, stackedBarSvg } from "../ui/charts";
import { analyzeElementary, EL_GRADES, EL_SUBJECTS } from "./scoring";
import type { ReportPageProps } from "../reports";

// 國小學力檢測：每科一頁。內容對應原成績單：
// 標題＋科目＋總分、年度／年級／姓名、「五力指標」說明文字＋雷達圖＋指標說明表、
// 「知識向度」說明文字＋各單元答對率分析（堆疊長條圖）＋單元答對／答錯題數表（含總計）、版權列。
export function ElementaryPage({ exam, subject, student, info, answer, school, setRef }: ReportPageProps) {
  const r = analyzeElementary(exam, subject, answer.answers as string[]);
  const subjectName = EL_SUBJECTS.find(s => s.key === subject)?.name ?? subject;
  const gradeName = EL_GRADES.find(g => g.key === exam)?.name ?? exam;
  const year = /^\d{4}/.test(info.examDate ?? "") ? `${info.examDate!.slice(0, 4)}年` : "";

  const svg = radarSvg(r.radarData.map(d => ({ indicator: d.subject, percent: d.A })), 230);
  const bar = stackedBarSvg(r.barData.map(b => ({ name: b.name, a: b.correctRate, b: b.incorrectRate })), { width: 330, labelWidth: 118, legend: ["答對率", "答錯率"] });

  const th = { padding: "5px 8px", fontFamily: "monospace", fontSize: 9, color: C.muted, fontWeight: 400, letterSpacing: ".12em", textAlign: "left" as const };
  const td = { padding: "5px 8px", fontSize: 11.5, color: C.ink, borderBottom: `1px solid ${C.ruleLight}` };

  return (
    <ReportFrame
      school={school}
      kicker="學力檢測分析報告"
      title="學力檢測分析報告"
      info={[
        { label: "年度", value: year },
        { label: "年級", value: gradeName },
        { label: "姓名", value: student },
      ]}
      footer={<><span>{subjectName}</span><span>學力檢測分析報告版權屬於{school.zh} ©</span></>}
      setRef={setRef}
    >
      <div style={{ padding: "0 48px", display: "flex", flexDirection: "column", flex: 1, gap: 14, minHeight: 0 }}>
        {/* 科目＋總分 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: -4 }}>
          <span style={{ padding: "3px 14px", border: `1.5px solid ${C.accent}`, background: C.accent, color: C.paper, fontSize: 15, fontWeight: 700, letterSpacing: ".06em" }}>{subjectName}</span>
          <span style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".18em", color: C.muted, fontFamily: "monospace" }}>總分</span>
          <span style={{ fontSize: 40, fontWeight: 900, color: C.accent, fontFamily: "monospace", lineHeight: 1 }}>{r.score}</span>
        </div>

        {/* 五力指標 */}
        <section>
          <SectionHeading>五力指標</SectionHeading>
          <p style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.75, margin: "0 0 8px" }}>
            「五力檢測」旨在全面評估學生在各學科的核心能力表現。除了檢視各單元的學習成效外，更著重於分析學生在解題過程中所展現的各項關鍵能力。本報告將詳細呈現各項指標的達成狀況，幫助學生精準掌握自身的優勢與弱點。建議同學可根據報告中的分析結果，調整未來的學習策略與時間分配，打造最適合自己的專屬複習計畫。
          </p>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ flexShrink: 0, marginLeft: -30 }} dangerouslySetInnerHTML={{ __html: svg }} />
            <table style={{ flex: 1, borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: `1.5px solid ${C.ink}` }}><th style={{ ...th, width: "36%" }}>五力指標</th><th style={th}>說明</th></tr></thead>
              <tbody>{r.abilityRows.map(a => (
                <tr key={a.ability}>
                  <td style={{ ...td, fontWeight: 700 }}>{a.ability}</td>
                  <td style={{ ...td, color: C.inkSoft, fontSize: 10.5, lineHeight: 1.55 }}>{a.description}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </section>

        {/* 知識向度 */}
        <section>
          <SectionHeading>知識向度</SectionHeading>
          <p style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.75, margin: "0 0 8px" }}>
            「知識向度」顯示出各科在各冊各單元的通過狀況。依照各主題的答對狀況，可以找出自己需要強化的單元。
          </p>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div style={{ flexShrink: 0 }}>
              <SectionLabel>各單元答對率分析</SectionLabel>
              <div dangerouslySetInnerHTML={{ __html: bar }} />
            </div>
            <table style={{ flex: 1, borderCollapse: "collapse", textAlign: "center" }}>
              <thead><tr style={{ borderBottom: `1.5px solid ${C.ink}` }}>
                <th style={th}>單元出處</th><th style={{ ...th, textAlign: "center" }}>答對題數</th><th style={{ ...th, textAlign: "center" }}>答錯題數</th>
              </tr></thead>
              <tbody>
                {r.barData.map(b => (
                  <tr key={b.name}>
                    <td style={{ ...td, textAlign: "left" }}>{b.name}</td>
                    <td style={{ ...td, fontFamily: "monospace" }}>{b.correctCount || ""}</td>
                    <td style={{ ...td, fontFamily: "monospace", color: C.accent }}>{b.incorrectCount || ""}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: `1.5px solid ${C.ink}` }}>
                  <td style={{ ...td, textAlign: "left", fontWeight: 700 }}>總計</td>
                  <td style={{ ...td, fontFamily: "monospace", fontWeight: 700 }}>{r.correctCount}</td>
                  <td style={{ ...td, fontFamily: "monospace", fontWeight: 700, color: C.accent }}>{r.total - r.correctCount}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ReportFrame>
  );
}
