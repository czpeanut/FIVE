import { ReactNode } from "react";
import type { ModuleId, StudentInfo } from "./spec";
import { MODULES } from "./spec";
import type { AnswerRow } from "./store";
import { JuniorMockPage } from "./junior-mock/Report";
import { ElementaryPage } from "./elementary/Report";
import { ElementaryBasicPage } from "./elementary-basic/Report";

export interface ReportPageProps {
  exam: string; subject: string; student: string; branch: string; info: StudentInfo;
  answer: AnswerRow; school: { zh: string; char: string };
  setRef?: (el: HTMLDivElement | null) => void;
}
export interface ReportBookProps {
  exam: string; student: string; branch: string; info: StudentInfo;
  answers: Record<string, AnswerRow>; school: { zh: string; char: string };
  setRef?: (el: HTMLDivElement | null) => void;
}

export interface ReportPage { key: string; render: (setRef: (el: HTMLDivElement | null) => void) => ReactNode }

// 依模組產生該學生的成績單頁面：國中模考、國小學力檢測為「已登記的科目各一頁」；國小學科能力檢測為三科同一頁
export function buildReportPages(module: ModuleId, p: Omit<ReportBookProps, "setRef">): ReportPage[] {
  if (module === "elementary-basic") {
    if (Object.keys(p.answers).length === 0) return [];
    return [{ key: "all", render: setRef => <ElementaryBasicPage {...p} setRef={setRef} /> }];
  }
  const Page = module === "junior-mock" ? JuniorMockPage : ElementaryPage;
  return MODULES[module].subjects(p.exam)
    .filter(s => p.answers[s.key])
    .map(s => ({
      key: s.key,
      render: setRef => <Page exam={p.exam} subject={s.key} student={p.student} branch={p.branch} info={p.info} answer={p.answers[s.key]} school={p.school} setRef={setRef} />,
    }));
}
