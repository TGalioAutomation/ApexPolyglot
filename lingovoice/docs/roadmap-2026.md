# Roadmap phát triển LingoVoice 2026 — 5 ý tưởng chủ lực

> Ưu tiên theo giá trị/người học ÷ công sức. Ý tưởng #1 đã triển khai trong đợt redesign nền tảng.

## #1 — Tài khoản + đồng bộ đa thiết bị ✅ (đợt này)
**Vấn đề:** dữ liệu học (SRS, lỗi sai, tiến độ) nằm 100% localStorage — đổi máy/xóa cache là mất.
**Giải pháp:** PostgreSQL + đăng nhập + `/api/sync/*` (offline-first, merge last-write-wins), import 1 lần dữ liệu cũ.
**Done khi:** học trên máy A, đăng nhập máy B là thấy đúng tiến độ.

## #2 — Nền tảng nội dung + Admin CMS
**Vấn đề:** bài học/tài liệu đọc/kịch bản roleplay đang hardcode trong `app.js`/`learning.js` — thêm nội dung phải đụng code + pregen audio.
**Giải pháp:** đưa `lessons/lesson_items/readings/roleplay_scenarios` vào DB (schema đã có sẵn trong migration 004); admin CMS soạn nội dung; pipeline AI soạn nháp → human review → duyệt (`reviewed`) → tự sinh audio pregen theo job.
**Giá trị:** giáo viên/quản trị tự thêm bài mà không cần dev; nội dung mới ra mắt trong ngày.
**Công sức:** L (3–4 tuần). **Phụ thuộc:** #1 (DB), admin auth role.

## #3 — Phòng gym phát âm + hội thoại real-time
**Vấn đề:** shadowing hiện chỉ dùng ASR client "đúng/sai" thô; gọi điện roleplay chưa chấm phát âm.
**Giải pháp:** ASR server (Whisper local hoặc OpenVox-adjacent) chấm phát âm theo từ (độ chính xác + nhấn nhá); streaming reply LLM + TTS chunk để giảm trễ hội thoại; chế độ "gym 5 phút/ngày" luyện âm khó riêng của từng learner (từ mistakes/SRS).
**Giá trị:** khác biệt cạnh tranh lớn nhất so với app flashcard thông thường.
**Công sức:** L (GPU/ASR server cần hạ tầng). **Phụ thuộc:** OpenVox mở rộng ASR hoặc thêm engine.

## #4 — Gamification + Dashboard phụ huynh
**Vấn đề:** stage 3–12 (trọng tâm sản phẩm) cần động lực + phụ huynh theo dõi; hiện chưa có streak/XP và không có góc nhìn cho phụ huynh.
**Giải pháp:** streak ngày học, XP theo attempt, huy hiệu mốc (10 từ đầu tiên, 7 ngày liền...); role `parent` đăng ký với mã liên kết con → dashboard tiến độ tuần (thời gian học, từ đã thuộc, lỗi sai hay gặp) + gợi ý đồng hành.
**Giá trị:** tăng retention nhóm nhỏ tuổi — nhóm khó giữ nhất; phụ huynh là người quyết trả tiền.
**Công sức:** M (1–2 tuần). **Phụ thuộc:** #1 (bảng users có sẵn role parent, attempts để tính XP).

## #5 — PWA offline + nhắc học
**Vấn đề:** webapp cần mạng để mở; học viên mất mạng (đường về quê, data cạn) là ngắt thói quen.
**Giải pháp:** service worker cache app shell + audio đã tải (storage quota theo stage), cài PWA lên màn hình chính; Web Push/notification nhắc giờ học theo `dailyMinutes` + múi giờ; đồng bộ nền khi có lại mạng (dựa trên sync #1).
**Giá trị:** giữ chuỗi học — chỉ số sống còn của app thói quen.
**Công sức:** M. **Phụ thuộc:** #1 (sync), #4 (streak).

## Thứ tự gợi ý
#1 ✅ → #4 (retention trẻ, công sức vừa) → #2 (nội dung là fuel) → #5 → #3 (hạ tầng nặng nhất, làm khi các nền tảng ổn).
