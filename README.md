# 蝦皮賣家記錄器 Chrome 插件

## 介紹

蝦皮賣家記錄器是一款 Chrome 擴充功能，讓你可以在蝦皮購物（shopee.tw）上標記「好評賣家」「避開賣家」或添加備註，避免重複踩雷，提升購物體驗。

## 主要功能
- 在蝦皮商品頁、搜尋頁、購物車頁顯示「好評」「避開」「備註」標記按鈕
- 標記後自動高亮顯示賣家狀態（紅框/綠框/標籤）
- 彈跳視窗（popup）可瀏覽、匯出、清除所有標記紀錄
- 資料自動同步到登入同帳號的 Chrome 裝置（使用 chrome.storage.sync）
- 標記「避開」賣家時，商品頁會顯示醒目警告

## 安裝方式
1. 下載本專案原始碼
2. 打開 Chrome，進入 `chrome://extensions/`
3. 開啟「開發人員模式」
4. 點擊「載入未封裝項目」，選擇本資料夾
5. 完成安裝，右上角會出現蝦皮賣家記錄器圖示

## 使用說明
- 在蝦皮商品頁、搜尋頁、購物車頁，會自動出現標記按鈕
- 點擊「好評」「避開」「備註」即可標記賣家
- 點擊右上角插件圖示可瀏覽/匯出/清除所有紀錄
- 資料會自動同步到同帳號的 Chrome 裝置

## 注意事項
- 本插件僅在 shopee.tw、shopee.com 網域生效
- 資料僅儲存於你的 Google 帳號同步空間，不會外傳
- 蝦皮官方不會因安裝本插件而封鎖帳號，但請勿惡意自動化操作
- 若遇到頁面結構大幅變動，請回報或自行調整 selector

## 聯絡/反饋
如有建議或問題，歡迎於 GitHub 提 issue 或聯絡作者。
