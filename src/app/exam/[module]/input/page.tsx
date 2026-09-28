"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getModule, ModuleSpec, InputSpec, validateAnswers } from "@/exams/spec";
import { getAnswers, saveAnswers } from "@/exams/store";
import { BranchGate } from "@/exams/ui/BranchGate";
import { PaperPage, DoubleRule, Loading, ErrorLine } from "@/exams/ui/Paper";
import { C } from "@/exams/ui/theme";

// 選項字母輸入（輸入 A～E 後自動跳下一格，與原系統相同）
function LetterGrid({ spec, values, onChange }: { spec: InputSpec; values: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const letters = spec.letters ?? "";

  function handle(i: number, raw: string) {
    const v = raw.toUpperCase().replace(new RegExp(`[^${letters}]`, "g"), "").slice(-1);
    const next = [...values]; next[i] = v; onChange(next);
    if (v) refs.current[i + 1]?.focus();
  }
  function keyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !values[i] && i > 0) { refs.current[i - 1]?.focus(); }
  }

  return (
    <div style={{ padding: "16px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))", gap: "10px 14px" }}>
      {values.map((v, i) => (
        <label key={i} title={spec.hints?.[i] ?? ""} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ fontSize: 11, color: C.muted, minWidth: 30, textAlign: "right" }}>{String(i + 1).padStart(2, "0")}</span>
          <input ref={el => { refs.current[i] = el; }} value={v} onChange={e => handle(i, e.target.value)} onKeyDown={e => keyDown(i, e)}
            onFocus={e => e.target.select()} inputMode="text" autoComplete="off" maxLength={2} placeholder={letters[0] + "～" + letters[letters.length - 1]}
            style={{ width: 52, padding: "5px 0", textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600, color: C.ink,
              background: v ? "transparent" : "rgba(176,64,44,.05)", border: `1.5px solid ${v ? C.ink : C.rule}`, outline: "none" }} />
        </label>
      ))}
    </div>
  );
}

// 逐題點選答對／答錯（與 FIVE 填分頁相同操作）
function BoolList({ values, onChange }: { values: boolean[]; onChange: (v: boolean[]) => void }) {
  return (
    <div>
      {values.map((ok, i) => (
        <div key={i} onClick={() => { const n = [...values]; n[i] = !n[i]; onChange(n); }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 40px", borderBottom: `1px solid ${C.ruleLight}`, cursor: "pointer", background: ok ? "transparent" : "rgba(176,64,44,.04)" }}>
          <span className="mono" style={{ fontSize: 12, color: C.muted }}>第 {String(i + 1).padStart(2, "0")} 題</span>
          <span style={{ padding: "3px 14px", border: `1px solid ${ok ? C.ink : C.accent}`, color: ok ? C.ink : C.accent, fontSize: 12, fontWeight: 600, letterSpacing: ".06em", userSelect: "none" }}>
            {ok ? "✓ 答對" : "✗ 答錯"}
          </span>
        </div>
      ))}
    </div>
  );
}

function InputForm({ spec, branch }: { spec: ModuleSpec; branch: string }) {
  const params = useSearchParams();
  const exam = params.get("exam") ?? "";
  const student = params.get("student") ?? "";
  const subject = params.get("subject") ?? "";
  const input = spec.input(exam, subject);
  const subjects = spec.subjects(exam);
  const examName = spec.exams.find(e => e.key === exam)?.name ?? exam;
  const rosterUrl = `/exam/${spec.id}?${new URLSearchParams({ exam })}`;

  const [letters, setLetters] = useState<string[]>([]);
  const [bools, setBools] = useState<boolean[]>([]);
  const [nonChoice, setNonChoice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!input) return;
    let cancelled = false;
    setLoaded(false);
    getAnswers(spec.id, exam, branch, student).then(map => {
      if (cancelled) return;
      const row = map[student]?.[subject];
      if (input.kind === "letter") setLetters(row ? (row.answers as string[]) : Array(input.count).fill(""));
      else setBools(row ? (row.answers as boolean[]) : Array(input.count).fill(true));
      setNonChoice(typeof row?.extra?.nonChoice === "number" ? String(row.extra.nonChoice) : "");
      setLoaded(true);
    }).catch(e => { if (!cancelled) setLoadError(e instanceof Error ? e.message : "載入失敗"); });
    return () => { cancelled = true; };
  }, [spec.id, exam, branch, student, subject]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!input) {
    return <PaperPage maxWidth={720}><ErrorLine text="網址參數錯誤" /><div style={{ padding: "0 44px 30px" }}><a href={rosterUrl} style={{ color: C.accent }}>返回名冊</a></div></PaperPage>;
  }

  const answers = input.kind === "letter" ? letters : bools;
  const extra = input.nonChoice ? { nonChoice: nonChoice.trim() === "" ? NaN : Number(nonChoice) } : {};
  const filled = input.kind === "letter" ? letters.filter(Boolean).length : bools.length;
  const correct = input.kind === "bool" ? bools.filter(Boolean).length : null;

  async function handleSave(): Promise<boolean> {
    const err = validateAnswers(input!, answers, extra);
    if (err) { setSaveError(err); setSaved(false); return false; }
    setSaving(true); setSaveError(null);
    try {
      await saveAnswers(spec.id, exam, branch, student, subject, answers, extra);
      setSaved(true); setDirty(false);
      return true;
    } catch (e) {
      setSaved(false);
      setSaveError(e instanceof Error ? e.message : "儲存失敗，請檢查網路連線後重試");
      return false;
    } finally {
      setSaving(false);
    }
  }

  // 導向其他頁一律整頁重新載入，避免顯示過期的完成度（沿用 FIVE 的做法）
  function go(url: string) {
    if (dirty && !confirm("本科作答尚未儲存，確定要離開嗎？")) return;
    window.location.href = url;
  }
  async function saveAndBack() { if (await handleSave()) window.location.href = rosterUrl; }
  const subjUrl = (s: string) => `/exam/${spec.id}/input?${new URLSearchParams({ exam, student, subject: s })}`;
  const idx = subjects.findIndex(s => s.key === subject);
  const next = subjects[idx + 1];

  return (
    <PaperPage maxWidth={760}>
      <div style={{ padding: "24px 40px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".28em", color: C.muted }}>SCORE ENTRY · 成績填入　{spec.title}</div>
          <div className="serif" style={{ fontWeight: 700, fontSize: 22, color: C.ink, marginTop: 4, letterSpacing: ".04em" }}>{student}</div>
          <div className="mono" style={{ fontSize: 10, color: C.inkSoft, marginTop: 3, letterSpacing: ".1em" }}>{branch}　{examName}</div>
        </div>
        <button onClick={() => go(rosterUrl)} style={{ background: "transparent", border: `1px solid ${C.rule}`, padding: "5px 12px", cursor: "pointer" }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: C.inkSoft }}>← 返回名冊</span>
        </button>
      </div>
      <DoubleRule margin="16px 40px 0" />

      <div style={{ padding: "0 40px", borderBottom: `1px solid ${C.rule}`, display: "flex", marginTop: 14, flexWrap: "wrap" }}>
        {subjects.map(s => (
          <button key={s.key} onClick={() => s.key !== subject && go(subjUrl(s.key))} className="serif"
            style={{ padding: "6px 18px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, letterSpacing: ".04em", background: s.key === subject ? C.ink : "transparent", color: s.key === subject ? C.paper : C.muted }}>
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ padding: "10px 40px", borderBottom: `1px solid ${C.ruleLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="mono" style={{ fontSize: 9, letterSpacing: ".2em", color: C.muted }}>
          {input.kind === "letter" ? `輸入 ${input.letters!.split("").join("/")} 後自動跳格` : "每題作答結果 · 點擊切換"}
        </span>
        <span className="mono" style={{ fontSize: 11, color: C.inkSoft }}>
          {correct === null
            ? <>已填 <span style={{ color: C.accent, fontWeight: 600 }}>{filled}</span> / {input.count} 題</>
            : <>答對 <span style={{ color: C.accent, fontWeight: 600 }}>{correct}</span> / {input.count} 題</>}
        </span>
      </div>

      {loadError ? <ErrorLine text={loadError} /> : !loaded ? <Loading /> : (
        <>
          {input.nonChoice && (
            <div style={{ padding: "14px 40px 0", display: "flex", alignItems: "center", gap: 12 }}>
              <span className="serif" style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{input.nonChoice.label}</span>
              <input type="number" min={input.nonChoice.min} max={input.nonChoice.max} step={1} value={nonChoice}
                onChange={e => { setNonChoice(e.target.value); setDirty(true); setSaved(false); }}
                placeholder={`${input.nonChoice.min}～${input.nonChoice.max}`}
                style={{ width: 80, padding: "5px 8px", fontFamily: "'JetBrains Mono', monospace", fontSize: 15, border: `1.5px solid ${C.ink}`, background: "transparent", color: C.ink }} />
              <span className="mono" style={{ fontSize: 10, color: C.muted }}>（{input.nonChoice.min}～{input.nonChoice.max} 的整數）</span>
            </div>
          )}
          {input.kind === "letter"
            ? <LetterGrid spec={input} values={letters} onChange={v => { setLetters(v); setDirty(true); setSaved(false); }} />
            : <BoolList values={bools} onChange={v => { setBools(v); setDirty(true); setSaved(false); }} />}
        </>
      )}

      <div style={{ padding: "18px 40px 26px", display: "flex", gap: 12, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
        {saveError && <span className="mono" style={{ fontSize: 10, letterSpacing: ".06em", color: C.accent }}>⚠ {saveError}</span>}
        {!saveError && saved && <span className="mono" style={{ fontSize: 10, letterSpacing: ".12em", color: C.inkSoft }}>已儲存 ✓</span>}
        <button onClick={handleSave} disabled={!loaded || saving} className="serif" style={{ padding: "8px 20px", border: `1.5px solid ${C.ink}`, background: "transparent", fontSize: 13, fontWeight: 600, color: C.ink, cursor: loaded && !saving ? "pointer" : "not-allowed", opacity: loaded && !saving ? 1 : 0.5 }}>
          {saving ? "儲存中…" : "儲存"}
        </button>
        {next && (
          <button onClick={async () => { if (await handleSave()) window.location.href = subjUrl(next.key); }} disabled={!loaded || saving} className="serif"
            style={{ padding: "8px 20px", border: `1.5px solid ${C.ink}`, background: "transparent", fontSize: 13, fontWeight: 600, color: C.ink, cursor: loaded && !saving ? "pointer" : "not-allowed", opacity: loaded && !saving ? 1 : 0.5 }}>
            儲存並前往{next.name} →
          </button>
        )}
        <button onClick={saveAndBack} disabled={!loaded || saving} className="serif" style={{ padding: "8px 24px", border: `1.5px solid ${C.ink}`, background: C.ink, fontSize: 13, fontWeight: 600, color: C.paper, cursor: loaded && !saving ? "pointer" : "not-allowed", opacity: loaded && !saving ? 1 : 0.5 }}>
          {saving ? "儲存中…" : "儲存並返回名冊"}
        </button>
      </div>
    </PaperPage>
  );
}

function Page() {
  const params = useParams<{ module: string }>();
  const spec = getModule(params.module);
  if (!spec) return <PaperPage maxWidth={480}><div style={{ padding: 40, textAlign: "center" }}><a href="/" style={{ color: C.accent }}>找不到此系統，返回主選單</a></div></PaperPage>;
  return <BranchGate moduleId={spec.id} title={spec.title}>{branch => <InputForm spec={spec} branch={branch} />}</BranchGate>;
}

export default function ExamInputPage() {
  return <Suspense><Page /></Suspense>;
}
