# 這字怎麼念？

手機優先繁體中文 PWA：Canvas 手寫 → gugray/hanzi_lookup WASM Web Worker → 最多 10 個候選字 → 台灣注音、漢語拼音、教育部字典釋義、zh-TW 裝置朗讀。

全部辨識與字典資源隨網站提供，執行期不需要 CDN 或外部辨識 API。WASM 約 740 KB，單字字典約 1.8 MB。Service Worker 完整快取成功後可離線手寫與查字；語音可用性依裝置而定。近期紀錄只存於本機，可清除。

## GitHub Pages

在此既有 repository 的 **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**。

網站：https://JoooE57.github.io/hanzi-reader/

此專案不需建置。所有應用、Worker、WASM、字典、manifest、Service Worker URL 都採相對路徑；start_url 與 scope 為 `./`，可在 `/hanzi-reader/` 運行。第一次開啟保持連線，看到「已可離線查字」再離線。iPhone 使用 Safari 分享 → 加入主畫面。

## 開發與測試

Node 20+：`npm start`，開啟 http://127.0.0.1:4173/hanzi-reader/ 。`npm test` 驗證真實 WASM 筆畫辨識、字典與部署資源。

`node scripts/prepare-data.mjs <moedict-data/dict-revised_bkup.json>` 從上游原始字典重建所有單字資料，保留注音、拼音與定義原文。上游版本與授權見 [credits.html](credits.html)。`scripts/make-icons.py` 可使用 Pillow 與 Windows 微軟正黑體重建 PNG 圖示。辨識核心對應原始碼、筆畫二進位資料與建置指令附於 `vendor/source/`；使用者可以修改、重新編譯及替換 vendor 的辨識核心。

端對端測試：安裝 Playwright 並備妥 Microsoft Edge，先啟動 `npm start`，再執行 `node scripts/browser-test.cjs`。可用 `PLAYWRIGHT_MODULE` 指定已安裝的 Playwright 路徑。此測試涵蓋手機手寫、候選字、字典、朗讀呼叫、復原、清除、紀錄、離線重新載入與辨識、核心下載失敗及重試；未驗證 iPhone 實機或實際語音音質。

發布程式或資源更新時，請同步增加 `sw.js` 的 CACHE 版本，確保離線快取更新。

## 使用限制

辨識核心約涵蓋 9,507 字，依筆順書寫通常更準確；不保證涵蓋罕用字。字典不收錄的候選字會提示。顯示每個讀音前兩則完整釋義；多音字以詞語與上下文判斷，SpeechSynthesis 可能選用不同讀音。瀏覽器若清除網站資料或回收儲存空間，需要重新連網下載。
