# 成績單系統整合說明

> 最後更新：2026-09-26。本文件說明把另外三套成績單系統整合進 FIVE 的做法與待確認事項。

## 1. 整合範圍

| 首頁卡片 | 網址 | 來源系統 | 資料來源 |
|---|---|---|---|
| SYSTEM·02 五力指標成績單 | `/report` | FIVE（原封不動） | `src/data/*.json` |
| SYSTEM·03 國中模考成績單 | `/exam/junior-mock` | czpeanut/test-output-sys.（`quizData.js` + `script.js`） | `src/exams/junior-mock/data.json`（由 `allGradeData` 原樣轉出） |
| SYSTEM·04 國小學力檢測成績單 | `/exam/elementary` | czpeanut/Transcript-Export-System（`src/data.ts` + `App.tsx`） | `src/exams/elementary/data.ts`（原檔複製） |
| SYSTEM·05 國小學科能力檢測成績單 | `/exam/elementary-basic` | 三份 Excel 活頁簿（資料區 + 各補習班成績單分頁） | `src/exams/elementary-basic/data.json`（由 Excel 公式自動解析） |

原則：
- FIVE 既有程式（`/report`、`/api/report/*`、`src/components`、`src/lib`、`src/data`、`report_*` 資料表）**完全未修改**，只在首頁 `src/app/page.tsx` 加入三張入口卡片。
- 各系統的計分邏輯、題庫、級距、評語文字逐行移植，**不做任何修正**；有疑慮之處列在第 4 節，由行政端確認後再改。
- 只統一外觀（牛皮紙風格、SVG 校徽與印章、A4 一頁、直接下載 PDF），圖表種類不變：雷達圖仍是雷達圖、表格仍是表格。

## 2. 架構

```
src/exams/
  spec.ts            模組規格：考卷、科目、題數、輸入方式、學生欄位、作答驗證（前後端共用）
  menu.ts            首頁卡片資料（不含題庫，避免首頁載入過大）
  store.ts           前端呼叫 /api/exam/*
  reports.tsx        依模組產生成績單頁面
  ui/                牛皮紙共用元件：分校登入、A4 頁框、圖表（雷達圖沿用 FIVE 的 radarSvg）、PDF 輸出
  junior-mock/       國中模考：data.json、scoring.ts、Report.tsx
  elementary/        國小學力檢測：data.ts、scoring.ts、Report.tsx
  elementary-basic/  國小學科能力檢測（Excel）：data.json、scoring.ts、Report.tsx
src/app/exam/[module]/         名冊（分校登入、切換考卷、新增／編輯／刪除學生、下載全體 PDF）
src/app/exam/[module]/input/   逐科登記作答
src/app/exam/[module]/view/    成績單預覽（畫面即 PDF 來源）＋下載 PDF
src/app/api/exam/students      名冊 API（exam_students）
src/app/api/exam/answers       作答 API（exam_answers，伺服器端驗證題數與選項）
supabase-exam-setup.sql        新資料表建表 SQL
```

- 分校登入與 FIVE 共用 `localStorage.selectedBranch_v1`，選過一次各系統通用。
- 名冊依「模組 × 考卷（測驗項目／年級）× 分校」分開。
- 操作記錄寫入既有的 `report_activity_log`，action 為 `exam_save_answer`、`exam_add_student`、`exam_remove_student`、`exam_save_answer_client_error`，detail 內含 module／exam。

## 3. 上線步驟

1. 在 Supabase SQL Editor 執行 `supabase-exam-setup.sql`（只新增 `exam_students`、`exam_answers`，不動既有資料表）。
2. `npm run build` 確認通過（先停掉 dev server）。
3. `npx vercel --prod --yes`。

## 4. 待確認事項（整合時照原樣保留，未修改）

見 PR 說明或對話紀錄中的完整清單；確認後修改對應的資料檔即可：
- 國中模考：`src/exams/junior-mock/data.json`
- 國小學力檢測：`src/exams/elementary/data.ts`
- 國小學科能力檢測：`src/exams/elementary-basic/data.json`（年級對應：fileB＝小四、fileC＝小五、fileA＝小六，見 `scoring.ts` 的 `EB_EXAMS`）
- 達陣文理的分校：`src/lib/branches.ts`（會同時影響 FIVE 的分校選單）

## 5. 驗證紀錄

- 計分一致性：以原系統程式碼／Excel 公式為基準比對新實作，國中模考 900 組、國小學力檢測 1,800 組、國小學科能力檢測 2,709 組（含 9 組 Excel 自身快取值），全部一致。
- FIVE 回歸：同一批資料下，修改前後的 `/report` 名冊、填分頁、預覽頁與 4 張 PDF 列印頁逐像素相同。
- 端對端：三個新系統皆實測「新增學生 → 鍵盤輸入作答（自動跳格）→ 儲存 → 預覽 → 下載單人 PDF → 下載全體 PDF」，頁數正確、無前端錯誤；API 會擋下缺題、空白、非法選項、非選題得分超出範圍等資料。
