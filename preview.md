┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NGƯỜI DÙNG HỌC TẬP                                 │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │                                 │
                        ▼                                 ▼
         [ 1. TIẾN TRÌNH HÀNG NGÀY ]             [ 2. TIẾN TRÌNH COLLECTION ]
         (Thói quen, Daily Streak)               (Cày kho từ vựng theo SRS)
                        │                                 │
          ┌─────────────┴─────────────┐                   ▼
          ▼                           ▼          ┌───────────────────────────┐
     A. Daily Lesson            B. Daily Review  │   `collection_reviews`    │
     (Bài học 7 bước)           (Ôn 20 từ/ngày)  │ (Lưu từng từ: rep, ease,  │
          │                           │          │  interval, next_review)   │
          ▼                           ▼          └─────────────┬─────────────┘
  ┌───────────────┐           ┌──────────────┐                 │
  │ Client Store  │           │   Supabase   │                 ▼
  │ (Zustand +    │           │`daily_reviews│         ┌───────────────┐
  │ LocalStorage) │           │     table    │         │ Client Store  │
  └───────────────┘           └──────────────┘         │ (Zustand Sync)│
                                                       └───────────────┘