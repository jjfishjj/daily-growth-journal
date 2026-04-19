---
name: Social Friend System
description: 系統整合以「能量點數」為核心的社交與獎勵機制，含每日一抽道友配對、免費一對一訊息、Realtime 訊息更新，以及後台 jj 假用戶生成器。
type: feature
---
- 名詞：配對對象稱「道友」（不再用「同修」）。
- 訊息：messages 表 + Realtime + get_my_conversations RPC，免費發送，Messages 頁路由 /messages?to=xxx。
- 導航列含未讀數 Badge。
- Match 頁卡片含「查看檔案 / 打招呼 / 傳訊息 / 收藏」四鍵，頭像與名字皆可點開檔案。
- 後台「假用戶」分頁（admin_seed_mock_user RPC）批次生成 jj20-jj100，每筆含 bio/region/practice_goal/ideal_friend_type/3-5 keywords/3-6 habits。
