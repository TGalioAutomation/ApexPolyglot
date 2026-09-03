# Mô hình dữ liệu LingoVoice (PostgreSQL)

> Đơn vị lưu trữ chính: PostgreSQL (`DATABASE_URL`). Client offline dùng localStorage (`lv-*`)
> và đồng bộ qua API sync. Chi tiết bảng nằm trong `db/migrations/`.

## 1. Sơ đồ ERD

```mermaid
erDiagram
  users ||--o| learner_profiles : "1-1 hồ sơ"
  users ||--o{ placements : "làm test"
  users ||--o{ srs_items : "học từ"
  users ||--o{ mistakes : "ghi lỗi sai"
  users ||--o{ memory_notes : "nhớ dài hạn"
  users ||--o{ learning_sessions : "buổi học"
  learning_sessions ||--o{ attempts : "lượt làm"
  users ||--o{ daily_activity : "rollup theo ngày"
  users ||--o{ earned_badges : "huy hiệu đã đạt"
  users ||--o{ parent_links : "liên kết gia đình"
  parent_invites }o--|| users : "mã mời của phụ huynh"
  lessons ||--o{ lesson_items : "gồm"
  vocab_items ||--o{ srs_items : "tham chiếu (tuỳ chọn)"

  users {
    uuid id PK
    text username UK
    text password_hash
    text role "learner|parent|teacher|admin"
    text age_group "preschool|child|teen|young-adult"
    timestamptz created_at
  }
  learner_profiles {
    uuid user_id PK,FK
    jsonb goals
    int daily_minutes
    numeric en_ratio
    jsonb teacher_profile
    int day
    timestamptz journey_started_at
    timestamptz updated_at
  }
  placements {
    uuid id PK
    uuid user_id FK
    text lang "en|zh"
    int level "1-7"
    int overall "0-100"
    jsonb skills
    text weakest
    timestamptz taken_at
  }
  srs_items {
    uuid id PK
    uuid user_id FK
    text lang
    text vocab_id "nullable tham chiếu vocab_items.id"
    text term
    text meaning
    text state "learning|difficult|review|mastered"
    bigint interval_ms
    timestamptz due_at
    int reps
    int consecutive_good
    boolean difficult
    boolean mastered
    timestamptz updated_at
  }
  mistakes {
    uuid id PK
    uuid user_id FK
    text lang
    text skill
    text pattern
    text correct
    timestamptz created_at
  }
  memory_notes {
    uuid id PK
    uuid user_id FK
    text text "≤500 ký tự"
    timestamptz created_at
  }
  vocab_items {
    text id PK "en-a1-term | zh-hsk1-词"
    text lang
    text term
    text pos "EN only"
    text ipa "EN only"
    text pinyin "ZH only"
    text meaning
    text example
    text translation
    jsonb collocations "EN: đúng 2"
    int freq "1-5"
    boolean workplace
    text topic
    text cefr "A1-C2"
    boolean reviewed
  }
  lessons {
    text id PK
    text lang
    text stage
    text title
    int order_index
    jsonb metadata
  }
  lesson_items {
    uuid id PK
    text lesson_id FK
    text kind "vocab|quiz|listening|reading"
    jsonb payload
    text audio_text
    int order_index
  }
  readings {
    text id PK
    text lang
    text level
    text title
    text body
    jsonb metadata
  }
  roleplay_scenarios {
    text id PK
    text lang
    text stage
    text title
    text persona
    text opening
    jsonb prompts
  }
  learning_sessions {
    uuid id PK
    uuid user_id FK
    text lang
    text skill
    timestamptz started_at
    timestamptz ended_at
    jsonb stats
  }
  attempts {
    uuid id PK
    uuid session_id FK
    uuid user_id FK
    text kind
    text item_ref
    boolean correct
    int grade
    jsonb payload
    timestamptz created_at
  }
  daily_activity {
    uuid user_id PK,FK
    date day PK "khóa ngày của người học"
    int minutes
    int words
    int xp
    int attempts
    int correct
    timestamptz updated_at
  }
  earned_badges {
    uuid user_id PK,FK
    text badge_id PK "định nghĩa trong db/gamification.mjs"
    timestamptz earned_at
  }
  parent_links {
    uuid id PK
    uuid parent_id FK
    uuid child_id FK
    timestamptz created_at
  }
  parent_invites {
    text code PK "8 ký tự, bỏ 0/O và 1/I"
    uuid parent_id FK
    uuid child_id FK "NULL = chưa dùng"
    timestamptz expires_at
    timestamptz used_at
  }
  jobs {
    text id PK
    text type "pregen|audit|vocab"
    text status "queued|running|done|error"
    int progress
    jsonb payload
    jsonb result
    timestamptz updated_at
  }
  audio_cache {
    text key PK "SHA-256"
    text language
    text text
    text model
    text voice
    text design_version
    jsonb parameters
    text file_path
  }
```

## 2. Hợp đồng đồng bộ (sync contract)

Client đăng nhập đồng bộ 4 nhóm dữ liệu học. **Offline-first**: localStorage luôn là nguồn ghi
trước; server là bản chân lý đám mây. Merge theo **last-write-wins từng item** (so `updated_at`).

### POST /api/sync/push
```json
{
  "srs": [{ "lang": "en", "term": "deadline", "meaning": "hạn chót", "vocabId": null,
            "state": "review", "intervalMs": 86400000, "dueAt": "2026-09-01T00:00:00Z",
            "reps": 3, "consecutiveGood": 2, "difficult": false, "mastered": false,
            "updatedAt": "2026-08-31T02:00:00Z" }],
  "mistakes": [{ "lang": "en", "skill": "writing", "pattern": "I am agree",
                 "correct": "I agree", "createdAt": "..." }],
  "progress": { "en": { "learned": 42, "due": 5, "mistakes": 7 },
                "zh": { "learned": 0, "due": 0, "mistakes": 0 } },
  "profile": { "goals": ["cong-viec"], "dailyMinutes": 15, "enRatio": 0.7,
               "ageGroup": "young-adult", "day": 12 },
  "teacherProfile": { "personality": "warm", "voices": { "en": "F4" }, "speed": 0.9 }
}
```
→ `200 { "accepted": { "srs": 12, "mistakes": 3 } }` (số item upsert thành công)

### GET /api/sync/pull
→ trả cùng shape (không có field thì rỗng). Client merge vào localStorage theo `updatedAt`.

### POST /api/sync/import-local (1 lần/máy)
Payload đúng **bản đồ key localStorage cũ**: `lv-srs`, `lv-mistakes`, `lv-profile`,
`lv-custom-vocab`, `lv-mined`, `lv-days`, `lingovoice-progress`, `lv-teacher-profile`.
Server map sang schema sync trên. Idempotent — gọi lại không nhân đôi.

## 3. Từ điển dữ liệu chuẩn

| Khái niệm | Kiểu | Ghi chú |
|---|---|---|
| `lang` | `en` \| `zh` | không có giá trị khác |
| `stage` tuổi | `preschool`(3–6) `child`(7–12) `teen`(13–17) `young-adult`(18–25) | đổi stage không reset dữ liệu |
| SRS state | `learning` `difficult` `review` `mastered` | master khi 3 lần liên tiếp Good+ |
| SRS interval | 1 phút / 1 ngày / 3 ngày / 10 ngày | SM-2-lite, xem `public/srs-core.cjs` |
| Placement level | 1–7 | overall 0–100, kèm skills con |
| teacherProfile.personality | `warm` \| `strict` \| `energetic` | speed 0.75–1.15 |
| vocab id | `en-{cefr}-{term}` \| `zh-{topic}-{term}` | khớp `docs/data-preparation.md` |
| attempt kind | `vocab` \| `listening` \| `writing` \| `speaking` \| `reading` \| `quiz` | nguồn gamification (XP: đúng +10, sai +2) |
| activity day | `YYYY-MM-DD` | múi giờ người học; lệch UTC tối đa +1 ngày |
| badge id | `first-day` `words-10` `words-50` `streak-7` `streak-30` `correct-50` `xp-500` `master-10` | test điều kiện là code thuần |

## 4. Chính sách dữ liệu

- Xóa account → xóa cascade toàn bộ dữ liệu learner (FK ON DELETE CASCADE).
- Dữ liệu trẻ em: chỉ lưu phục vụ học tập, không PII beyond username/display name.
- `audio_cache` có thể truncate lại bất cứ lúc nào (regenerate từ manifest).
- Phụ huynh chỉ thấy số liệu tiến độ (activity/SRS/mistakes tổng hợp) — không thấy mật khẩu,
  session, nội dung chat; liên kết do CON chủ động nhập mã.
