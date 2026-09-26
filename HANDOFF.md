# 五力指標成績單輸出系統 — 交接文件

> 給新 session 用。最後更新：2026-09-26。
> 建議新 session 直接在 `C:\Users\ssoni\report-card` 開啟，並先讀完本文件。

## 1. 專案概覽

獨立的 Next.js 成績單輸出系統，與 student-app（codexstudy.com）分開，不要混做。

- 位置：`C:\Users\ssoni\report-card`；GitHub：https://github.com/czpeanut/FIVE（branch: master）
- 正式網址：https://report-card-snowy.vercel.app
- Vercel 專案：`czpeanuts-projects/report-card`
- 用途：各分校老師登記學生 W1~W5 週測驗的逐題對錯，彙整成一張含四科（國文、英文、數學、自然）各一頁的五力指標成績單，直接下載 PDF。

### 使用流程
1. 首頁 `/`：選「AI 解題學習系統」（連到 codexstudy.com）或「五力指標成績單」
2. `/report`：先選分校（像登入，選過會記在 localStorage `selectedBranch_v1`）→ 進入名冊
3. 名冊：新增/刪除學生、看每人 4 科 × 5 週的填寫進度、點格子進入填分頁、「出報告」、「下載全體 PDF」
4. `/report/input`：逐題點選答對/答錯，儲存
5. `/report/view`：預覽成績單，「下載 PDF」
6. `/report/logs`：偵錯黑盒子（需管理密鑰）

## 2. 技術棧與關鍵決策

- Next.js 14.2 App Router + TypeScript，dev port **3002**
- Tailwind v3 + 大量 inline style，牛皮紙風格：pageBg `#ddd3bd`、paper `#f2ecdd`、ink `#23201a`、accent `#b0402c`
- 資料庫：**Supabase（與 student-app 共用同一個專案，但用獨立的 `report_*` 資料表）**
- PDF：**瀏覽器端** `html2canvas`（scale 2）截圖 → `jsPDF` 組成 A4，直接下載，不使用列印功能，伺服器不存 PDF
- 雷達圖：PDF 用純 SVG 字串（`radarSvg()`）；螢幕預覽用 Chart.js（`RadarChart.tsx`）
- 部署：`cd C:\Users\ssoni\report-card` → `npx vercel --prod --yes`

### 踩過的坑（務必記住）
1. **html2canvas 算 flex 置中 / line-height 的文字垂直位置會偏移** → 需要精確置中的小元件（校徽字框、五力編號方框、認定印章）一律改用 SVG（`textAnchor="middle"` + `dominantBaseline="central"`）。
2. **PrintPage 必須固定 `height: 1123` + `overflow: hidden`**，PDF 每科固定一頁 A4 直接填滿，不要用 while 迴圈分頁（浮點誤差會多出空白頁）。
3. **雷達圖長標籤會被裁切**：最長標籤「資料分析與不確定性理解力」12 字。目前 SVG 左右留白 `PAD = 90`，且超過 6 字自動縮小字級（7–9 字 9px、10 字以上 8px）。
4. **Vercel 環境變數不要用 PowerShell `echo |` 寫入**（會混入 BOM 字元，造成 `Cannot convert argument to a ByteString`）。要用 Bash：`printf '%s' "值" | npx vercel env add NAME production`。
5. **Bash 直接帶中文給 curl 會被編碼弄壞**，驗證 API 請改用 `node -e` 的 fetch。
6. Vercel build 會跑 ESLint，**未使用的 import／變數會讓 build 失敗**，改完先 `npm run build`。
7. **本機 `npm run build` 時若同時開著 dev server 可能 OOM**，build 前先停掉預覽。
8. **導回名冊 `/report` 的連結一律用純 `<a href>` 或 `window.location.href`（整頁重新載入）**，不要用 Next.js `<Link>` / `router.push`，避免用戶端快取顯示過期的完成度。
9. 隱藏的列印頁用 `position:absolute; left:-9999px`，供 html2canvas 截圖。

## 3. 檔案地圖

```
src/
  app/
    page.tsx                    入口首頁（系統選擇）
    report/
      page.tsx                  分校選擇 + 名冊 + 批次下載全體 PDF
      input/page.tsx            逐題填分頁（有錯誤提示、儲存中狀態）
      view/page.tsx             單人成績單預覽 + 下載 PDF
      logs/page.tsx             偵錯黑盒子檢視頁（管理密鑰保護）
    api/report/
      students/route.ts         GET/POST/DELETE 學生（POST/DELETE 有寫黑盒子記錄）
      answers/route.ts          GET/POST 作答（POST 有寫黑盒子記錄）
      log/route.ts              前端斷網時 sendBeacon 補記
      logs/route.ts             讀取黑盒子記錄（需 key）
  components/
    PrintPage.tsx               PDF 單頁排版 + radarSvg()（單人/批次共用）
    RadarChart.tsx              螢幕預覽用 Chart.js 雷達圖
  lib/
    branches.ts                 分校清單、校名對照（SCHOOL_MAP）、getSchoolInfo()
    store.ts                    前端呼叫 API 的資料層（含錯誤處理）
    scoring.ts                  calcAggregateScores（跨週彙整五力得分）
    types.ts                    SUBJECTS / WEEKS / WEEK_ZH 等型別
    supabaseAdmin.ts            伺服器端 service role client
    activityLog.ts              logActivity()（失敗不影響主流程）
  data/
    indicators.json             4 科 × 5 週 × 10 題的題目→五力指標對應
    descriptions.json           每科 5 項指標的名稱與說明
supabase-setup.sql              三張資料表的建表 SQL（已在 Supabase 執行完畢）
```

## 4. 資料存放

**成績資料全在 Supabase 雲端**，不在瀏覽器（早期用 localStorage，已於改為雲端後淘汰；localStorage 現在只剩 `selectedBranch_v1` 分校選擇）。

| 資料表 | 內容 | 主鍵 |
|---|---|---|
| `report_students` | 各分校學生名單 | (branch, student) |
| `report_answers` | 每人每科每週的 boolean[] 作答 | (branch, student, subject, week) |
| `report_activity_log` | 偵錯黑盒子記錄（time/branch/student/action/ok/detail/user_agent） | id |

- 三張表都啟用 RLS 且無 policy，只能透過 API 路由用 service role 存取。
- Supabase 專案：`kxjiqgtyguzttwpniljs.supabase.co`（與 student-app 同一個）。
- 環境變數（Vercel production + 本機 `.env.local`，**金鑰不寫在本文件**）：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `REPORT_LOG_KEY`（黑盒子頁面的管理密鑰，值請看 `.env.local`）
- 改 schema 的流程（沿用 student-app SOP）：本機無法跑 DDL，需給使用者 SQL 貼到 Supabase SQL Editor 執行 → 確認 → 再部署。

## 5. 偵錯黑盒子

- 記錄「儲存成績 / 新增學生 / 刪除學生」每一次嘗試（成功與失敗都記），伺服器端在寫入前後記錄。
- 前端連伺服器都連不上（斷網）時，`store.ts` 用 `sendBeacon` 補記 `save_answer_client_error`。
- 檢視：`/report/logs`，可依分校、動作、成功/失敗、天數（1~30）篩選，可搜尋學生姓名。
- 也可直接打 API：`/api/report/logs?key=<REPORT_LOG_KEY>&days=14`。
- 目前**沒有自動清除**舊記錄（原本要求「近兩週」，目前只是查詢預設 14 天，資料本身會一直累積）。
- 已知盲點：**不記錄「讀取／頁面顯示」**，所以若使用者回報「畫面沒顯示已填內容」，只能確認資料有沒有存進去，無法確認當下畫面顯示了什麼。

## 6. 目前狀態

### 已完成並上線
- 分校「登入」式選擇、動態校名（校徽字、印章、標題隨分校變化）、全部英文校名已移除
- 逐題填分 → 名冊進度總覽 → 單人 PDF / 全體批次 PDF 直接下載
- 施測週次**每科獨立顯示**（某週只考數學就只有數學頁亮）
- 五力雷達圖按已施測題目彙整；PDF 版面（校徽/編號/印章置中、無空白頁、標籤不裁切）
- 雲端資料庫（跨裝置共用）
- 儲存失敗會顯示紅字錯誤並擋住返回；儲存中按鈕停用
- 偵錯黑盒子（含 `/report/logs` 檢視頁）
- 分校名單已校對（福山校屬學築文理；德忠校屬達學文理）

### 目前最新狀況（需要追蹤）
- 使用者曾回報：「登記完成績後無法儲存」與「近期資料儲存後名冊沒顯示已完成週次（畫面全黑）」。
- 黑盒子查了近 14 天約 754 筆：**所有真實請求伺服器端都回報成功**，僅有 1 筆是我自己的測試失敗；姓名/分校字串也沒有不一致。→ 判斷問題在**前端沒重抓最新資料**，而非寫入失敗。
- 已做的修正：所有導向 `/report` 的連結（input 頁、view 頁、首頁入口、logs 頁）都改為整頁重新載入。已部署。
- **尚未確認使用者實測後是否還有問題。** 若還有，下一步要補「讀取／顯示」層的記錄（例如記錄名冊載入時取得的資料筆數、載入失敗），並向使用者要那筆發生時間與分校/學生，用黑盒子對時間點。
- 尚未釐清的疑點：使用者說的「顯示全黑」是什麼——目前程式裡已填/未填的顏色是磚紅 `#b0402c` 與淺米 `#e4dfd2`，沒有黑色。建議下次請使用者提供截圖。

## 7. 待辦與建議

1. 向使用者確認上述回報問題是否已解決；未解決則補讀取層記錄並索取截圖與時間點。
2. **程式碼備份**：已推上 GitHub（https://github.com/czpeanut/FIVE）。之後改完記得 commit + push。
3. **成績資料備份**：只靠 Supabase 保管，可做「匯出全部資料」功能。
4. 黑盒子自動清除超過 14 天的記錄（可加清理 API + Vercel Cron，或查詢時順手刪）。
5. 目前沒有任何身份驗證：知道分校就能進該分校名冊；`/report/logs` 只靠一組密鑰。若之後需要分校隔離，要另做登入。
6. `src/app/report/page.tsx` 內仍有 `← 返回選單` 使用 `<Link>`（導向 `/`，與快取問題無關，可不動）。
7. 常見雷區：`npm run build` 前先停 dev server；push 前檢查沒有把 `.env.local` 帶進去。

## 8. 使用者偏好（來自對話）
- 全程使用繁體中文溝通。
- 使用者對「明明說過的事還做錯」很敏感（例如每科要獨立頁面、英文名要全去掉）——實作前先確認所有相關位置一次改完。
- 修完 UI 問題要實際驗證（本專案用 html2canvas 實跑或量測 SVG bbox），不要只憑推論說已修好。
- 部署一次一次投，等通知，不要中途重複觸發。
