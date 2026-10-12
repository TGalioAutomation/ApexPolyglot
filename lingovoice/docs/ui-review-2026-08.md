# Báo cáo review UI/UX — LingoVoice (2026-08-31)

> Rà soát theo khung `uiux-design-review` (WCAG 2.1 AA + visual design + interaction)
> kết hợp `ui-ux-pro-max`, trên bản capture video 7 luồng (`videos/01..07.webm`, 390×844)
> + screenshot từng panel + kiểm tra DOM/CSS.

## A. Đã sửa trong đợt này

| # | Mức | Phát hiện | Bản sửa |
|---|---|---|---|
| A1 | **P0** | **Bài luyện nghe hiện luôn câu tiếng Anh** khi tạo câu mới (`startQuiz` mở `#quizText` ngay) + nhãn nút đã là "Nghe lại câu" trước khi nghe lần nào → luyện nghe biến thành luyện đọc, trái chính đề bài | Ẩn text tới khi trả lời xong (mở để đối chiếu sau khi chọn); nhãn "Nghe câu" chỉ đổi "Nghe lại câu" sau lần phát đầu (`app.js`) |
| A2 | **P1** | Quiz **tự phát audio** khi vào tab (autoplay bị trình duyệt chặn → kéo theo chip trạng thái nhảy màu cam oan) + vi phạm WCAG 1.4.2 (âm thanh ngoài ý muốn) | Bỏ autoplay; người học bấm "Nghe câu" chủ động |
| A3 | **P1** | Chip trạng thái âm thanh mobile thu thành chấm tròn, thông tin chỉ truyền bằng **màu chấm** (WCAG 1.4.1) | Badge "!" khi degraded/broken + `title` tooltip + bấm chip hiện toast giải thích (commit 31e3833) |
| A4 | **P2** | Toast thông báo đè lên FAB Cô Linh + vùng CTA đáy màn ở 390px | Toast mobile nâng lên `bottom: 170px` |
| A5 | **P2** | Keycap "Space" trong nút primary: nền sáng + chữ trắng → chìm chữ | Keycap nền trắng mờ trên nút tối (commit ca52f65) |
| A6 | **P2** | Banner lỗi/thẻ offline đè nút hành động đáy màn | Chuyển lên dưới topbar; lệch vị trí nhau khi cùng hiện (commit 936e7cf) |
| A7 | **P3** | Nút đóng banner lỗi 32px (< chuẩn 44px target); chữ stage-rail 9.5px quá nhỏ | Nút 40px; chữ 11px |
| A8 | **P3** | Thông báo lỗi form tài khoản dùng `role=status` — screen reader không đọc ngay | Chuyển `role=alert` khi lỗi (WCAG 3.3.1) |

## B. Khuyến nghị — ĐÃ SỬA theo yêu cầu (cùng đợt)

| # | Mức | Bản sửa | Kiểm chứng |
|---|---|---|---|
| B1 | P2 | Dock Cô Linh thêm **nút thu gọn/mở rộng** (`#teacherMin`, mũi tên + aria-expanded): chế độ min ẩn chat/context/prompts/input, panel còn dải header ~81px | Click thật: 476px → 81px, `.teacher-chat` display:none, aria-label đổi chiều |
| B2 | P3 | Footer dock đổi "AI: deepseek" → **"Giáo viên AI sẵn sàng / chưa cấu hình"** — không lộ provider cho learner | DOM check text mới |
| B3 | P3 | Tab Thiết lập thêm **dải chip điều hướng section** (Hồ sơ · Test đầu vào · Tài khoản · Cô Linh), cuộn mượt tới section | Click chip gọi đúng `scrollIntoView({behavior:'smooth', block:'start'})` (instrument proof) |
| B4 | P3 | Thêm **skip-link** "Tới nội dung chính" (hiện khi focus, target `#main-content` tabindex=-1) — WCAG 2.4.1 | Rule `.skip-link:focus` có trong CSSOM; focus() đặt activeElement đúng |
| B5 | P3 | Onboarding **hỏi độ tuổi trước ô tên** (fieldset age-picker chuyển lên đầu) | Test assert thứ tự onboardAgePicker < onboardName |
| B6 | P3 | **Dark mode v1**: segmented control "Theo hệ thống / Sáng / Tối" (`lv-theme`), áp `data-theme` lên `<html>`, theo hệ-mặc-định qua matchMedia; sửa đảo màu toast + skeleton | Toggle chuyển đổi thật: body #17174A / card #1F1F5C ở chế độ Tối, trả về #EEF2FF khi Sáng |

> Ghi chú B6: dark v1 phủ các bề mặt chính (body, card, topbar, nav, form) qua token;
> tinh chỉnh góc khuất (ảnh minh họa viền sáng, grade chip, chart) vẫn thuộc roadmap #5.
> Lưu ý kiểm chứng: phiên này guest trình duyệt bị nền throttle (`document.hasFocus()=false`,
> native `scrollTo` không di chuyển) nên phần verify cuối dựa vào DOM/computed-style + instrument
> thay vì screenshot; đã xác nhận cùng nguyên nhân với lỗi input tạm thời của môi trường, không phải code.

## C. Những gì đạt (không cần sửa)

- Design token nhất quán (indigo/green + stage accent), bo góc/shadow theo MASTER.md.
- Điều hướng kép top-nav + bottom-nav rõ ràng, active state đúng `aria-current`.
- Flashcard SRS: luồng hiện đáp án → 4 nút chấm có nhãn + phím tắt, contrast tốt.
- Empty/error/offline states có minh họa + CTA, không dead-end.
- Touch target các nút chính ≥ 48px; focus-visible toàn cục.
- Bản ghi video kiểm chứng: `videos/01-today` → `07-onboarding`.
