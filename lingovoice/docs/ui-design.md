# Thiết kế UI LingoVoice

> Nguồn sự thật token: `design-system/lingovoice-lifelong/MASTER.md`. Tài liệu này mô tả
> cách áp dụng: luồng màn hình, hợp đồng DOM, asset, trạng thái hệ thống.

## 1. Design tokens (styles.css)

Toàn bộ màu/bo/shadow đi qua CSS variables, không hardcode hex:

- Màu nền tảng: `--primary #4F46E5`, `--accent #16A34A`, `--background #EEF2FF`, `--card #FFF`...
- Theming stage qua `body[data-stage="preschool|child|teen|young-adult"]` → cặp
  `--stage-accent` / `--stage-soft`: `#D97706/#FFF7ED`, `#0284C7/#F0F9FF`, `#7C3AED/#F5F3FF`, `#0F766E/#ECFDF5`.
- Typography: Be Vietnam Pro (heading) + Noto Sans (body), Google Fonts.
- Spacing scale `--space-xs..3xl` (4→64px), radius 18/24px, shadow 4 mức, `--touch-target: 48px`.
- Dark mode: các biến phải có sẵn trong `:root` block `[data-theme="dark"]` (triển khai nội dung sau — roadmap #5).

## 2. Bản đồ màn hình (SPA 8 tab)

| Tab | id panel | Nội dung chính | Trạng thái đặc biệt |
|---|---|---|---|
| Hôm nay | `#tab-today` | Plan ngày, streak, banner hành trình 90 ngày | trống → `empty-state-today.webp` + CTA bắt đầu |
| Lộ trình | `#tab-path` | Roadmap 3 chặng, next-best-action | — |
| Từ vựng | `#tab-vocab` | Flashcard SRS, **phiên học từ mới tích lũy (mới)**, quiz, sổ lỗi sai | hết từ mới → toast + gợi ý thêm từ |
| Viết | `#tab-writing` | Xếp chunk, chính tả, dịch ngược, viết tự do | — |
| Nói | `#tab-speaking` | 4 mode: Shadowing ASR, **Luyện phát âm (mới)**, gọi điện roleplay, trò chuyện Cô Linh | mất mic → hướng dẫn mở quyền; AI lỗi → vẫn xem được so-từng-từ ở client |
| Đọc | `#tab-reading` | Graded readers 3 mức, đọc theo câu | — |
| Nghe | `#tab-listening` | Nghe–chọn, nghe–viết | audio lỗi → `offline-audio.webp` |
| Thiết lập | `#tab-setup` | Profile, stage tuổi, giọng Cô Linh, **tài khoản + đồng bộ (mới)** | — |

Splash/onboarding lần đầu: `splash-illustration.webp` + 3 câu giới thiệu → nút bắt đầu.
Avatar mặc định: `default-learner-avatar.webp` trong profile và topbar.

### 2.1 Phiên học từ mới — kỹ thuật tích lũy (cumulative)

Vào từ nút "Học từ mới" (`#vsLearnStart` / `#vsLearnQuick` / next-best-action), luồng 3 màn
trong `#tab-vocab`, thay nhau hiển thị bằng `hideStudioPanes()`:

0. **Gói từ vựng** `#vs-packs` (tab "Gói từ vựng" trong studioTabs) — card từng chủ đề
   (`vsTopicStats`: tổng từ / số từ mới / thanh tiến độ đã học), nút "Học gói này" chọn gói
   rồi mở briefing. Gói đang chọn lưu `lv-learn-topic` ('all' hoặc tên chủ đề), áp dụng cho
   cả nút Học từ mới ở mọi nơi; gói không tồn tại ở ngôn ngữ hiện tại thì tự về 'all'.
1. **Briefing** `#vstudio-brief` — nói rõ số lượng ngay từ đầu: số to `#vsBriefCount`
   ("N từ mới"), hàng chip gói `#vsBriefTopic` ("Tất cả (143)" / "Công việc (89)"… chip
   gói hết từ mới bị disable), mỗi từ kèm 1 câu mẫu trong danh sách preview `#vsBriefList`
   (chỉ hiện term + câu gốc, giấu nghĩa để không lộ đáp án), chọn liều lượng 3/5/7 qua
   `#vsBriefBatch` (lưu `localStorage lv-learn-batch`), ước lượng thời gian, CTA
   `#vsBriefStart`. Từ lấy từ `vsNewWords()` = từ mới của gói đang chọn, xếp theo mục tiêu
   công việc rồi tần suất.
2. **Phiên** `#vstudio-session` — bước dựng từ `SRS.buildLearnSteps` (`public/srs-core.cjs`):
   xen kẽ **giới thiệu từ mới** (thẻ hiện ngay nghĩa + câu mẫu + audio, badge
   `#vsStepBadge` "Từ mới x/N", nút `#vsUnderstood`) với **kiểm tra tích lũy** (flashcard đoán
   nghĩa, badge "Kiểm tra tích lũy", chấm 4 mức SRS như ôn tập). Từ ghi "Lại" được xếp
   thêm 1 lần kiểm tra cuối phiên (ngân sách `recheckBudget` = 3). Progress text
   `#vsProgressText` luôn theo dạng "x/N từ mới". **Mỗi thẻ (cả giới thiệu lẫn sau khi lật
   đáp án) có khu luyện đọc/nói `#vsPron` (mới)**: chọn mục tiêu "Từ" hoặc "Câu mẫu"
   (`#vsPronTargets`), bấm `#vsPronPlay` "Nghe mẫu" để nghe đúng phát âm của mục tiêu đang
   chọn (audio pregen theo từ, thiếu thì fallback giọng thiết bị), bấm `#vsPronMic` đọc qua
   micro → so từng từ tại chỗ (pron-core,
   chip xanh/đỏ + điểm) → AI trả mẹo sửa (`POST /api/pronunciation/feedback`); đọc <90 điểm
   thì từ vào sổ lỗi, không ảnh hưởng thang điểm SRS của bước hiện tại. Nút "Nghe từ" /
   "Nghe từ chậm" trên thẻ đọc TỪ (term), không phải câu mẫu — từ vựng đều được pregen audio.
   Phím Space khi
   đang focus trên nút trong thẻ không lột thành "Đã hiểu".
3. **Tổng kết** `#vstudio-summary` — 3 ô số liệu (từ mới / lần kiểm tra tích lũy / lần cần
   học lại) + CTA "Học tiếp từ mới" / "Về kho từ".

Phiên dở lưu `lv-session` mở rộng trường `steps` + `stepIndex` (client-only, không sync) để
"Tiếp tục bài đang dở" quay lại đúng bước. Phím: Space = hiện đáp án / đã hiểu, 1–4 = đánh giá,
Esc = thoát (thoát giữa chừng vẫn giữ phiên).

## 3. Trạng thái hệ thống (bắt buộc cho mọi view tải dữ liệu)

| Trạng thái | Biểu hiện |
|---|---|
| Loading | Skeleton shimmer, không nhảy layout |
| Empty | Illustration + 1 câu tiếng Việt + CTA |
| Error | `error-retry.webp` + nút "Thử lại" — giữ nguyên input người dùng |
| Offline/audio lỗi | `offline-audio.webp` + tự fallback giọng máy |
| Đăng nhập/sync | Chip trạng thái trong setup: "Đã đồng bộ lúc HH:mm" / "Chưa đăng nhập — dữ liệu chỉ trên máy này" |

## 4. Hợp đồng DOM & a11y

- Nav: `#mainTabs` (top, `role="tablist"`) + `#bottomNav` (mobile). Panel: `#tab-*` `role="tabpanel"`.
- Test UI (`test/*-ui.test.mjs`) đọc các id/role/aria này — **không đổi** khi redesign; chỉ đổi visual.
- Nút icon phải có `aria-label`; focus `:focus-visible` rõ ràng; tương phản ≥ 4.5:1 với chữ nội dung.
- Mobile-first 360px; bottom-nav là điều hướng chính; mọi nút ≥ 48px.

## 5. Nguyên tắc tiếng (copy)

- Product copy **tiếng Việt**, xưng hô thân thiện theo stage (em/con — bạn/anh chị).
- Nội dung học EN/ZH giữ nguyên ngữ, hiển thị phân biệt rõ (font-weight + màu phụ đề).
- Yêu cầu vui nhộn chỉ tăng theo stage trẻ (3–12); stage 18–25 tối giản, uy tín.
