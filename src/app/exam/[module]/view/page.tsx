"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSchoolInfo } from "@/lib/branches";
import { getModule, ModuleSpec, StudentInfo } from "@/exams/spec";
import { getAnswers, getStudents, AnswerRow } from "@/exams/store";
import { buildReportPages } from "@/exams/reports";
import { capturePages } from "@/exams/ui/pdf";
import { BranchGate } from "@/exams/ui/BranchGate";
import { PaperPage, Loading, ErrorLine } from "@/exams/ui/Paper";
import { C, SERIF } from "@/exams/ui/theme";

// 預覽即列印頁：畫面上顯示的 A4 頁面就是 PDF 截圖的來源，確保所見即所得
function ViewReport({ spec, branch }: { spec: ModuleSpec; branch: string }) {
  const params = useSearchParams();
  const exam = params.get("exam") ?? "";
  const student = params.get("student") ?? "";
  const school = getSchoolInfo(branch);
  const examName = spec.exams.find(e => e.key === exam)?.name ?? exam;
  const rosterUrl = `/exam/${spec.id}?${new URLSearchParams({ exam })}`;

  const [data, setData] = useState<{ info: StudentInfo; answers: Record<string, AnswerRow> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getStudents(spec.id, exam, branch), getAnswers(spec.id, exam, branch, student)])
      .then(([list, map]) => {
        if (cancelled) return;
        setData({ info: list.find(s => s.student === student)?.info ?? {}, answers: map[student] ?? {} });
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : "載入失敗"); });
    return () => { cancelled = true; };
  }, [spec.id, exam, branch, student]);

  const pages = data ? buildReportPages(spec.id, { exam, student, branch, info: data.info, answers: data.answers, school }) : [];

  async function downloadPdf() {
    setExporting(true);
    try {
      const pdf = await capturePages(null, refs.current.slice(0, pages.length).filter((el): el is HTMLDivElement => !!el));
      pdf.save(`${student}_${examName}_${spec.title}.pdf`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF 產生失敗");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ background: C.pageBg, minHeight: "100vh", padding: "32px 16px 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 830 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
          <a href={rosterUrl} style={{ padding: "7px 16px", border: `1.5px solid ${C.ink}`, fontSize: 12, color: C.ink, textDecoration: "none", fontFamily: SERIF, fontWeight: 600, letterSpacing: ".04em" }}>← 返回名冊</a>
          <span className="mono" style={{ fontSize: 11, color: C.inkSoft, letterSpacing: ".08em" }}>{student}　{branch}　{examName}</span>
          <button onClick={downloadPdf} disabled={exporting || pages.length === 0} className="serif"
            style={{ marginLeft: "auto", padding: "7px 24px", border: `1.5px solid ${C.ink}`, background: C.ink, fontSize: 12, fontWeight: 600, color: C.paper, cursor: exporting ? "wait" : "pointer", letterSpacing: ".06em", opacity: exporting || pages.length === 0 ? 0.6 : 1 }}>
            {exporting ? "產生中…" : "下載 PDF"}
          </button>
        </div>

        {error && <PaperPage maxWidth={830}><ErrorLine text={error} /></PaperPage>}
        {!error && !data && <Loading />}
        {data && pages.length === 0 && (
          <div className="serif" style={{ padding: 40, textAlign: "center", color: C.muted }}>此學生尚未登記任何科目成績</div>
        )}
        <div style={{ overflowX: "auto" }}>
          {pages.map((p, i) => (
            <div key={p.key} style={{ width: 794, margin: "0 auto 24px", boxShadow: "0 30px 70px -30px rgba(35,32,26,.5)", border: `1.5px solid ${C.ink}` }}>
              {p.render(el => { refs.current[i] = el; })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Page() {
  const params = useParams<{ module: string }>();
  const spec = getModule(params.module);
  if (!spec) return <PaperPage maxWidth={480}><div style={{ padding: 40, textAlign: "center" }}><a href="/" style={{ color: C.accent }}>找不到此系統，返回主選單</a></div></PaperPage>;
  return <BranchGate moduleId={spec.id} title={spec.title}>{branch => <ViewReport spec={spec} branch={branch} />}</BranchGate>;
}

export default function ExamViewPage() {
  return <Suspense><Page /></Suspense>;
}
