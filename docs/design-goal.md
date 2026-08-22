# LingoPilot — Design Goal

> Phiên bản: 1.0 · Loại: Product vision · Trạng thái: Foundational baseline  
> Owner: Product Lead · Ngày hiệu lực/cập nhật: 2026-08-15

## 1. Tầm nhìn

LingoPilot là một giáo viên ngôn ngữ cá nhân giúp người Việt luyện tiếng Anh và tiếng Trung mỗi ngày bằng một vòng lặp ngắn, rõ ràng và có phản hồi: **nghe → đọc → nói → nhận feedback → ôn lại**.

Mục tiêu của sản phẩm là giúp người học xây đủ năng lực và thói quen để hướng tới **level 7 trong 90 ngày**. “Level 7” là đích học tập/đo tiến bộ của sản phẩm, không phải cam kết trình độ cho mọi người; kết quả phụ thuộc nền tảng, thời lượng và tính đều đặn của từng người học.

## 2. Vấn đề cần giải quyết

Người học thường gặp bốn điểm nghẽn:

- Có nhiều tài liệu nhưng không biết hôm nay nên học gì.
- Học từ vựng và ngữ pháp nhưng ít nghe/nói trong ngữ cảnh thật.
- Không có giáo viên sửa lỗi ngay sau khi nói hoặc viết.
- Dễ bỏ cuộc vì không nhìn thấy tiến bộ theo từng ngày.

LingoPilot giải quyết bằng một kế hoạch 90 ngày có nhịp học cố định, bài ngắn theo mục tiêu và AI phản hồi ngay trong phiên học.

## 3. Người dùng mục tiêu

### Người dùng chính

Người Việt bận rộn, đang học tiếng Anh và/hoặc tiếng Trung ở trình độ cơ bản đến trung cấp, có thể dành khoảng 35 phút mỗi ngày và muốn ưu tiên giao tiếp thực tế.

### Nhu cầu cốt lõi

- Biết chính xác bài học hôm nay.
- Nghe được câu mẫu với giọng tự nhiên.
- Đọc hiểu đoạn ngắn có cấp độ phù hợp.
- Nói lại, ghi âm và nhận sửa lỗi dễ hiểu.
- Thấy streak, số phút, level và checkpoint thay đổi theo nỗ lực thật.

## 4. Kết quả mong muốn sau 90 ngày

Người học có thể:

1. Duy trì tối thiểu 35 phút học/ngày theo lịch cá nhân.
2. Nghe lấy ý chính và bắt được các cụm từ quen thuộc.
3. Đọc và tóm tắt các đoạn văn ngắn theo chủ đề đời sống.
4. Nói về bản thân, công việc, học tập, mua sắm, du lịch và quan điểm cá nhân.
5. Nhận biết lỗi lặp lại của chính mình và chủ động sửa ở lần nói sau.

## 5. Nguyên tắc thiết kế

### Nhỏ nhưng đều

Mỗi phiên phải bắt đầu được trong vài giây và hoàn thành trong 10–35 phút. Không biến dashboard thành danh sách nhiệm vụ quá tải.

### Ưu tiên đầu ra

Mỗi bài học phải tạo ra một sản phẩm quan sát được: một câu đã nghe, một câu trả lời đọc hiểu, một đoạn ghi âm hoặc một lỗi đã sửa.

### Hai ngôn ngữ, một nhịp học

English và 中文 dùng chung khung trải nghiệm nhưng nội dung, voice, language code và feedback phải đúng với từng ngôn ngữ. Không dịch máy một cách máy móc rồi gọi đó là bài học.

### AI hỗ trợ, người học quyết định

AI đề xuất bài, sửa lỗi và điều chỉnh độ khó; người học luôn nhìn thấy câu mẫu, lý do sửa và bước tiếp theo. Không dùng điểm AI như một phán quyết tuyệt đối.

### Phản hồi tích cực và cụ thể

Mỗi feedback nên gồm: một điểm làm tốt, một lỗi quan trọng nhất, một ví dụ sửa đúng và một câu để thử lại.

### Riêng tư theo mặc định

API key chỉ ở backend. Giọng OpenVox chạy local khi có thể. Audio, transcript và tiến độ chỉ được lưu khi người học biết rõ mục đích.

## 6. Trải nghiệm người dùng chính

### Màn hình Tổng quan

- Ngày hiện tại trong lộ trình 90 ngày.
- Streak, số phiên, số phút và level.
- Ba bài đề xuất: nghe, nói, đọc.
- AI Coach và nút tạo micro-lesson 10 phút.
- Roadmap ba chặng: Nền tảng, Bứt phá, Tự tin.

### Practice room

1. Người học chọn bài English hoặc 中文.
2. AI hiển thị mục tiêu của phiên.
3. Người học nghe câu mẫu bằng OpenVox local hoặc Speech Synthesis fallback.
4. Người học đọc/nghe lại và trả lời câu hỏi ngắn.
5. Người học ghi âm câu nói; browser Speech Recognition hoặc voice pipeline nhận transcript.
6. AI Coach phản hồi và cho câu thử lại.
7. Người học hoàn thành phiên; dashboard cập nhật progress.

## 7. Curriculum 90 ngày

### Chặng 1 — Nền tảng, ngày 1–30

- Phát âm, thanh điệu và nhịp câu.
- Câu cơ bản, giới thiệu bản thân, số và thời gian.
- 500 từ/cụm từ thiết yếu.
- Checkpoint: giới thiệu bản thân 60 giây bằng mỗi ngôn ngữ.

### Chặng 2 — Bứt phá, ngày 31–60

- Hội thoại đời thường và phản xạ câu hỏi.
- Đọc đoạn khoảng 250 từ.
- Shadowing, ghi âm và sửa lỗi thường gặp.
- Checkpoint: nói 3 phút và tóm tắt một bài đọc không nhìn ghi chú.

### Chặng 3 — Tự tin, ngày 61–90

- Nghe tốc độ tự nhiên hơn.
- Chủ đề công việc, du lịch, quan điểm và giải quyết tình huống.
- Feedback tinh về từ dùng, ngữ điệu và độ rõ.
- Checkpoint: hội thoại AI 10 phút và bản tự đánh giá.

### Nhịp học mỗi ngày — 35 phút

| Thời lượng | Kỹ năng | Hoạt động |
|---:|---|---|
| 12 phút | Nghe | Nghe hai lượt: ý chính rồi cụm từ quan trọng |
| 10 phút | Đọc | Đọc graded text và trả lời một câu hỏi |
| 10 phút | Nói | Shadowing, ghi âm, nhận feedback |
| 3 phút | Ôn | Lưu ba cụm từ vào lượt ôn sau |

## 8. Vai trò AI

Thiết kế logic AI theo các vai trò rõ ràng để dễ mở rộng:

- **Curriculum Planner:** chọn chủ đề, độ khó và kỹ năng cần ưu tiên theo ngày học.
- **Lesson Generator:** tạo micro-lesson 10 phút có câu mẫu, bài đọc và câu hỏi.
- **Conversation Coach:** giữ hội thoại và đưa câu hỏi tiếp theo phù hợp.
- **Error Coach:** phát hiện một hoặc hai lỗi quan trọng nhất, giải thích ngắn gọn.
- **Voice Adapter:** chọn model/language/voice hợp lệ từ OpenVox và tạo audio local.
- **Progress Evaluator:** tổng hợp số phiên, thời gian, độ hoàn thành và checkpoint; không tự nhận định trình độ nếu thiếu dữ liệu.
- **Assessment Engine:** vận hành test đầu vào và checkpoint bằng blueprint/rubric version hóa; tính điểm tách biệt với LLM.
- **Goal Controller:** biến skill gap thành tối đa ba yêu cầu học có thời lượng, tiêu chí thành công và evidence.

Trong MVP, `POST /api/coach` và `POST /api/lesson` dùng adapter Gemini/DeepSeek/OpenAI với deterministic fallback; `POST /api/assessment/start` và `/submit` phục vụ test; OpenVox được proxy qua `POST /api/voice`. LLM phân tích và diễn đạt kế hoạch nhưng không tự sửa điểm hoặc nâng level. Các vai trò có thể tách thành service/agent riêng khi sản phẩm có tài khoản và database.

## 9. Phạm vi hiện tại

### Đã có

- Dashboard responsive.
- Roadmap 90 ngày và curriculum JSON.
- Practice room nghe–đọc–nói.
- AI Coach và AI micro-lesson với mock fallback.
- Test đầu vào/test giai đoạn English–Chinese, điểm nghe–đọc–nói và yêu cầu học tự động.
- Provider AI Gemini/DeepSeek/OpenAI chọn bằng environment; API key chỉ ở server.
- OpenVox local TTS cho English/中文.
- Progress single-device bằng localStorage.
- Node server, Docker/Compose, health check và integration tests.

### Chưa nằm trong MVP

- Tài khoản nhiều thiết bị.
- Database và đồng bộ cloud.
- Chấm phát âm chuyên sâu theo phoneme/tone.
- Realtime voice conversation hai chiều.
- Hệ thống thanh toán hoặc marketplace giáo viên.

## 10. Chỉ số thành công

### Chỉ số sử dụng

- Tỷ lệ hoàn thành bài học hằng ngày.
- Số ngày active và độ dài streak.
- Số phút nghe/nói thực tế, không chỉ số lần mở app.
- Tỷ lệ người học quay lại ở ngày 7, 30 và 90.

### Chỉ số học tập

- Điểm câu hỏi đọc hiểu theo tuần.
- Số câu nói đã ghi âm và số lỗi lặp lại giảm theo thời gian.
- Checkpoint 60 giây, 3 phút và 10 phút.
- Tự đánh giá của người học trước/sau mỗi chặng.

### Chỉ số chất lượng AI

- Feedback có đúng ngôn ngữ và đúng ngữ cảnh không.
- Thời gian phản hồi của Coach.
- Tỷ lệ fallback khi OpenAI/OpenVox không sẵn sàng.
- Không để lộ secret hoặc gửi audio ra ngoài khi người dùng chọn local mode.

## 11. Acceptance criteria

Design goal được xem là đạt khi:

- Người mới có thể mở app và biết ngay bài hôm nay.
- Một phiên học có đủ ít nhất hai hoạt động trong nghe–đọc–nói và có bước hoàn thành.
- English và 中文 dùng được voice phù hợp hoặc có fallback rõ ràng.
- AI Coach luôn trả lời được ở mock mode; production mode không làm lộ API key.
- Test không gửi answer key xuống client và luôn trả kế hoạch fallback khi AI unavailable.
- Level chỉ thay đổi khi đủ evidence theo rubric, không theo nhận định tự do của LLM.
- Progress thay đổi sau khi hoàn thành phiên học.
- Curriculum 90 ngày có checkpoint đo được.
- App chạy local bằng `npm start`, health check trả `200`, test tích hợp pass.

## 12. Quyết định tiếp theo

1. Thêm onboarding để chọn trình độ ban đầu, mục tiêu và tỷ lệ English/中文.
2. Di chuyển progress từ localStorage sang database khi cần nhiều thiết bị.
3. Bổ sung transcript/audio upload có consent rõ ràng.
4. Tách các vai trò AI thành queue/service khi lượng người dùng tăng.
5. Chỉ triển khai public sau khi có auth, rate limit, logging an toàn và policy dữ liệu.
