# 情緒角色分組扭蛋機 (Gacha Machine) 🎲

這是一個專為「【林口康橋TeamLab-腦筋急轉彎核心精英行動】」設計的 React 前端應用程式。學生可以透過這個充滿「玩具總動員科幻風」的網頁進行盲抽，獲得對應的《腦筋急轉彎》情緒角色（樂樂、憂憂、怒怒、驚驚、厭厭），並透過 Google Apps Script (GAS) 自動將班級依據異質性分配到各個小隊中，最終記錄於 Google Sheets。

---

## 🚀 快速開始指南

這個專案需要搭配 **Google Sheets** 與 **Google Apps Script** 才能發揮最完整的分組記錄功能。請依照以下步驟完成環境設定。

### 第一步：準備 Google Sheets 試算表
1. 請登入您的 Google 帳號，並前往 [Google 雲端硬碟](https://drive.google.com/)。
2. 點選左上角「新增」 > 「Google 試算表」建立一個新的試算表檔案。
3. 將這份試算表命名為您好記的名稱（例如：`七年級分組紀錄表`）。
4. **最重要的一步**：將畫面下方的工作表名稱（預設為「工作表1」）重新命名為 **`班級小隊分組`**。（請確保一字不差，這是後端程式辨識的依據）。

### 第二步：部署 Google Apps Script (GAS)
1. 停留在剛剛建立的 Google Sheet 畫面，點擊上方選單的 **「擴充功能」** > **「Apps Script」**，這會開啟一個新的程式碼編輯視窗。
2. 將編輯器內原本預設的 `function myFunction() { ... }` 程式碼全部刪除。
3. 打開專案資料夾中的 [gas.js](./gas.js) 檔案，將裡面的**所有程式碼複製**，並**貼上**到 Apps Script 的編輯器中。
4. 點擊編輯器上方的 💾 (儲存專案) 按鈕。
5. 點擊編輯器右上角的 **「部署」** 按鈕 > 選擇 **「新增部署作業」**。
6. 在左側「選取類型」點擊齒輪圖示 ⚙️，選擇 **「網頁應用程式」**。
7. 在右側設定檔中：
   - 「說明」：隨意填寫（例如：`v1.0`）
   - 「執行身分」：選擇 **「我 (您的 Google 帳號)」**
   - 「誰可以存取」：選擇 **「所有人」** (這點非常重要，否則學生會因為沒有權限而無法抽籤寫入紀錄！)
8. 點擊 **「部署」**。*(第一次部署時系統可能會要求「授予存取權」，請點選您的帳號 -> 進階 -> 前往(不安全) -> 允許)*
9. 部署完成後，畫面上會出現一串 **「網頁應用程式網址」 (Web App URL)**，請將這串網址複製下來。

### 第三步：設定環境變數 (.env)
1. 回到本專案資料夾 (`gacha-machine`)。
2. 找到根目錄下的 `.env` 檔案並用文字編輯器打開。
3. 將剛剛複製的「網頁應用程式網址」貼到 `VITE_GOOGLE_APP_SCRIPT_URL=` 的後面。
   
   修改後應該會長得像這樣：
   ```env
   VITE_GOOGLE_APP_SCRIPT_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
4. 存檔並關閉 `.env`。

### 第四步：啟動前端應用程式
確保您的電腦已安裝 [Node.js](https://nodejs.org/)。

1. 打開終端機 (Terminal / PowerShell)。
2. 切換到專案資料夾：
   ```bash
   cd c:\Users\beatrice\OneDrive\Desktop\KCISLK\gacha-machine
   ```
3. (如果尚未安裝套件) 執行安裝指令：
   ```bash
   npm install
   ```
4. 啟動本機開發伺服器：
   ```bash
   npm run dev
   ```
5. 打開瀏覽器前往 ， 即可開始使用！

---

## ⚙️ 進階設定：班級人數與分組邏輯

如果您未來需要調整各班的「總人數」以改變分 3 隊或 4 隊的判斷基準，請參考以下方式：

1. 回到 Google Apps Script 編輯器。
2. 找到 `classSizes` 這個區塊：
   ```javascript
   var classSizes = {
      "701": 30,
      "702": 30,
      // ... 您可以自行修改對應班級的人數
   };
   ```
3. 修改完畢後，記得**儲存**。
4. **重要**：每次修改 Apps Script 的程式碼後，您必須點擊右上角 **「部署」** > **「管理部署作業」** > 點擊右上角鉛筆圖示 (編輯) > 將「版本」改為 **「新版本」** > 點擊 **「部署」** 才能讓修改生效！(網址不會改變，不需要重新設定 .env)。

---

## 🌐 部署到 GitHub Pages

本專案已經設定好 GitHub Actions，當您將程式碼推送到 GitHub 上的 `main` 或 `master` 分支時，會自動編譯並部署到 GitHub Pages 上。

### 設定步驟：
1. **上傳專案到 GitHub**：
   - 將本專案的所有檔案 (`node_modules` 與 `.env` 除外) 推送到您自己的 GitHub 儲存庫 (Repository)。
2. **設定環境變數 Secret**：
   - 前往您的 GitHub 儲存庫頁面。
   - 點擊上方的 **Settings** 頁籤。
   - 在左側選單找到 **Secrets and variables** > 點擊 **Actions**。
   - 點擊綠色的 **New repository secret** 按鈕。
   - 在 `Name` 填入 `VITE_GOOGLE_APP_SCRIPT_URL`。
   - 在 `Secret` 填入您的 Google Apps Script 網頁應用程式網址 (參考 `.env.example`)。
   - 點擊 **Add secret**。
3. **啟用 GitHub Pages 設定**：
   - 同樣在儲存庫的 **Settings** 頁面。
   - 點擊左側選單的 **Pages**。
   - 在 `Build and deployment` 的 `Source` 選項中，選擇 **GitHub Actions**。
4. **自動部署**：
   - 上述步驟完成後，未來您只要推送 (Push) 程式碼，GitHub 就會自動執行 Actions 編譯並發布網頁！您可以在儲存庫頁面上方的 **Actions** 頁籤查看進度與最終的網頁網址。
