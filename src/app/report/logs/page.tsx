"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_BRANCHES } from "@/lib/branches";

const KEY_STORAGE = "reportLogKey_v1";

interface LogRow {
  id: number;
  created_at: string;
  branch: string | null;
  student: string | null;
  action: string;
  ok: boolean;
  detail: Record<string, unknown> | null;
  user_agent: string | null;
}

const ACTION_LABEL: Record<string, string> = {
  save_answer: "儲存成績",
  save_answer_client_error: "儲存（網路中斷）",
  add_student: "新增學生",
  remove_student: "刪除學生",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function detailText(row: LogRow): string {
  const d = row.detail ?? {};
  const parts: string[] = [];
  if (d.subject) parts.push(String(d.subject) + "科");
  if (d.week) parts.push(String(d.week));
  if (typeof d.correct === "number" && typeof d.total === "number") parts.push(`答對 ${d.correct}/${d.total}`);
  if (d.error) parts.push(`錯誤：${d.error}`);
  return parts.join("　") || "—";
}

export default function LogsPage() {
  const [key, setKey] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [branch, setBranch] = useState("");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState<"" | "ok" | "fail">("");
  const [days, setDays] = useState(14);
  const [studentFilter, setStudentFilter] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY_STORAGE);
    if (saved) setKey(saved);
  }, []);

  async function loadLogs(k: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ key: k, days: String(days) });
      if (branch) params.set("branch", branch);
      if (action) params.set("action", action);
      const res = await fetch(`/api/report/logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "讀取失敗");
        if (res.status === 401) { sessionStorage.removeItem(KEY_STORAGE); setKey(null); }
        return;
      }
      setLogs(data.logs ?? []);
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (key) loadLogs(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, branch, action, days]);

  function handleUnlock() {
    if (!keyInput.trim()) return;
    sessionStorage.setItem(KEY_STORAGE, keyInput.trim());
    setKey(keyInput.trim());
  }

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (status === "ok" && !l.ok) return false;
      if (status === "fail" && l.ok) return false;
      if (studentFilter && !(l.student ?? "").includes(studentFilter)) return false;
      return true;
    });
  }, [logs, status, studentFilter]);

  const failCount = useMemo(() => logs.filter(l => !l.ok).length, [logs]);

  if (!key) {
    return (
      <div style={{ background: "#ddd3bd", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "#f2ecdd", border: "1.5px solid #23201a", padding: "36px 40px", width: "100%", maxWidth: 380 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: ".28em", color: "#9a917c", marginBottom: 8 }}>DEBUG · 偵錯黑盒子</div>
          <div className="serif" style={{ fontWeight: 700, fontSize: 20, color: "#23201a", marginBottom: 20 }}>請輸入管理密鑰</div>
          <input value={keyInput} onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleUnlock()}
            type="password" autoFocus placeholder="REPORT_LOG_KEY"
            style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #23201a", padding: "8px 10px", fontSize: 14, marginBottom: 16, background: "transparent" }} />
          <button onClick={handleUnlock} className="serif"
            style={{ width: "100%", padding: "10px 0", background: "#23201a", color: "#f2ecdd", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: ".08em" }}>
            進入
          </button>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <a href="/report" style={{ textDecoration: "none" }}>
              <span className="mono" style={{ fontSize: 9, letterSpacing: ".14em", color: "#9a917c" }}>← 返回名冊</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ddd3bd", minHeight: "100vh", padding: "32px 20px 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: ".28em", color: "#9a917c" }}>DEBUG · 偵錯黑盒子</div>
            <div className="serif" style={{ fontWeight: 700, fontSize: 22, color: "#23201a" }}>操作記錄（近 {days} 天）</div>
          </div>
          <a href="/report" style={{ padding: "7px 16px", border: "1.5px solid #23201a", background: "transparent", fontSize: 12, color: "#23201a", textDecoration: "none", fontFamily: "'Noto Serif TC',serif", fontWeight: 600 }}>
            ← 返回名冊
          </a>
        </div>

        <div style={{ background: "#f2ecdd", border: "1.5px solid #23201a", padding: 20 }}>
          {/* 篩選列 */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <select value={branch} onChange={e => setBranch(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #cdc3ad", background: "transparent", fontSize: 12 }}>
              <option value="">全部分校</option>
              {ALL_BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={action} onChange={e => setAction(e.target.value)} style={{ padding: "6px 10px", border: "1px solid #cdc3ad", background: "transparent", fontSize: 12 }}>
              <option value="">全部動作</option>
              {Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={status} onChange={e => setStatus(e.target.value as "" | "ok" | "fail")} style={{ padding: "6px 10px", border: "1px solid #cdc3ad", background: "transparent", fontSize: 12 }}>
              <option value="">全部狀態</option>
              <option value="ok">僅成功</option>
              <option value="fail">僅失敗</option>
            </select>
            <select value={days} onChange={e => setDays(Number(e.target.value))} style={{ padding: "6px 10px", border: "1px solid #cdc3ad", background: "transparent", fontSize: 12 }}>
              <option value={1}>近 1 天</option>
              <option value={3}>近 3 天</option>
              <option value={7}>近 7 天</option>
              <option value={14}>近 14 天</option>
              <option value={30}>近 30 天</option>
            </select>
            <input value={studentFilter} onChange={e => setStudentFilter(e.target.value)} placeholder="搜尋學生姓名…"
              style={{ padding: "6px 10px", border: "1px solid #cdc3ad", background: "transparent", fontSize: 12, minWidth: 140 }} />
            <button onClick={() => key && loadLogs(key)} className="serif"
              style={{ padding: "6px 16px", border: "1px solid #23201a", background: "transparent", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              重新整理
            </button>
            <span className="mono" style={{ fontSize: 10, color: "#9a917c", marginLeft: "auto" }}>
              共 {filtered.length} 筆　<span style={{ color: failCount > 0 ? "#b0402c" : "#9a917c", fontWeight: 700 }}>失敗 {failCount} 筆</span>
            </span>
          </div>

          {error && <div style={{ color: "#b0402c", fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}
          {loading && <div className="mono" style={{ fontSize: 11, color: "#9a917c", padding: "20px 0", textAlign: "center" }}>載入中…</div>}

          {!loading && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1.5px solid #23201a" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c" }}>時間</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c" }}>分校</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c" }}>學生</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c" }}>動作</th>
                    <th style={{ textAlign: "center", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c" }}>狀態</th>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontFamily: "monospace", fontSize: 9, color: "#9a917c" }}>詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #e4dfd2", background: row.ok ? "transparent" : "rgba(176,64,44,.06)" }}>
                      <td style={{ padding: "6px 8px", fontFamily: "monospace", fontSize: 11, color: "#6e685a", whiteSpace: "nowrap" }}>{formatTime(row.created_at)}</td>
                      <td style={{ padding: "6px 8px" }}>{row.branch ?? "—"}</td>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>{row.student ?? "—"}</td>
                      <td style={{ padding: "6px 8px" }}>{ACTION_LABEL[row.action] ?? row.action}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <span style={{ padding: "2px 8px", fontSize: 10, fontWeight: 700, color: row.ok ? "#23201a" : "#f2ecdd", background: row.ok ? "#e4dfd2" : "#b0402c" }}>
                          {row.ok ? "成功" : "失敗"}
                        </span>
                      </td>
                      <td style={{ padding: "6px 8px", color: row.ok ? "#6e685a" : "#b0402c" }}>{detailText(row)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} style={{ padding: "30px 0", textAlign: "center", color: "#9a917c" }}>此區間內沒有符合條件的記錄</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
