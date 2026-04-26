---
name: forum-and-notifications
description: 論壇系統（依 16 習慣 + 觀心書 + 斷捨離分版）、右上鈴鐺通知中心、斷捨離行動方案
type: feature
---
- 論壇：forum_categories / forum_posts / forum_comments / forum_likes，發文 +5、回文 +2、收讚 +1（每日上限）。動態牆樣式 /forum，路徑 /forum/category/:slug、/forum/post/:postId
- 通知中心：右上 NotificationBell（Popover），整合未讀訊息、觀心書/斷捨離行動逾期到期、論壇回文/按讚、未讀打招呼。RPC get_my_notifications
- 斷捨離行動方案：declutter_actions 表 + complete_declutter_action RPC（+2/上限 10）。/declutter?tab=actions
