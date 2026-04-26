---
name: pwa-install
description: PWA 安裝設定（vite-plugin-pwa）、/install 引導頁與 service worker preview 守衛
type: feature
---
- vite.config.ts 使用 VitePWA：manifest（修行日誌、theme #1e1b4b、start_url /today、display standalone）、autoUpdate、devOptions disabled
- workbox: navigateFallbackDenylist [/^\/~oauth/, /^\/auth/, /^\/reset-password/]，Supabase API 用 NetworkFirst (5 分鐘)，Google Fonts CacheFirst
- src/main.tsx：iframe / lovableproject.com / id-preview 主機環境會 unregister 任何 SW；正式網域才 registerSW
- /install 頁面：自動偵測 iOS / Android / Desktop 顯示對應安裝步驟，支援 beforeinstallprompt 一鍵安裝
- 圖示：public/icons/icon-192.png、icon-512.png、apple-touch-icon.png（蓮花禪意風）
- 導覽列新增「安裝 App」入口 (Smartphone icon)
