import { ReportFrame, SectionLabel } from "../ui/ReportFrame";
import { C } from "../ui/theme";
import { radarSvg } from "../ui/charts";
import { analyzeBasic, ebSubjectData, EB_SUBJECTS, EB_CHART_TITLE } from "./scoring";
import type { ReportBookProps } from "../reports";

// 國小學科能力檢測：三科同一頁（與原 Excel 成績單相同）。每科內容：
// ▶ 科目標題、五項能力說明、能力雷達圖（軸標籤取自原「資料區」）、綜合能力等級條（7 格）＋等級＋排名。
export function ElementaryBasicPage({ exam, student, info, branch, answers, school, setRef }: ReportBookProps) {
  return (
    <ReportFrame
      school={school}
      kicker="學科能力檢測"
      title="學科能力檢測成績單"
      info={[
        { label: "姓名", value: student },
        { label: "就讀小學", value: info.school ?? "" },
        { label: "應試分校", value: branch },
        { label: "應試日期", value: info.examDate ?? "" },
      ]}
      setRef={setRef}
    >
      <div style={{ padding: "0 48px 22px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between", minHeight: 0 }}>
        {EB_SUBJECTS.map(subject => {
          const d = ebSubjectData(exam, subject)!;
          const ans = answers[subject]?.answers as boolean[] | undefined;
          const r = ans ? analyzeBasic(exam, subject, ans) : null;
          const svg = r ? radarSvg(r.dimensions.map(x => ({ indicator: x.label, percent: x.value * 100 })), 200) : "";
          return (
            <div key={subject} style={{ borderTop: `1px solid ${C.rule}`, paddingTop: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                <span style={{ color: C.accent, fontSize: 13 }}>▶</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: C.ink, letterSpacing: ".06em" }}>{d.section}</span>
                {!r && <span style={{ fontSize: 10, color: C.rule, fontFamily: "monospace", marginLeft: 8 }}>尚未登記</span>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  {d.descriptions.map(x => (
                    <div key={x.name} style={{ fontSize: 11.5, color: C.inkSoft, lineHeight: 1.55, marginBottom: 7 }}>
                      <b style={{ color: C.ink }}>{x.name}</b>：{x.text}
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.ink, letterSpacing: ".06em", whiteSpace: "nowrap" }}>綜合能力</span>
                    <div style={{ display: "flex", gap: 2 }}>
                      {(r?.bar ?? [0, 0, 0, 0, 0, 0, 0]).map((on, i) => (
                        <div key={i} style={{ width: 20, height: 12, background: on ? C.accent : C.ruleLight, border: `1px solid ${on ? C.accent : C.rule}` }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 900, color: C.accent, fontFamily: "monospace", minWidth: 40 }}>{r?.grade ?? "—"}</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: C.inkSoft, whiteSpace: "nowrap" }}>排名：<b style={{ fontFamily: "monospace", color: C.ink, fontSize: 14 }}>{r?.rank ?? "—"}</b></span>
                  </div>
                </div>
                <div style={{ flexShrink: 0, width: 320, textAlign: "center", marginTop: -30 }}>
                  <SectionLabel style={{ marginBottom: 2, fontSize: 9 }}>{EB_CHART_TITLE[subject]}</SectionLabel>
                  {r
                    ? <div style={{ margin: "0 -30px" }} dangerouslySetInnerHTML={{ __html: svg }} />
                    : <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.rule, fontFamily: "monospace" }}>— 無資料 —</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ReportFrame>
  );
}
