"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getSchoolInfo } from "@/lib/branches";
import { getModule, ModuleSpec, StudentInfo } from "@/exams/spec";
import { getStudents, getAnswers, saveStudent, removeStudent, StudentRow, AnswerMap } from "@/exams/store";
import { buildReportPages } from "@/exams/reports";
import { capturePages } from "@/exams/ui/pdf";
import { BranchGate } from "@/exams/ui/BranchGate";
import { PaperPage, DoubleRule, Loading, ErrorLine } from "@/exams/ui/Paper";
import { C, SERIF } from "@/exams/ui/theme";

const examKey = (module: string) => `examSelected_v1_${module}`;
const today = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD

function StudentForm({ spec, initialName, initialInfo, lockName, onSubmit, onCancel }: {
  spec: ModuleSpec; initialName: string; initialInfo: StudentInfo; lockName: boolean;
  onSubmit: (name: string, info: StudentInfo) => Promise<void>; onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [info, setInfo] = useState<StudentInfo>(() => {
    const init = { ...initialInfo };
    for (const f of spec.studentFields) if (f.key === "examDate" && !init.examDate) init.examDate = today();
    return init;
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) { setErr("請輸入姓名"); return; }
    const missing = spec.studentFields.find(f => f.required && !(info[f.key] ?? "").trim());
    if (missing) { setErr(`請輸入${missing.label}`); return; }
    setBusy(true); setErr(null);
    try { await onSubmit(name.trim(), info); } catch (e) { setErr(e instanceof Error ? e.message : "儲存失敗"); setBusy(false); }
  }

  const input = { background: "transparent", border: "none", borderBottom: `1.5px solid ${C.ink}`, padding: "3px 0", fontFamily: SERIF, fontSize: 15, color: C.ink, outline: "none", minWidth: 130 };
  return (
    <div style={{ padding: "14px 44px", background: C.paperLight, borderBottom: `1px solid ${C.rule}`, display: "flex", alignItems: "flex-end", gap: 18, flexWrap: "wrap" }}>
      <label>
        <div className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: C.muted, marginBottom: 4 }}>學生姓名</div>
        <input value={name} disabled={lockName} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} autoFocus={!lockName} placeholder="輸入姓名…" style={{ ...input, opacity: lockName ? 0.6 : 1 }} />
      </label>
      {spec.studentFields.map(f => (
        <label key={f.key}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: C.muted, marginBottom: 4 }}>{f.label}{f.required ? "" : "（選填）"}</div>
          <input type={f.key === "examDate" ? "date" : "text"} value={info[f.key] ?? ""} placeholder={f.placeholder}
            onChange={e => setInfo(prev => ({ ...prev, [f.key]: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()} style={input} />
        </label>
      ))}
      <button onClick={submit} disabled={busy} className="serif" style={{ padding: "5px 16px", background: C.ink, color: C.paper, border: "none", fontSize: 13, fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>
        {busy ? "儲存中…" : lockName ? "儲存" : "確認新增"}
      </button>
      <button onClick={onCancel} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 13, cursor: "pointer" }}>取消</button>
      {err && <span className="mono" style={{ fontSize: 10, color: C.accent }}>⚠ {err}</span>}
    </div>
  );
}

function Roster({ spec, branch, onChangeBranch }: { spec: ModuleSpec; branch: string; onChangeBranch: () => void }) {
  const params = useSearchParams();
  const school = getSchoolInfo(branch);
  const [exam, setExam] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; info: StudentInfo; edit: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [exportStudent, setExportStudent] = useState<StudentRow | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const bulkRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 決定目前考卷：網址 > 上次選擇 > 第一個
  useEffect(() => {
    const valid = (k: string | null) => (k && spec.exams.some(e => e.key === k) ? k : null);
    const chosen = valid(params.get("exam")) ?? valid(localStorage.getItem(examKey(spec.id))) ?? spec.exams[0].key;
    localStorage.setItem(examKey(spec.id), chosen);
    setExam(chosen);
  }, [params, spec]);

  async function loadData(ex: string) {
    setLoading(true); setLoadError(null);
    try {
      const [list, ans] = await Promise.all([getStudents(spec.id, ex, branch), getAnswers(spec.id, ex, branch)]);
      setStudents(list); setAnswers(ans);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { if (exam) loadData(exam); }, [exam, branch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!exam) return <PaperPage maxWidth={960}><Loading /></PaperPage>;

  const subjects = spec.subjects(exam);
  const q = (extra: Record<string, string>) => new URLSearchParams({ exam, ...extra }).toString();

  async function handleSubmit(name: string, info: StudentInfo) {
    if (!form?.edit && students.some(s => s.student === name)) throw new Error("此學生已在名冊中");
    await saveStudent(spec.id, exam!, branch, name, info);
    setForm(null);
    await loadData(exam!);
  }

  async function handleRemove(name: string) {
    if (!confirm(`確定刪除「${name}」在「${spec.exams.find(e => e.key === exam)?.name}」的所有成績資料？`)) return;
    try { await removeStudent(spec.id, exam!, branch, name); } catch (e) { alert(e instanceof Error ? e.message : "刪除失敗"); }
    await loadData(exam!);
  }

  async function bulkDownloadPdf() {
    const withData = students.filter(s => answers[s.student] && Object.keys(answers[s.student]).length > 0);
    if (withData.length === 0 || exporting) return;
    setExporting(true); setExportError(null);
    setExportProgress({ current: 0, total: withData.length });
    try {
      const { flushSync } = await import("react-dom");
      let pdf: import("jspdf").jsPDF | null = null;
      for (let i = 0; i < withData.length; i++) {
        bulkRefs.current = [];
        flushSync(() => setExportStudent(withData[i]));
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        pdf = await capturePages(pdf, bulkRefs.current.filter((el): el is HTMLDivElement => !!el));
        setExportProgress({ current: i + 1, total: withData.length });
      }
      const examName = spec.exams.find(e => e.key === exam)?.name ?? exam;
      pdf?.save(`${branch}_${examName}_全體成績單.pdf`);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF 產生失敗");
    } finally {
      setExporting(false); setExportStudent(null);
    }
  }

  const exportPages = exportStudent
    ? buildReportPages(spec.id, { exam, student: exportStudent.student, branch, info: exportStudent.info, answers: answers[exportStudent.student] ?? {}, school })
    : [];
  const grid = `minmax(120px,1.4fr) repeat(${subjects.length}, minmax(52px,1fr)) 180px`;

  return (
    <PaperPage maxWidth={960} footer={branch}>
      {/* 標頭 */}
      <div style={{ padding: "28px 44px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 44, height: 44, border: `1.5px solid ${C.accent}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, marginTop: 2, flexShrink: 0 }}>
            <span className="serif" style={{ fontWeight: 900, fontSize: 20 }}>{school.char}</span>
          </div>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: ".34em", color: C.muted }}>{school.zh}　名冊管理</div>
            <div className="serif" style={{ fontWeight: 700, fontSize: 26, letterSpacing: ".04em", color: C.ink, marginTop: 4, lineHeight: 1.1 }}>{spec.title}</div>
            <div className="serif" style={{ fontSize: 12, color: C.inkSoft, marginTop: 3 }}>{branch}　逐科登記作答・完成後輸出報告</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", marginTop: 2 }}>
          <a href="/" style={{ textDecoration: "none", border: `1px solid ${C.rule}`, padding: "5px 12px" }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: C.inkSoft }}>← 返回選單</span>
          </a>
          <button onClick={onChangeBranch} style={{ background: "transparent", border: `1px solid ${C.rule}`, padding: "5px 12px", cursor: "pointer" }}>
            <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: C.muted }}>切換分校</span>
          </button>
        </div>
      </div>

      <DoubleRule />

      {/* 考卷選擇 */}
      <div style={{ padding: "14px 44px 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: C.muted }}>{spec.examLabel}</span>
        {spec.exams.map(e => (
          <a key={e.key} href={`/exam/${spec.id}?${new URLSearchParams({ exam: e.key })}`} className="serif"
            style={{
              padding: "5px 14px", textDecoration: "none", fontSize: 13, fontWeight: 600, letterSpacing: ".04em",
              border: `1.5px solid ${e.key === exam ? C.ink : C.rule}`,
              background: e.key === exam ? C.ink : "transparent", color: e.key === exam ? C.paper : C.inkSoft,
            }}>
            {e.name}
          </a>
        ))}
      </div>

      {/* 工具列 */}
      <div style={{ padding: "16px 44px", borderBottom: `1px solid ${C.rule}`, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
        {exporting && <span className="mono" style={{ fontSize: 10, letterSpacing: ".1em", color: C.muted, marginRight: "auto" }}>產生中… {exportProgress.current}/{exportProgress.total} 位學生</span>}
        {exportError && <span className="mono" style={{ fontSize: 10, color: C.accent, marginRight: "auto" }}>⚠ {exportError}</span>}
        <button onClick={bulkDownloadPdf} disabled={exporting || loading} className="serif"
          style={{ padding: "7px 20px", background: C.accent, color: C.paper, border: "none", fontSize: 13, fontWeight: 600, cursor: exporting ? "not-allowed" : "pointer", letterSpacing: ".06em", opacity: exporting || loading ? 0.5 : 1 }}>
          {exporting ? "產生中…" : "下載全體 PDF"}
        </button>
        <button onClick={() => setForm({ name: "", info: {}, edit: false })} className="serif"
          style={{ padding: "7px 20px", background: C.ink, color: C.paper, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: ".06em" }}>
          ＋ 新增學生
        </button>
      </div>

      {form && (
        <StudentForm key={form.name || "new"} spec={spec} initialName={form.name} initialInfo={form.info} lockName={form.edit}
          onSubmit={handleSubmit} onCancel={() => setForm(null)} />
      )}

      {/* 隱藏列印頁（批次下載時逐位截圖） */}
      {exportStudent && (
        <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none", overflow: "hidden" }}>
          {exportPages.map((p, i) => <div key={p.key}>{p.render(el => { bulkRefs.current[i] = el; })}</div>)}
        </div>
      )}

      {loadError && <ErrorLine text={`${loadError}（請確認網路，或重新整理頁面）`} />}
      {loading && <Loading />}
      {!loading && !loadError && students.length === 0 && (
        <div style={{ padding: "40px 44px", textAlign: "center" }}>
          <div className="serif" style={{ color: C.muted, fontSize: 14 }}>尚無學生資料，請點擊「新增學生」</div>
        </div>
      )}

      {!loading && students.length > 0 && (
        <div style={{ padding: "0 44px 32px", overflowX: "auto" }}>
          <div style={{ minWidth: 560 }}>
            <div style={{ display: "grid", gridTemplateColumns: grid, borderBottom: `1.5px solid ${C.ink}`, paddingTop: 20, paddingBottom: 8 }}>
              <div className="mono" style={{ fontSize: 9, letterSpacing: ".15em", color: C.muted }}>姓名</div>
              {subjects.map(s => <div key={s.key} className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: C.muted, textAlign: "center" }}>{s.name}</div>)}
              <div />
            </div>
            {students.map((row, si) => {
              const ans = answers[row.student] ?? {};
              const filledCount = subjects.filter(s => ans[s.key]).length;
              const done = filledCount === subjects.length;
              const extraInfo = spec.studentFields.map(f => row.info[f.key]).filter(Boolean).join("・");
              return (
                <div key={row.student} style={{ display: "grid", gridTemplateColumns: grid, borderBottom: `1px solid ${C.ruleLight}`, alignItems: "center", padding: "9px 0", background: si % 2 ? "rgba(0,0,0,.015)" : "transparent" }}>
                  <div>
                    <div className="serif" style={{ fontSize: 14, color: C.ink, fontWeight: done ? 700 : 400 }}>
                      {done && <span style={{ color: C.accent, marginRight: 4 }}>✓</span>}{row.student}
                    </div>
                    {extraInfo && <div className="mono" style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{extraInfo}</div>}
                  </div>
                  {subjects.map(s => {
                    const filled = !!ans[s.key];
                    return (
                      <div key={s.key} style={{ display: "flex", justifyContent: "center" }}>
                        <a href={`/exam/${spec.id}/input?${q({ student: row.student, subject: s.key })}`} title={`${row.student} ${s.name}：${filled ? "已登記（點擊修改）" : "未登記（點擊填入）"}`}
                          style={{ width: 22, height: 18, display: "flex", alignItems: "center", justifyContent: "center", background: filled ? C.accent : C.ruleLight, border: `1px solid ${filled ? C.accent : C.rule}`, textDecoration: "none", fontSize: 10, color: filled ? C.paper : C.muted, fontFamily: "monospace" }}>
                          {filled ? "✓" : "＋"}
                        </a>
                      </div>
                    );
                  })}
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    {filledCount > 0
                      ? <a href={`/exam/${spec.id}/view?${q({ student: row.student })}`} style={{ padding: "4px 10px", background: done ? C.accent : C.muted, color: C.paper, textDecoration: "none", fontSize: 11, fontFamily: SERIF, fontWeight: 600, letterSpacing: ".04em" }}>出報告</a>
                      : <span style={{ padding: "4px 10px", background: C.ruleLight, color: C.muted, fontSize: 11, fontFamily: SERIF }}>出報告</span>}
                    <button onClick={() => setForm({ name: row.student, info: row.info, edit: true })} style={{ background: "transparent", border: `1px solid ${C.rule}`, padding: "4px 8px", fontSize: 11, color: C.inkSoft, cursor: "pointer" }}>編輯</button>
                    <button onClick={() => handleRemove(row.student)} style={{ background: "transparent", border: `1px solid ${C.rule}`, padding: "4px 8px", fontSize: 11, color: C.muted, cursor: "pointer" }}>刪除</button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ paddingTop: 14, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, background: C.accent }} /><span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: C.muted }}>已登記</span></span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 14, height: 14, background: C.ruleLight, border: `1px solid ${C.rule}` }} /><span className="mono" style={{ fontSize: 9, letterSpacing: ".12em", color: C.muted }}>未登記（點擊填入）</span></span>
            <span className="mono" style={{ marginLeft: "auto", fontSize: 9, letterSpacing: ".12em", color: C.muted }}>全科登記完成後「出報告」變為磚紅色</span>
          </div>
        </div>
      )}
    </PaperPage>
  );
}

function Hub() {
  const params = useParams<{ module: string }>();
  const spec = getModule(params.module);
  if (!spec) {
    return <PaperPage maxWidth={480}><div style={{ padding: 40, textAlign: "center" }}><a href="/" className="serif" style={{ color: C.accent }}>找不到此系統，返回主選單</a></div></PaperPage>;
  }
  return <BranchGate moduleId={spec.id} title={spec.title}>{(branch, change) => <Roster spec={spec} branch={branch} onChangeBranch={change} />}</BranchGate>;
}

export default function ExamHubPage() {
  return <Suspense><Hub /></Suspense>;
}
