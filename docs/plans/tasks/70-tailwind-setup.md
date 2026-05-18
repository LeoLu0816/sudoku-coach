---
id: 70-tailwind-setup
phase: P6
status: todo
depends_on: []
assignee: claude-code
estimated_complexity: S
acceptance:
  - "package.json 含 tailwindcss / postcss / autoprefixer 三個 devDependencies"
  - "tailwind.config.js 與 postcss.config.js 存在於專案根目錄，且 tailwind.config.js 的 screens 為 { sm: 480px, md: 768px, lg: 1024px }"
  - "src/styles/tailwind.css 存在並含 @tailwind base/components/utilities 三行"
  - "src/main.ts 第一行 import './styles/tailwind.css'"
  - "index.html viewport meta 加上 viewport-fit=cover"
  - "pnpm typecheck / pnpm test / pnpm build 全綠"
  - "pnpm dev 啟動後在瀏覽器測試三個 view 視覺無明顯破版（preflight 影響可控）"
deliverables:
  - "package.json"
  - "tailwind.config.js"
  - "postcss.config.js"
  - "src/styles/tailwind.css"
  - "src/main.ts"
  - "index.html"
---

# Task 70: Tailwind CSS 安裝與基建

## 目標

引入 Tailwind CSS 3，覆寫斷點為 sm 480 / md 768 / lg 1024，並在 main.ts 全域載入。為後續所有任務提供 utility class 與 RWD 基礎。

## 變動檔案

- 修改：`package.json`（新增 devDependencies）
- 建立：`tailwind.config.js`、`postcss.config.js`、`src/styles/tailwind.css`
- 修改：`src/main.ts`、`index.html`

## 實作步驟

- [ ] **Step 1：安裝 Tailwind 相關套件**

執行：
```bash
pnpm add -D tailwindcss postcss autoprefixer
```

預期：`package.json` devDependencies 多出 `tailwindcss` `postcss` `autoprefixer` 三項。

- [ ] **Step 2：建立 `tailwind.config.js`**

建立檔案 `O:\TestProject\sudo\tailwind.config.js`：

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    screens: {
      sm: '480px',
      md: '768px',
      lg: '1024px',
    },
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 3：建立 `postcss.config.js`**

建立檔案 `O:\TestProject\sudo\postcss.config.js`：

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 4：建立 `src/styles/tailwind.css`**

建立檔案 `O:\TestProject\sudo\src\styles\tailwind.css`：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5：`src/main.ts` 頂端 import tailwind.css**

修改 `src/main.ts`，最上面新增一行 import：

```ts
import './styles/tailwind.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { installPersistence, loadProgress } from './stores/persistence'

// 建立應用：Pinia → Router → mount
const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)

// 嘗試從 localStorage 還原進度（必須在 pinia 安裝後）
loadProgress()
installPersistence()

app.mount('#app')
```

- [ ] **Step 6：`index.html` viewport meta 更新**

把第 5 行：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

改為：
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

- [ ] **Step 7：跑 typecheck + test 確認沒破壞既有測試**

執行：
```bash
pnpm typecheck
pnpm test
```

預期：兩者全綠。

- [ ] **Step 8：跑 build 確認 production 可產出且檔案大小合理**

執行：
```bash
pnpm build
```

預期：`dist/` 產出 css 檔，總 size 增量 < 30 KB gzipped。

- [ ] **Step 9：手動視覺驗收**

執行 `pnpm dev`，瀏覽器開 http://localhost:5173 看三個 view（/、/play、/observe、/analyze）：

- 預期：基本能看，棋盤格線在、按鈕在
- 若 Tailwind preflight 把按鈕 / h1 / p 預設樣式 reset 導致大面積走樣：在 `tailwind.config.js` 加 `corePlugins: { preflight: false }` 暫時關閉。後續任務改各 view 時再用 utility class 補回。

- [ ] **Step 10：commit**

```bash
git add package.json pnpm-lock.yaml tailwind.config.js postcss.config.js src/styles/tailwind.css src/main.ts index.html
git commit -m "feat(styles): 引入 Tailwind CSS 基建（sm/md/lg 三段斷點）[70-tailwind-setup]"
```

## 完工條件

- [ ] package.json 含三個新 devDependencies
- [ ] tailwind.config.js 與 postcss.config.js 存在且 screens 設定正確
- [ ] src/styles/tailwind.css 存在
- [ ] main.ts 第一行 import tailwind.css
- [ ] index.html viewport meta 含 viewport-fit=cover
- [ ] `pnpm typecheck` 全綠
- [ ] `pnpm test` 全綠
- [ ] `pnpm build` 無錯誤
- [ ] 手動驗收三個 view 無明顯破版

## 風險與備援

- **Tailwind preflight 影響**：若大面積破版，依 Step 9 關閉 preflight；其餘任務照常進行，最後在 76 任務評估是否補 reset
- **PostCSS / Vite 版本相容**：Vite 5 + Tailwind 3 / PostCSS 8 為標準組合，理論上零摩擦
