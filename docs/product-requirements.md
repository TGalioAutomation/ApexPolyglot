# LingoPilot — Product Requirements Document

## 0. Kiểm soát tài liệu

| Thuộc tính | Giá trị |
|---|---|
| Tên tài liệu | Product Requirements Document — LingoPilot |
| Mã tài liệu | LP-PRD-001 |
| Phiên bản | 1.0 |
| Trạng thái | Production specification baseline; chờ named-owner approval trước implementation |
| Ngày lập | 2026-08-15 |
| Product owner | Product Owner LingoPilot — cần chỉ định tên người chịu trách nhiệm |
| Document owner | Senior Product Manager |
| Nhóm phê duyệt bắt buộc | Product, Learning/Content, Engineering, Design, Data/Analytics, Security/Privacy |
| Phạm vi | Web/PWA production học tiếng Anh và tiếng Trung cho người Việt |
| Nguồn chuẩn | `docs/design-goal.md`, `docs/full-product-design.md`, `README.md`, `curriculum.json` |
| Chu kỳ rà soát | Trước mỗi release gate và khi thay đổi curriculum, rubric, provider AI/voice hoặc entitlement |

### 0.1 Lịch sử phiên bản

| Phiên bản | Ngày | Người thay đổi | Nội dung |
|---|---|---|---|
| 1.0 | 2026-08-15 | Senior Product Manager | Hợp nhất mục tiêu, thiết kế tổng thể và curriculum thành PRD production-grade |

### 0.2 Quy ước trạng thái yêu cầu

- **Must:** bắt buộc để phát hành đúng scope của mốc tương ứng.
- **Should:** ưu tiên cao nhưng có thể tách release nếu Product Owner chấp thuận bằng văn bản.
- **Could:** cải tiến, không chặn release.
- **Out:** không thuộc phạm vi mốc đang xét.
- Mỗi yêu cầu chức năng có một ID duy nhất dạng `FR-xxx`. ID không được tái sử dụng sau khi yêu cầu bị hủy.
- `MVP`, `V1`, `V2` trong cột Release là mốc sớm nhất yêu cầu phải có.

### 0.3 Quy tắc nguồn sự thật

1. PRD này là nguồn chuẩn cho yêu cầu sản phẩm production.
2. `curriculum.json` hiện mô tả nhịp học mẫu; curriculum production phải được version hóa và quản trị bằng content system.
3. Code và test phản ánh trạng thái triển khai; không tự chứng minh rằng mọi yêu cầu trong PRD đã hoàn thành.
4. Khi tài liệu mâu thuẫn, Product Owner phải lập quyết định thay đổi. Không âm thầm thay đổi triết lý học tập hoặc quy tắc level.

## 1. Tóm tắt sản phẩm

LingoPilot là webapp/PWA giáo viên ngôn ngữ cá nhân dành cho người Việt học tiếng Anh và tiếng Trung, ưu tiên nghe, đọc và nói. Sản phẩm kết hợp lộ trình 90 ngày, bài học ngắn, đánh giá theo bằng chứng, ôn lặp lại ngắt quãng và AI tutor có cấu trúc.

Vòng lặp cốt lõi:

```text
Xác định mục tiêu → đánh giá đầu vào → nhận kế hoạch hôm nay
→ nghe/đọc trong ngữ cảnh → nói thành tiếng → nhận feedback
→ thử lại → lưu lỗi và cụm từ → ôn đúng lúc → checkpoint → điều chỉnh kế hoạch
```

Giá trị hứa hẹn là: **mở app biết cần làm gì; kết thúc phiên biết đã tiến bộ ở đâu và cần làm gì tiếp theo**.

Lộ trình 90 ngày định hướng thói quen và bằng chứng năng lực. Kết quả phụ thuộc baseline, thời lượng, chất lượng luyện tập và tính đều đặn; sản phẩm không cam kết mọi người học đạt cùng một trình độ sau 90 ngày.

## 2. Triết lý sản phẩm và học tập

### 2.1 Học để thực hiện nhiệm vụ

Mỗi lesson phải kết thúc bằng một đầu ra quan sát được: câu trả lời nghe hiểu, câu trả lời đọc hiểu, đoạn nói, lượt hội thoại, bài sửa lỗi hoặc bằng chứng ôn tập. Nội dung chỉ có giá trị khi giúp người học thực hiện một `can-do outcome`.

### 2.2 Nhỏ, đều và có chủ đích

- Phiên chuẩn là 35 phút; hỗ trợ ngân sách 15, 25, 35 hoặc 50 phút.
- Người học phải bắt đầu được trong vài giây với một next-best-action rõ ràng.
- Hệ thống không tạo backlog vô hạn sau ngày nghỉ và không phạt nặng vì bỏ lỡ một ngày.

### 2.3 Ưu tiên đầu ra và retry

- Mỗi lesson chính phải có hoạt động tạo output.
- Feedback chưa hoàn thành vòng học cho đến khi người học có cơ hội thử lại.
- Một lượt sửa tập trung vào lỗi ảnh hưởng giao tiếp nhiều nhất thay vì liệt kê mọi lỗi.

### 2.4 AI là giáo viên hỗ trợ, không phải trọng tài tuyệt đối

- AI lập kế hoạch, giải thích, tạo ví dụ, điều phối hội thoại và diễn đạt feedback.
- Scoring engine, rubric version hóa và evidence mới quyết định điểm, prerequisite và điều kiện tăng level.
- Khi confidence thấp, hệ thống yêu cầu thêm bằng chứng; không phán đoán chắc chắn.

### 2.5 Hai ngôn ngữ, một trải nghiệm, hai logic sư phạm

English và Chinese dùng chung app shell, plan, review và progress model nhưng có content, voice, exercise và rubric riêng. Nội dung không được tạo bằng cách dịch máy đơn thuần từ ngôn ngữ còn lại.

### 2.6 Riêng tư và minh bạch theo mặc định

- Key của Gemini, DeepSeek, OpenAI và provider khác chỉ tồn tại ở server/secret store.
- Voice local qua OpenVox được ưu tiên khi người dùng chọn local mode và hệ thống khả dụng.
- Người dùng biết khi nào nội dung/feedback do AI tạo, dữ liệu nào được lưu và vì mục đích gì.
- Raw audio chỉ được lưu sau lựa chọn rõ ràng; chính sách retention cụ thể là quyết định cần được duyệt trước public release.

### 2.7 Động lực không thao túng

- Streak, XP và badge củng cố nỗ lực học có ý nghĩa.
- Evidence và meaningful practice quan trọng hơn số click.
- Không ép leaderboard, không bán cơ chế gây tội lỗi, không cho farm XP bằng bài quá dễ.

### 2.8 Khả năng tiếp cận là chức năng cốt lõi

Luồng chính phải dùng được bằng bàn phím, screen reader, caption/transcript và reduced motion. Accessibility không bị khóa sau gói trả phí.

## 3. Bài toán, tầm nhìn và định vị

### 3.1 Bài toán người dùng

Người học mục tiêu thường gặp các vấn đề:

1. Có nhiều tài liệu nhưng không biết hôm nay nên học gì.
2. Tích lũy từ vựng/ngữ pháp nhưng thiếu luyện nghe và nói trong ngữ cảnh.
3. Không được sửa lỗi ngay hoặc feedback quá chung chung.
4. Dễ bỏ cuộc vì chỉ thấy streak/điểm game, không thấy bằng chứng tiến bộ.
5. Khi học hai ngôn ngữ, thời gian dễ phân bổ lệch và tiến độ khó theo dõi.
6. Chatbot tự do có thể thú vị nhưng thiếu curriculum, mục tiêu và chất lượng ổn định.

### 3.2 Tầm nhìn

Mỗi người học có một giáo viên ngôn ngữ hiểu mục tiêu, lịch sống, lỗi lặp lại, khả năng hiện tại và cách họ tiến bộ tốt nhất.

### 3.3 Định vị

LingoPilot dành cho người Việt bận rộn muốn giao tiếp tiếng Anh và/hoặc tiếng Trung. Sản phẩm khác app flashcard thuần túy và chatbot không curriculum bằng việc kết hợp lộ trình có cấu trúc, voice-first practice, assessment có rubric và kế hoạch tự điều chỉnh theo evidence.

### 3.4 Nguyên tắc khác biệt hóa

- Next-best-action thay vì thư viện khiến người dùng phải tự chọn quá nhiều.
- Feedback có retry thay vì chấm điểm một chiều.
- Local-first voice option qua OpenVox, có cloud/browser fallback minh bạch.
- Error portfolio và phrase-in-context thay vì danh sách từ rời rạc.
- Một learner model cho hai ngôn ngữ nhưng mastery tách theo language × skill × modality.

## 4. Mục tiêu và non-goals

### 4.1 Mục tiêu sản phẩm

- Tạo thói quen luyện nghe–đọc–nói có chất lượng trong 90 ngày.
- Giảm thời gian quyết định “hôm nay học gì” xuống một hành động chính.
- Tăng số phút luyện tập có ý nghĩa và số lần người học thử lại sau feedback.
- Đo tiến bộ bằng assessment, retention và artifact, không chỉ bằng hoạt động bề mặt.
- Cung cấp giáo viên AI nhất quán, có guardrail, hoạt động được khi một provider lỗi.
- Xây nền tảng có thể mở rộng từ prototype local sang tài khoản, đồng bộ và subscription production.

### 4.2 Non-goals

- Không cấp chứng chỉ CEFR, IELTS, TOEIC, HSK hoặc chứng chỉ chính thức khác.
- Không tuyên bố Level 1–7 tương đương trực tiếp với CEFR/HSK.
- Không bảo đảm mọi người đạt Level 7 trong 90 ngày.
- Không thay thế giáo viên, chuyên gia trị liệu giọng nói hoặc đánh giá thi chính thức.
- Không xây marketplace giáo viên trong MVP/V1.
- Không mở cộng đồng nhắn tin tự do trước khi có moderation và safety controls.
- Không hỗ trợ Traditional Chinese ở MVP/V1; Simplified Chinese là mặc định.
- Không đánh giá phát âm/tone từ transcript đơn thuần.
- Không lưu vô hạn raw audio, transcript hoặc conversation memory.
- Không triển khai B2B/team administration trong MVP/V1 trừ khi scope được phê duyệt lại.

## 5. Personas và Jobs to be Done

### 5.1 Persona P1 — Người đi làm bận rộn

- 22–40 tuổi, tiếng Việt là ngôn ngữ giao diện chính.
- Có 15–40 phút/ngày, lịch học dễ bị gián đoạn.
- Học English cho công việc; Chinese cho giao tiếp, kinh doanh hoặc du lịch.
- Đã bỏ dở một hoặc nhiều app; ngại nói trước người thật.
- Thành công khi có thể duy trì lịch, xử lý tình huống thật và nhận ra lỗi đang giảm.

JTBD:

- Khi chỉ có 15 phút, hãy chọn bài tạo tác động cao nhất cho tôi.
- Khi tôi nói sai, hãy sửa một lỗi quan trọng và cho tôi nói lại ngay.
- Khi tôi bỏ lỡ một ngày, hãy xếp lại lịch mà không tạo cảm giác thất bại.
- Khi tôi học hai ngôn ngữ, hãy bảo vệ tỷ lệ thời gian tôi đã chọn.

### 5.2 Persona P2 — Người chuẩn bị phỏng vấn, công việc hoặc kỳ thi

- Có mốc thời gian, chủ đề và kỹ năng ưu tiên rõ.
- Muốn rehearsal, checkpoint, rubric và kế hoạch cụ thể.
- Cần phân biệt bài luyện trong app với đánh giá/chứng chỉ chính thức.

JTBD:

- Khi sắp phỏng vấn/thuyết trình, hãy tạo tình huống gần thực tế và chỉ ra gap.
- Khi checkpoint chưa đạt, hãy giao bài phục hồi tập trung thay vì bắt học lại toàn bộ.
- Khi xem tiến độ, hãy cho tôi evidence và xu hướng, không chỉ một con số.

### 5.3 Persona P3 — Người học lại từ đầu

- Có kiến thức rời rạc, thiếu tự tin và không chắc baseline.
- Cần placement ít áp lực, giải thích tiếng Việt và hint có thể giảm dần.

JTBD:

- Khi bắt đầu, hãy xác định điểm học phù hợp mà không làm tôi thấy bị đánh giá.
- Khi ASR nghe sai, hãy cho tôi xác nhận transcript trước khi chấm.
- Khi mic không dùng được, hãy cho phương án tiếp tục nhưng nói rõ giới hạn đánh giá.

### 5.4 Persona P4 — Content/Learning Operator

- Xây curriculum, rubric, lesson và golden set.
- Cần draft/review/publish/rollback, audit trail và preview theo learner profile.

JTBD:

- Khi AI tạo bài, hãy bắt buộc qua schema, validation và review phù hợp trước khi publish.
- Khi phát hiện bài sai, hãy unpublish hoặc rollback mà không làm mất lịch sử.

### 5.5 Persona P5 — Support/Moderator/Admin

- Xử lý report, sự cố tài khoản, subscription và nội dung.
- Chỉ cần quyền tối thiểu theo nhiệm vụ và mọi hành động nhạy cảm phải có audit log.

## 6. Outcomes và KPI

### 6.1 North-star metric

**Meaningful Practice Minutes (MPM) mỗi active learner mỗi tuần**: thời gian thực sự dành cho nghe có mục đích, đọc hiểu, nói, retry hoặc ôn chủ động. Không tính thời gian idle, dashboard, animation hoặc audio chạy nền không có tương tác.

### 6.2 Outcome framework

| Outcome | KPI | Định nghĩa | Mục tiêu release |
|---|---|---|---|
| Activation | First Spoken Output Rate | % người onboarding hoàn tất một spoken output trong 24 giờ | Baseline ở Beta; target do Product/Data duyệt sau pilot |
| Habit | Weekly Goal Completion | % active learner đạt mục tiêu phút/tuần | Đo từ Beta |
| Engagement quality | MPM/WAU | Tổng MPM / weekly active learner | North-star; không đặt claim trước dữ liệu |
| Feedback efficacy | Retry-after-feedback rate | % feedback hợp lệ dẫn đến ít nhất một retry | Đo từ Alpha |
| Learning retention | 7-day/30-day item retention | % item recall/production đạt rubric sau 7/30 ngày | Đo từ Beta |
| Error repair | Error recurrence trend | Tỷ lệ lỗi lặp lại theo pattern qua các tuần | Xu hướng giảm; ngưỡng sau pilot |
| Skill growth | Checkpoint improvement | Chênh điểm theo blueprint/rubric tương thích | Đo theo language và baseline |
| Reliability | Crash-free sessions | % session không crash | ≥99,5% trước Public V1 |
| AI quality | Valid structured output | % AI response qua schema/validator hoặc fallback an toàn | Target do Engineering/AI QA chốt trước Beta |
| Voice quality | Voice successful turn rate | % voice turn hoàn tất không cần bỏ phiên | Theo local/cloud/browser route |
| Trust | AI content report rate | Report hợp lệ trên 1.000 AI outputs | Guardrail, không tối ưu bằng cách che nút report |

### 6.3 Retention và funnel

Funnel chuẩn:

```text
Open → onboarding → placement → plan created → first lesson
→ first spoken output → D2 return → week-1 checkpoint
→ day-30 checkpoint → day-60 checkpoint → day-90 completion
```

Theo dõi D1, D7, D30 và day-90 completion theo cohort, ngôn ngữ, baseline, plan minutes và acquisition source. Không kết luận hiệu quả học tập chỉ từ retention.

### 6.4 KPI guardrails

Không ship experiment tăng click/retention nếu làm giảm MPM, spoken output, retry, accessibility, consent clarity, learning difficulty phù hợp hoặc tăng content report/error có ý nghĩa.

## 7. Phạm vi release

### 7.1 MVP — Product foundation

Mục tiêu: thay prototype thành nền tảng production tối thiểu, có người dùng và dữ liệu server-side.

Bao gồm:

- Web/PWA responsive, UI tiếng Việt.
- Auth, profile, chọn English/Chinese/cả hai, timezone và study budget.
- Placement 5–8 phút/ngôn ngữ; plan tuần đầu.
- Curriculum/path 30 ngày cho cả hai ngôn ngữ, lesson player nghe–đọc–nói cơ bản.
- Today next-best-action, progress, streak có recovery, session/attempt tracking.
- Assessment deterministic, checkpoint ngày 7/14/30, tối đa ba learning requirements.
- AI tutor Gemini/DeepSeek/OpenAI/demo qua server adapter, JSON schema và fallback.
- OpenVox local TTS + browser/cloud fallback được cấu hình; mic denial fallback.
- Basic SRS, mistakes, consent, report AI content, observability và admin content read/publish tối thiểu.
- Free plan duy nhất hoặc feature flags nội bộ; chưa thu tiền thật nếu billing chưa sẵn sàng.

### 7.2 V1 — Learning core và public readiness

- Curriculum đủ 90 ngày cho English và Chinese.
- Full reader/listener, phrase mining, error notebook, weekly/phase checkpoint.
- English pronunciation analyzer và Chinese tone analyzer dựa trên audio đủ chất lượng.
- AI conversation guided/roleplay/free với transcript, feedback, retry.
- Đồng bộ nhiều thiết bị, offline content cơ bản, notification preferences.
- Subscription Free/Pro, entitlement service, billing provider và self-service account state.
- Admin CMS đầy đủ, rubric/versioning, golden-set eval, audit, monitoring, backup/runbook.
- Data export/delete workflow và tài liệu privacy/terms đã được chuyên gia phù hợp rà soát trước public launch; PRD không khẳng định tuân thủ luật cụ thể.

### 7.3 V2 — Scale, content ecosystem và community có kiểm soát

- Realtime streaming voice tối ưu latency.
- Personal content import URL/text/audio với quyền sử dụng/attribution workflow.
- Community correction có reputation, report/block, moderation và giới hạn messaging.
- Offline packs nâng cao, challenge/friend accountability tùy chọn.
- Traditional Chinese nếu có business case và learning review.
- B2B/team, marketplace hoặc advanced exam tracks chỉ sau discovery riêng.

### 7.4 Ngoài phạm vi hiện tại

- Native mobile app độc lập.
- Chứng chỉ chính thức.
- Livestream/classroom đồng bộ.
- Marketplace giáo viên.
- Mạng xã hội mở.
- Tư vấn nhập cư, pháp lý, y tế hoặc nghề nghiệp chuyên môn qua AI tutor.

## 8. Vai trò người dùng và quyền

### 8.1 Vai trò

| Vai trò | Mô tả |
|---|---|
| Guest | Chưa đăng nhập; xem landing/demo giới hạn |
| Learner | Người học có tài khoản; Free/Pro là entitlement, không phải role |
| Content Editor | Soạn curriculum/lesson/item ở trạng thái draft |
| Learning Reviewer | Review chuyên môn, rubric và duyệt nội dung học |
| Moderator | Xử lý report/community content ở V2 |
| Support | Hỗ trợ tài khoản; không xem raw learning data nếu không cần |
| Billing Admin | Xử lý billing/refund qua công cụ được cấp quyền |
| Admin | Cấu hình hệ thống giới hạn; chỉ emergency rollback, không thay Learning Reviewer trong publish thường lệ |
| Auditor | Read-only trên audit/aggregate analytics phù hợp |

### 8.2 Ma trận quyền tối thiểu

| Khả năng | Guest | Learner | Editor | Reviewer | Moderator | Support | Billing | Admin | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dùng demo không lưu | ✓ | ✓ | — | — | — | — | — | — | — |
| Quản lý hồ sơ cá nhân | — | Own | — | — | — | Assisted | — | Scoped | Read audit |
| Học và xem evidence | — | Own | Preview | Preview | — | Không mặc định | — | Không mặc định | Aggregate |
| Soạn nội dung | — | — | ✓ | ✓ | — | — | — | Theo quyền | Read |
| Publish curriculum/rubric | — | — | — | ✓ | — | — | — | Emergency rollback | Read |
| Xử lý content report | — | Own report | — | Learning report | Community | Intake | — | Escalation | Read |
| Xem raw audio/transcript | — | Own | Chỉ asset test | Chỉ asset test | Khi report và có quyền | Không mặc định | — | Break-glass | Audit metadata |
| Quản lý subscription | — | Own self-service | — | — | — | View scoped | ✓ | Configure | Read |
| Sửa score/level | — | — | — | Không trực tiếp | — | — | — | Không trực tiếp | Read |
| Xem audit log | — | Own history hạn chế | Own action | Content audit | Moderation audit | Support audit | Billing audit | ✓ | ✓ |

### 8.3 Nguyên tắc phân quyền

- Least privilege, deny-by-default và tách quyền author/reviewer với nội dung quan trọng.
- Không cho nhân sự hỗ trợ tự sửa điểm hoặc level. Sai dữ liệu được xử lý bằng quy trình correction có reason và audit.
- Break-glass access phải có lý do, thời hạn và audit; chi tiết vận hành do Security phê duyệt.
- Analytics dùng dữ liệu tổng hợp/pseudonymous khi không cần nhận diện người dùng.

## 9. Quy tắc nghiệp vụ

| ID | Quy tắc |
|---|---|
| BR-001 | Level 1–7 là thang nội bộ LingoPilot, không phải chứng chỉ và không ánh xạ trực tiếp sang CEFR/HSK trong UI marketing. |
| BR-002 | Level được lưu riêng theo ngôn ngữ; tiến bộ English không tự tăng level Chinese và ngược lại. |
| BR-003 | Tăng level cần đủ skill units bắt buộc, retention evidence sau ít nhất 7 ngày, checkpoint nghe/đọc đạt rubric và speaking checkpoint có feedback + retry. |
| BR-004 | XP, streak, thời gian mở app hoặc đề xuất của LLM không đủ để tăng level. |
| BR-005 | Placement có thể chọn unit bắt đầu nhưng không cấp chứng nhận hoàn thành path. |
| BR-006 | Điểm tổng mặc định: listening 30%, reading 35%, speaking 35%; thay đổi trọng số phải version rubric. |
| BR-007 | Answer key và scoring rule bảo mật không được trả về client trước khi submit. |
| BR-008 | LLM được diễn đạt feedback nhưng không sửa điểm deterministic hoặc level state. |
| BR-009 | Speaking chỉ từ transcript phải gắn nhãn sơ bộ; pronunciation/tone chỉ chấm từ audio đủ chất lượng. |
| BR-010 | Nếu ASR confidence thấp, yêu cầu learner xác nhận transcript trước khi dùng cho feedback ngôn ngữ. |
| BR-011 | Audio quá ngắn, clipping hoặc nhiễu cao không được chấm pronunciation/tone; hệ thống yêu cầu thu lại hoặc tiếp tục không có score đó. |
| BR-012 | Sau assessment, Goal Controller xuất tối đa ba yêu cầu active ưu tiên và không vượt ngân sách học ngày. |
| BR-013 | Requirement phải có skill, reason, task, minutes, success criterion, due window và evidence type. |
| BR-014 | Task bỏ lỡ được reschedule có giới hạn; không cộng dồn backlog vô hạn. |
| BR-015 | Checkpoint chuẩn ở ngày 7, 14, 30, 45, 60, 75 và 90; vắng mặt dẫn tới reschedule, không tự đánh fail. |
| BR-016 | Recovery test tập trung skill gap sau hai checkpoint chưa đạt; không bắt học lại toàn bộ mặc định. |
| BR-017 | Daily plan chuẩn 35 phút gồm review, listening, reading, speaking và reflection; plan rút gọn vẫn phải có output. |
| BR-018 | Sunday/recovery day không làm mất streak nếu weekly goal đã đạt. |
| BR-019 | Dashboard hiển thị tối đa ba task chính và một primary CTA. |
| BR-020 | Mỗi feedback chuẩn có: điều làm tốt, một priority fix, better version, giải thích ngắn và retry prompt. |
| BR-021 | Review ưu tiên phrase/sentence trong ngữ cảnh hơn từ đơn; mastery cần hiểu và dùng trong tối thiểu hai ngữ cảnh. |
| BR-022 | Pinyin có thể bật/tắt và mặc định ẩn sau Foundation; Hanzi là chính. |
| BR-023 | Simplified Chinese là mặc định ở MVP/V1; handwriting là optional và không chặn speaking path. |
| BR-024 | Mục tiêu English pronunciation là intelligibility, không ép accent bản ngữ. |
| BR-025 | Provider AI được chọn ở server; client không nhận key hoặc secret. |
| BR-026 | Auto provider ưu tiên theo cấu hình có key và health; provider lỗi được fallback có giới hạn, không retry vô hạn. |
| BR-027 | AI output dùng schema, validation và deterministic fallback cho flow bắt buộc. |
| BR-028 | AI/voice outage không làm mất attempt đã lưu hoặc chặn toàn bộ bài nếu có phương án degraded. |
| BR-029 | Local voice mode không gửi text/audio sang cloud TTS; route thực tế phải hiển thị đủ để người dùng hiểu. |
| BR-030 | Raw audio chỉ lưu khi có lựa chọn rõ ràng; retention duration phải cấu hình và được phê duyệt trước public release. |
| BR-031 | Privacy controls, accessibility, core progress, basic placement result và report AI error không bị khóa paywall. |
| BR-032 | Subscription entitlement do server quyết định; UI client không phải nguồn sự thật. |
| BR-033 | Hạ gói không xóa dữ liệu học; tính năng Pro bị khóa theo thời điểm entitlement kết thúc và policy billing được hiển thị. |
| BR-034 | Nội dung published phải có language, version, owner, can-do outcome, level nội bộ, schema validation và review status. |
| BR-035 | Thay curriculum/rubric không được sửa ngược lịch sử attempt; run cũ giữ version đã dùng. |
| BR-036 | AI content report có thể tạo từ màn hình feedback/lesson và liên kết đúng prompt/content version. |
| BR-037 | Community chỉ mở sau moderation, report/block và human escalation; messaging mở không bật mặc định. |
| BR-038 | Không log Authorization header, API key, raw audio hoặc dữ liệu riêng tư không cần thiết. |
| BR-039 | Idempotency áp dụng cho submit assessment, complete session và webhook billing để tránh ghi trùng. |
| BR-040 | Tất cả thời gian kế hoạch, streak và notification dùng timezone trong profile, có xử lý đổi timezone. |

## 10. Yêu cầu chức năng

### 10.1 Tài khoản, onboarding và profile

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-001 | Hệ thống phải cho Guest xem landing và trải nghiệm demo không lưu dữ liệu cá nhân lâu dài. | MVP | Must |
| FR-002 | Hệ thống phải hỗ trợ tạo tài khoản, đăng nhập, đăng xuất và khôi phục quyền truy cập bằng cơ chế auth production được chọn. | MVP | Must |
| FR-003 | Hệ thống phải duy trì phiên đăng nhập an toàn và đồng bộ trạng thái đăng xuất giữa các tab. | MVP | Must |
| FR-004 | Learner phải chọn English, Chinese hoặc cả hai trong onboarding. | MVP | Must |
| FR-005 | Learner phải chọn mục tiêu học: giao tiếp, công việc, du lịch, thi/luyện tập hoặc đọc nội dung; cho phép cập nhật sau. | MVP | Must |
| FR-006 | Learner phải chọn ngân sách 15/25/35/50 phút, ngày học, khung giờ và timezone. | MVP | Must |
| FR-007 | Khi học hai ngôn ngữ, learner phải chọn tỷ lệ 50/50, 70/30, 30/70 hoặc custom hợp lệ tổng bằng 100%. | MVP | Must |
| FR-008 | Onboarding phải cung cấp self-assessment và placement riêng cho từng ngôn ngữ, có thể skip với cảnh báo về độ chính xác kế hoạch. | MVP | Must |
| FR-009 | Onboarding phải có microphone/voice check, giải thích quyền truy cập và cho phép skip. | MVP | Must |
| FR-010 | Hệ thống phải tạo learning profile, language profiles, study plan và day-1 session sau onboarding. | MVP | Must |
| FR-011 | Learner phải xem và cập nhật goal, schedule, language allocation, correction style, voice và privacy preferences. | MVP | Must |
| FR-012 | Hệ thống phải lưu current level tách biệt theo ngôn ngữ và chỉ hiển thị với nhãn “thang nội bộ LingoPilot”. | MVP | Must |
| FR-013 | Learner phải có thể xem, export và yêu cầu xóa dữ liệu/learner memory qua luồng có xác nhận; thời gian xử lý do policy được duyệt quy định. | V1 | Must |
| FR-014 | Hệ thống phải hỗ trợ đóng tài khoản với màn hình mô tả tác động, trạng thái subscription và bước xác nhận. | V1 | Must |

### 10.2 Today, plan và learning path

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-015 | Today phải hiển thị Day x/90, weekly goal, trạng thái hôm nay, time estimate và skill focus. | MVP | Must |
| FR-016 | Today phải có một CTA chính “Tiếp tục bài tốt nhất” trỏ tới next-best-session hợp lệ. | MVP | Must |
| FR-017 | Hệ thống phải tính next-best-action từ due review, checkpoint gap, repeated error, goal alignment, variety và fatigue. | MVP | Must |
| FR-018 | Today không được hiển thị quá ba task chính; requirement còn lại nằm trong danh sách mở rộng. | MVP | Must |
| FR-019 | Learner phải xem progress theo meaningful minutes, streak, evidence và checkpoint; XP chỉ là chỉ số phụ. | MVP | Must |
| FR-020 | Hệ thống phải tự reschedule task khi bỏ lỡ ngày và không tạo backlog vô hạn. | MVP | Must |
| FR-021 | Learning Path phải hiển thị Phase → Unit → Lesson → Checkpoint và can-do outcome cho mỗi unit. | MVP | Must |
| FR-022 | Node path phải có trạng thái locked, available, in_progress, review_due và mastered. | MVP | Must |
| FR-023 | Placement có thể mở unit cao hơn nhưng checkpoint prerequisite vẫn được áp dụng theo business rule. | MVP | Must |
| FR-024 | Learner phải đổi plan time/language allocation; hệ thống phải preview ảnh hưởng trước khi lưu. | MVP | Should |
| FR-025 | Khi curriculum version thay đổi, hệ thống phải giữ lịch sử và ánh xạ learner sang version mới có migration rule. | V1 | Must |
| FR-026 | Side quest/challenge phải là optional và không chặn path chính. | V1 | Should |

### 10.3 Lesson player và exercise engine

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-027 | Mỗi lesson phải khai báo language, level nội bộ, can-do outcome, target phrases, skills, duration và exit ticket. | MVP | Must |
| FR-028 | Lesson player phải hỗ trợ cấu trúc outcome → input → meaning → notice → controlled practice → listening → spoken output → feedback/retry → exit ticket. | MVP | Must |
| FR-029 | Exercise engine MVP phải hỗ trợ select meaning, arrange chunks, dictation, listen-and-choose, read-and-answer, record sentence, open response và error correction. | MVP | Must |
| FR-030 | V1 phải thêm shadow waveform, roleplay turn, Chinese character recognition, pinyin typing và handwriting optional. | V1 | Must |
| FR-031 | Hệ thống phải lưu attempt, response, result, duration, hints và content/rubric version. | MVP | Must |
| FR-032 | Người học phải pause/resume lesson; draft đã xác nhận không mất khi refresh hoặc AI timeout. | MVP | Must |
| FR-033 | Hệ thống phải phân biệt completed, abandoned và interrupted session. | MVP | Must |
| FR-034 | Session chỉ complete khi đạt điều kiện exit ticket hoặc được đánh dấu partial với next step rõ. | MVP | Must |
| FR-035 | Bài rút gọn 10–15 phút vẫn phải có ít nhất hai modality và một output có evidence. | MVP | Must |
| FR-036 | Hint phải giảm dần theo mastery; hai lỗi cùng pattern phải kích hoạt micro-explanation và controlled retry. | V1 | Must |
| FR-037 | Learner phải report nội dung sai ngay trong lesson; report liên kết content version và attempt context. | MVP | Must |
| FR-038 | Exercise không hỗ trợ offline phải được đánh dấu trước khi bắt đầu, không chỉ khi submit thất bại. | V1 | Must |

### 10.4 Listening và Reader/Listener

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-039 | Listening exercise phải hỗ trợ lượt gist trước khi hiện transcript và lượt detail sau đó. | MVP | Must |
| FR-040 | Audio player phải có play/pause, replay, loop câu, seek và trạng thái tải/lỗi rõ ràng. | MVP | Must |
| FR-041 | V1 audio player phải hỗ trợ tốc độ 0,75×, 1×, 1,15× mà không thay đổi nghĩa nội dung. | V1 | Must |
| FR-042 | Reader/Listener phải đồng bộ audio–transcript theo câu khi asset có timing metadata. | V1 | Must |
| FR-043 | Learner phải tap từ/cụm để xem nghĩa, pronunciation, ví dụ và lưu vào review. | V1 | Must |
| FR-044 | Translation phải reveal theo câu hoặc block; không mặc định che mất target text. | V1 | Should |
| FR-045 | Chinese reader phải có pinyin toggle, word segmentation toggle và phrase-level selection. | V1 | Must |
| FR-046 | Hệ thống phải ước tính unknown-word density để đề xuất độ khó và cho learner override. | V1 | Should |
| FR-047 | V2 phải hỗ trợ import URL/text/audio với metadata nguồn, xác nhận quyền sử dụng và trạng thái xử lý. | V2 | Must |
| FR-048 | Mọi audio học bắt buộc phải có transcript/caption tương đương. | MVP | Must |

### 10.5 Speaking, microphone và speech analysis

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-049 | Hệ thống phải hỗ trợ record, stop, playback, discard và submit audio với trạng thái mic rõ ràng. | MVP | Must |
| FR-050 | Khi microphone bị từ chối/không có, hệ thống phải cho typing hoặc self-practice và nêu rõ giới hạn scoring. | MVP | Must |
| FR-051 | Hệ thống phải phát hiện audio quá ngắn, clipping hoặc nhiễu vượt ngưỡng và yêu cầu thu lại thay vì chấm sai. | V1 | Must |
| FR-052 | Khi ASR confidence thấp, learner phải xác nhận/chỉnh transcript trước language feedback. | MVP | Must |
| FR-053 | Feedback speaking MVP từ transcript phải gắn nhãn preliminary và không có pronunciation/tone score. | MVP | Must |
| FR-054 | English speech analysis V1 phải tách pronunciation, stress/prosody, fluency, grammar, vocabulary và task completion khi evidence hỗ trợ. | V1 | Must |
| FR-055 | Chinese speech analysis V1 phải tách tone, pinyin/segment, comprehensibility, fluency, language accuracy và task completion. | V1 | Must |
| FR-056 | Pronunciation/tone feedback phải chỉ ra segment ưu tiên, model audio/visual cue và một lượt retry. | V1 | Must |
| FR-057 | Learner phải nghe lại bản ghi và bản mẫu, so sánh lần đầu/lần retry khi đã consent lưu trong phiên. | V1 | Should |
| FR-058 | Raw audio persistence phải tuân theo lựa chọn consent và retention configuration; nếu không consent chỉ xử lý tạm thời theo kiến trúc được duyệt. | V1 | Must |

### 10.6 AI Tutor và multi-agent orchestration

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-059 | Tutor Orchestrator phải nhận learner profile, language, current path, recent errors, due reviews, time budget, device capability và privacy preference. | MVP | Must |
| FR-060 | Curriculum Planner phải chọn can-do outcome, skill focus và difficulty trong curriculum được publish. | MVP | Must |
| FR-061 | Lesson Generator phải trả output theo schema; invalid output phải retry có giới hạn rồi fallback deterministic. | MVP | Must |
| FR-062 | Conversation Coach phải giữ target language, mode, turn budget, target phrases và level boundary. | V1 | Must |
| FR-063 | Error Evaluator phải ưu tiên lỗi ảnh hưởng hiểu nghĩa/giao tiếp và không suy luận speech dimension khi thiếu evidence. | MVP | Must |
| FR-064 | Review Scheduler phải tạo/cập nhật review item từ phrase, mistake và checkpoint evidence. | MVP | Must |
| FR-065 | Voice Adapter phải discover model/language/voice; không hardcode model không tồn tại. | MVP | Must |
| FR-066 | Content Validator phải kiểm tra schema, language, can-do, prohibited claim, answer/rubric reference và safety rule trước khi output tới learner. | MVP | Must |
| FR-067 | Mỗi feedback phải theo contract: what worked, priority fix, better version, why, retry prompt. | MVP | Must |
| FR-068 | Tutor phải hiển thị nhãn AI và cho report feedback sai ở cùng context. | MVP | Must |
| FR-069 | Provider adapter phải hỗ trợ Gemini, DeepSeek, OpenAI và demo; cấu hình provider/model không yêu cầu sửa client. | MVP | Must |
| FR-070 | Auto mode phải chọn/fallback provider theo key và health server-side, ghi provider/model/prompt version/result status/latency nhưng không ghi secret. | MVP | Must |
| FR-071 | AI request phải có timeout, retry giới hạn, circuit breaker và budget/rate controls production. | V1 | Must |
| FR-072 | AI outage phải trả bài/feedback/requirement fallback an toàn cho flow bắt buộc hoặc cho retry mà không mất dữ liệu. | MVP | Must |
| FR-073 | Learner memory chỉ lưu mục tiêu, sở thích, phrase, error pattern, correction style và fact được consent; learner có thể xem/xóa. | V1 | Must |
| FR-074 | AI không được tự sửa deterministic score, nâng level, tuyên bố chứng chỉ hoặc khẳng định phát âm/tone từ transcript. | MVP | Must |
| FR-075 | Nội dung AI phải chạy regression trên golden set English/Chinese trước khi đổi prompt/model production. | V1 | Must |
| FR-076 | V1 AI Conversation phải có guided, roleplay, free talk, challenge và replay; Product có thể bật mode theo entitlement/feature flag. | V1 | Must |
| FR-077 | Sau conversation phải có transcript, tối đa hai priority fixes, better phrasing, retry và save mistake. | V1 | Must |

### 10.7 Voice và OpenVox

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-078 | Voice service phải expose status không chứa secret và phân biệt local OpenVox, browser/cloud fallback, unavailable. | MVP | Must |
| FR-079 | OpenVox adapter mặc định kết nối endpoint local do server cấu hình, discover model/language/voice và warm model trước request đầu khi hỗ trợ. | MVP | Must |
| FR-080 | English và Chinese phải có preferred voice riêng và kiểm tra tương thích language trước synthesize. | MVP | Must |
| FR-081 | Khi OpenVox trả 429, hệ thống backoff và retry tối đa theo cấu hình; sau đó fallback minh bạch. | MVP | Must |
| FR-082 | Khi OpenVox unavailable, lesson phải dùng browser/cloud TTS nếu policy cho phép và hiển thị thông báo non-blocking. | MVP | Must |
| FR-083 | Local voice mode không được gửi text/audio tới cloud TTS/ASR; nếu capability thiếu phải xin lựa chọn trước khi đổi route. | V1 | Must |
| FR-084 | Voice conversation V1 phải hỗ trợ VAD/end-of-turn, ASR, tutor response, TTS và transcript confirmation. | V1 | Must |
| FR-085 | V2 phải hỗ trợ streaming/partial ASR và TTS để hướng tới p95 full guided turn ≤3,5 giây trong điều kiện mục tiêu đã định nghĩa. | V2 | Must |
| FR-086 | Voice errors phải cho retry, đổi input/output device hoặc chuyển text mode mà không mất conversation state. | V1 | Must |

### 10.8 Assessment, checkpoint và Goal Controller

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-087 | Hệ thống phải có diagnostic placement riêng cho English và Chinese, dài 5–8 phút/ngôn ngữ. | MVP | Must |
| FR-088 | Placement phải adaptive theo cụm: khởi động mức 2–3, hai câu đúng thử cụm cao hơn, hai câu sai hạ cụm; routing rule phải version hóa. | MVP | Must |
| FR-089 | Assessment start không được trả answer key, deterministic scoring rule hoặc dữ liệu làm lộ đáp án. | MVP | Must |
| FR-090 | Mỗi assessment run phải gắn definition, blueprint, rubric, content version và trạng thái evidence. | MVP | Must |
| FR-091 | Assessment phải lấy mẫu listening, reading và speaking; dimension nâng cao chỉ xuất hiện khi có analyzer phù hợp. | MVP | Must |
| FR-092 | Hệ thống phải có weekly checkpoint và phase checkpoint ngày 7, 14, 30, 45, 60, 75, 90. | MVP cho 7/14/30; V1 đủ | Must |
| FR-093 | Phase checkpoint phải dùng blueprint/rubric tương thích để so sánh trước–sau; LLM không tạo answer key sau submit. | MVP | Must |
| FR-094 | Assessment submit phải idempotent, lưu answer trước khi gọi AI và không tạo hai run khi retry. | MVP | Must |
| FR-095 | Scoring engine phải tính điểm deterministic cho item có đáp án và rubric-governed score cho open response. | MVP | Must |
| FR-096 | Result phải tách listening, reading, speaking, overall, evidence quality và nhãn preliminary nếu áp dụng. | MVP | Must |
| FR-097 | Result phải giải thích thang Level 1–7 là nội bộ và không trình bày như chứng chỉ. | MVP | Must |
| FR-098 | Goal Controller phải tạo tối đa ba learning requirements sau submit, kể cả khi AI unavailable. | MVP | Must |
| FR-099 | Goal Controller phải kiểm tra budget, prerequisite, safety, fatigue và không phân bổ lệch khỏi language allocation không có lý do. | MVP | Must |
| FR-100 | Mỗi requirement phải có reason dựa trên evidence, task, minutes, target, success criterion, due window và evidence type. | MVP | Must |
| FR-101 | Learner phải xem active/completed/rescheduled requirements và bằng chứng hoàn thành. | MVP | Must |
| FR-102 | Sau hai checkpoint chưa đạt cùng gap, hệ thống phải đề xuất recovery test tập trung. | V1 | Must |
| FR-103 | Learner có thể yêu cầu challenge test; hệ thống chỉ mở unit khi đủ evidence, không bỏ qua nền tảng chỉ từ một điểm tổng. | V1 | Should |
| FR-104 | Tăng level phải chạy rule engine theo BR-003 và ghi audit evidence; LLM output không được gọi trực tiếp thao tác này. | MVP | Must |
| FR-105 | Reviewer được xem sampled assessment, AI/human agreement và calibration data nhưng không sửa lịch sử run. | V1 | Must |

### 10.9 Practice Hub, SRS và Error Notebook

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-106 | Practice Hub phải có Quick Review, Mistakes, Listening, Speaking, Reading, Vocabulary và Checkpoint Prep. | V1 | Must |
| FR-107 | Hệ thống phải đề xuất một lane từ learner model nhưng cho learner chọn lane khác. | MVP | Must |
| FR-108 | SRS item phải có trạng thái new, learning, review, mastered, lapsed cùng due time, stability và difficulty. | MVP | Must |
| FR-109 | Scheduler phải xét recency, learner difficulty, error modality, context count, spacing và checkpoint priority. | MVP | Must |
| FR-110 | Review phải phối hợp recognition, comprehension và production; không đánh mastery chỉ từ nhận biết. | V1 | Must |
| FR-111 | Learner phải lưu phrase cùng context, audio, language và source từ lesson/reader/conversation. | V1 | Must |
| FR-112 | Error Notebook phải nhóm lỗi theo pattern, hiển thị ví dụ, trend, lần sửa đúng và trạng thái active/repaired/recurring. | V1 | Must |
| FR-113 | Feedback và wording của Error Notebook không dùng ngôn ngữ gây xấu hổ hoặc tuyệt đối hóa năng lực. | MVP | Must |
| FR-114 | Due review phải khả dụng trong quick session 3–5 phút và offline khi content đã cache. | V1 | Should |

### 10.10 Progress, reports và gamification

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-115 | Progress phải hiển thị skill map theo listening, reading, speaking, vocabulary, pronunciation/tone và retention. | V1 | Must |
| FR-116 | Progress phải hiển thị meaningful minutes tuần, checkpoint history, evidence artifact và error trend. | MVP cơ bản; V1 đầy đủ | Must |
| FR-117 | Hệ thống không hiển thị độ chính xác giả; confidence/evidence quality phải được thể hiện khi score không chắc chắn. | MVP | Must |
| FR-118 | Weekly report phải có win, blocker, next focus, requirements và thay đổi so với tuần trước. | V1 | Must |
| FR-119 | Streak phải dựa trên ngày có activity hợp lệ hoặc weekly recovery rule, xử lý timezone và offline sync. | MVP | Must |
| FR-120 | XP chỉ được cấp cho attempt/complete/retry có ý nghĩa; phải chống farm bằng lặp bài quá dễ. | V1 | Should |
| FR-121 | Badge/quest phải gắn với skill output hoặc consistency, không dùng để nâng level. | V1 | Should |
| FR-122 | Learner phải xem lý do level giữ nguyên/tăng và evidence còn thiếu. | MVP | Must |
| FR-123 | V2 có thể hỗ trợ personal best và friend accountability challenge opt-in; leaderboard không bắt buộc. | V2 | Could |

### 10.11 Notification và communication

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-124 | Learner phải opt in riêng cho web push/email; trạng thái mặc định không tự gửi marketing. | V1 | Must |
| FR-125 | Notification preference phải có channel, loại thông báo, quiet hours, timezone, frequency và ngôn ngữ. | V1 | Must |
| FR-126 | Hệ thống phải hỗ trợ reminder kế hoạch, due review, checkpoint, weekly report, interrupted session và subscription transactional notice. | V1 | Must |
| FR-127 | Reminder học phải deep-link tới next-best-action hoặc item liên quan, không chỉ landing chung. | V1 | Must |
| FR-128 | Hệ thống phải deduplicate, frequency-cap và hủy notification lỗi thời khi task được hoàn thành ở thiết bị khác. | V1 | Must |
| FR-129 | Khi learner đổi timezone/quiet hours, lịch tương lai phải được tính lại và hiển thị preview. | V1 | Must |
| FR-130 | Người dùng phải unsubscribe/disable non-essential notification ngay trong preference hoặc từ channel tương ứng. | V1 | Must |
| FR-131 | Các thông báo billing, security hoặc service-critical phải tách khỏi learning/marketing preference và dùng wording đã được owner phù hợp duyệt. | V1 | Must |
| FR-132 | Không dùng notification gây tội lỗi, đe dọa mất tiến bộ hoặc tạo claim năng lực không có evidence. | MVP | Must |

### 10.12 Subscription và entitlement

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-133 | Hệ thống phải định nghĩa Free và Pro dưới dạng entitlement server-side, không hardcode chỉ ở UI. | V1 | Must |
| FR-134 | Free phải có daily core lesson, basic review, AI Coach limit, local/browser voice khi khả dụng và core progress. | V1 | Must |
| FR-135 | Pro phải có AI conversation theo fair-use policy hiển thị, advanced speech feedback, personalized generation, full reader/import, detailed report và offline packs theo release availability. | V1 | Must |
| FR-136 | Placement result cơ bản, core curriculum progress, privacy/data controls, accessibility và report AI error không được khóa paywall. | V1 | Must |
| FR-137 | Paywall phải hiển thị tính năng, giá/chu kỳ từ billing catalog, trial nếu có, trạng thái gia hạn và link quản lý; không hardcode claim giá trong content. | V1 | Must |
| FR-138 | Purchase/renew/cancel/refund webhook phải được xác thực, idempotent và ghi entitlement ledger. | V1 | Must |
| FR-139 | Learner phải xem plan, renewal/end date, entitlement state và đường dẫn quản lý/hủy phù hợp provider. | V1 | Must |
| FR-140 | Cancel phải ngăn gia hạn tương lai nhưng giữ entitlement tới thời điểm đã thanh toán theo policy được hiển thị. | V1 | Must |
| FR-141 | Payment failure phải đưa account vào grace/retry state theo cấu hình, không xóa dữ liệu học. | V1 | Must |
| FR-142 | Hạ gói phải giữ progress, saved phrases và history; UI chỉ khóa hành động Pro mới sau entitlement end. | V1 | Must |
| FR-143 | Usage limit AI phải hiển thị trạng thái và reset rule; provider outage không được trừ quota cho lượt thất bại không tạo giá trị. | V1 | Must |
| FR-144 | Support/Billing Admin phải xem ledger và thực hiện thao tác được cấp quyền với reason/audit; không sửa trực tiếp record thanh toán nguồn. | V1 | Must |

### 10.13 Offline, sync và đa thiết bị

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-145 | PWA phải cache app shell và nội dung đã chọn cho offline theo quota thiết bị. | V1 | Must |
| FR-146 | Offline-capable screen phải hiển thị trạng thái offline và thời điểm sync cuối. | V1 | Must |
| FR-147 | Attempt offline phải lưu local queue với client operation ID và sync idempotent khi có mạng. | V1 | Must |
| FR-148 | Conflict progress phải dùng rule đã định nghĩa, giữ evidence gốc và không âm thầm ghi đè completion. | V1 | Must |
| FR-149 | AI generation, cloud ASR/TTS, billing và content import phải hiển thị unavailable offline; local OpenVox có thể tiếp tục nếu reachable. | V1 | Must |
| FR-150 | Learner phải xóa offline pack và xem dung lượng; logout phải xử lý cache dữ liệu tài khoản theo security design. | V1 | Must |

### 10.14 Admin, content operations và moderation

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-151 | Admin CMS phải quản lý course, phase, unit, lesson, skill, exercise, assessment definition, item, rubric và asset. | MVP tối thiểu; V1 đầy đủ | Must |
| FR-152 | Content entity phải có draft, in_review, approved, published, archived và rejected state với transition theo role. | MVP | Must |
| FR-153 | Author phải preview lesson theo language, level, device và learner state trước khi gửi review. | MVP | Must |
| FR-154 | Reviewer phải xem diff, validation result, source/attribution metadata và approve/reject với comment. | V1 | Must |
| FR-155 | Publish phải atomic theo version; rollback phải khôi phục version trước mà không xóa lịch sử learner attempt. | V1 | Must |
| FR-156 | Rubric/answer key phải có access control riêng và không xuất hiện trong learner payload. | MVP | Must |
| FR-157 | AI-generated content phải ghi provider/model/prompt/schema version và trạng thái human review. | MVP | Must |
| FR-158 | CMS phải chạy validators: schema, target language, duplicate, missing asset/transcript, level/can-do, answer/rubric link và prohibited claim. | MVP | Must |
| FR-159 | Content Operator phải lên lịch publish/unpublish theo timezone và thấy dependent learner sessions. | V1 | Should |
| FR-160 | Report queue phải có severity, reason, content/version, reporter context, owner, SLA nội bộ, status và resolution. | MVP | Must |
| FR-161 | Admin phải có emergency unpublish/feature kill switch với reason và audit; không xóa artifact gốc. | MVP | Must |
| FR-162 | Golden-set dashboard phải so sánh prompt/model version, schema pass, learning reviewer score và regression trước rollout. | V1 | Must |
| FR-163 | V2 moderation phải hỗ trợ report, block, reviewer reputation, human escalation và hạn chế contact exchange. | V2 | Must |
| FR-164 | Mọi thao tác admin nhạy cảm phải có actor, timestamp, target, before/after, reason và correlation ID trong audit log. | MVP | Must |

### 10.15 Support, trust và safety

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-165 | Learner phải gửi support request từ app kèm category và diagnostics đã được xem trước, không tự đính kèm secret/raw audio. | V1 | Must |
| FR-166 | Support phải tra cứu account theo identifier phù hợp và chỉ thấy dữ liệu tối thiểu cần xử lý. | V1 | Must |
| FR-167 | Content/AI feedback phải có report categories: sai ngôn ngữ, sai kiến thức, không phù hợp level, offensive/unsafe, lỗi kỹ thuật, khác. | MVP | Must |
| FR-168 | Safety filter phải chặn hoặc chuyển hướng nội dung không phù hợp với learning context; critical ambiguity phải cho human escalation. | V1 | Must |
| FR-169 | Nếu sản phẩm mở cho trẻ vị thành niên, age-appropriate topic, guardian flow và community restriction phải được thiết kế/đánh giá riêng trước khi cho phép; không mặc định coi đã đáp ứng yêu cầu pháp lý. | V2 | Must nếu mở scope |
| FR-170 | Status/degraded banner phải thông báo sự cố AI/voice/content/billing có ảnh hưởng mà không lộ hạ tầng nhạy cảm. | MVP | Must |

### 10.16 Analytics, experimentation và observability

| ID | Yêu cầu | Release | Priority |
|---|---|---|---|
| FR-171 | Client/server phải phát event theo taxonomy mục 15 với event_id, occurred_at, user/session pseudonymous ID, app version và context tối thiểu. | MVP | Must |
| FR-172 | Event ingestion phải deduplicate theo event_id và không dùng client event làm nguồn duy nhất cho billing/score/entitlement. | MVP | Must |
| FR-173 | Meaningful seconds phải tính từ activity state có tương tác, loại idle/background và được tổng hợp server-side. | MVP | Must |
| FR-174 | Dashboard product phải phân đoạn theo language, baseline, cohort, plan minutes, device và entitlement nhưng áp dụng ngưỡng bảo vệ nhóm nhỏ do Data/Privacy quy định. | V1 | Must |
| FR-175 | Experiment assignment phải ổn định, version hóa và không thay curriculum/rubric giữa một assessment run. | V1 | Must |
| FR-176 | Experiment phải khai báo primary metric, guardrails, population, duration/stop rule và owner trước khi active. | V1 | Must |
| FR-177 | AI run phải có trace/correlation ID, purpose, provider/model, prompt version, validation/fallback status, token/cost metadata khi có và latency. | MVP | Must |
| FR-178 | Voice pipeline phải đo route, stage latency, ASR confidence, TTS success/fallback và error code không chứa raw content mặc định. | MVP | Must |
| FR-179 | Alert phải bao phủ auth, assessment submit, content publish, billing webhook, AI schema failure, provider error rate và voice degradation. | V1 | Must |
| FR-180 | Data quality checks phải phát hiện missing/duplicate event, impossible duration, version null và funnel break. | V1 | Must |

## 11. User journeys

### J-01 — Người mới học một ngôn ngữ

1. Guest mở app, xem giá trị và chọn bắt đầu.
2. Tạo tài khoản hoặc tiếp tục demo theo availability.
3. Chọn English hoặc Chinese, goal, 35 phút/ngày, timezone.
4. Làm mic test và placement 5–8 phút.
5. Xem baseline theo kỹ năng, nhãn Level nội bộ và giới hạn confidence.
6. Nhận plan tuần đầu và tối đa ba requirements.
7. Bắt đầu day-1 lesson từ CTA chính.
8. Nghe, đọc, nói, nhận feedback và retry.
9. Hoàn tất exit ticket; Today/progress cập nhật.

Điểm thành công: plan được tạo, spoken output đầu tiên được lưu thành evidence, không lộ answer key/secret.

### J-02 — Người học cả English và Chinese

1. Chọn cả hai và tỷ lệ 70/30, 50/50 hoặc 30/70.
2. Làm placement riêng cho từng ngôn ngữ.
3. Nhận hai language profile, level và gap độc lập.
4. Today ghép plan theo ngân sách phút và bảo vệ tỷ lệ tuần.
5. Khi một ngôn ngữ có checkpoint gần hoặc gap an toàn, hệ thống có thể lệch tạm thời nhưng phải giải thích.

Điểm thành công: không gộp level/evidence giữa ngôn ngữ và tổng phút không vượt plan.

### J-03 — Phiên học chuẩn 35 phút

1. Learner chọn “Tiếp tục bài tốt nhất”.
2. Listening 12 phút: nghe lượt gist, lượt detail và reveal transcript sau lượt đầu.
3. Reading 10 phút: graded text, phrase mining và comprehension.
4. Speaking 10 phút: model, record, feedback và retry.
5. Review/reflection 3 phút: lưu ba cụm từ, chọn lỗi cần nhớ và xem next step.
6. Session complete, meaningful minutes và mastery cập nhật.

### J-04 — Mic bị từ chối hoặc ASR confidence thấp

1. Record action phát hiện permission denied hoặc không có input device.
2. UI giải thích ngắn và cung cấp mở settings, thử lại, typing hoặc self-practice.
3. Nếu có audio nhưng ASR confidence thấp, hiển thị transcript để xác nhận/chỉnh.
4. Hệ thống chỉ chấm dimension có evidence, gắn nhãn preliminary nếu cần.
5. Learner tiếp tục lesson, không mất các attempt trước.

### J-05 — Placement/checkpoint và kế hoạch tự động

1. Learner bắt đầu assessment; server tạo run version hóa.
2. Client nhận item không có answer key.
3. Mỗi answer được lưu; resume nếu gián đoạn trong policy.
4. Submit idempotent; scoring engine tính deterministic/rubric score.
5. AI diễn đạt phân tích; fallback nếu provider lỗi.
6. Goal Controller phát tối đa ba requirements có tiêu chí.
7. Level engine chỉ thay đổi level nếu đủ evidence theo BR-003.

### J-06 — AI Conversation

1. Learner chọn guided/roleplay/free/challenge/replay theo entitlement.
2. Xem goal, vocabulary target, caption và voice route.
3. Thực hiện 4–12 turns; beginner dùng push-to-talk mặc định.
4. Turn lỗi có retry/text fallback không mất history.
5. Kết thúc nhận transcript, điểm tốt, hai fix, better phrasing và retry.
6. Mistake/phrase được lưu vào queue theo lựa chọn.

### J-07 — Offline học và đồng bộ

1. Learner tải offline pack khi online.
2. App mất mạng, hiển thị offline state và chỉ bật lesson khả dụng.
3. Attempt lưu local với operation ID.
4. Khi có mạng, app sync, deduplicate và giải quyết conflict.
5. Progress server cập nhật; notification cũ bị hủy.

### J-08 — Nâng cấp và hạ gói

1. Learner gặp tính năng Pro, xem paywall và entitlement rõ.
2. Hoàn tất checkout qua provider; webhook xác thực cập nhật ledger.
3. App refresh entitlement và mở tính năng.
4. Khi cancel, app hiển thị end date; dữ liệu học được giữ.
5. Khi entitlement hết, tính năng Pro mới bị khóa, core learning vẫn hoạt động.

### J-09 — Content authoring và publish

1. Author tạo lesson/rubric draft từ template.
2. Validator chạy schema/language/can-do/asset/claim checks.
3. Author preview theo learner state và gửi review.
4. Reviewer xem diff, chạy golden/sample tests và approve/reject.
5. Publish tạo immutable version; learner session mới dùng version mới.
6. Nếu lỗi, admin emergency unpublish/rollback có reason/audit.

### J-10 — Report nội dung AI sai

1. Learner chọn Report trên feedback/lesson.
2. Chọn category, thêm mô tả tùy chọn và xem dữ liệu sẽ gửi.
3. Report queue gắn content/prompt/model version.
4. Operator triage, resolve/escalate và cập nhật content/prompt.
5. Learner nhận xác nhận; không hứa thời gian xử lý nếu chưa có SLA được công bố.

## 12. Đặc tả màn hình và trạng thái

### 12.1 Trạng thái dùng chung

Mọi màn hình data-driven phải có:

- **Initial loading:** skeleton đúng cấu trúc, không nhấp nháy dữ liệu giả.
- **Background refresh:** giữ dữ liệu cũ, hiển thị indicator nhẹ.
- **Empty:** giải thích vì sao trống và CTA hợp lệ.
- **Error recoverable:** message, retry và giữ input/draft.
- **Error terminal:** correlation/reference ID và đường hỗ trợ.
- **Offline:** trạng thái kết nối, khả năng còn dùng và last sync.
- **Permission denied:** lý do cần quyền, mở settings/thử lại/fallback.
- **Degraded:** AI/voice/provider lỗi nhưng core flow vẫn tiếp tục nếu có fallback.
- **Success:** xác nhận hành động, cập nhật state, tránh toast mơ hồ.
- **Unauthorized/forbidden:** không lộ dữ liệu tồn tại; CTA login hoặc quay lại.

### 12.2 Onboarding

| State | Nội dung/hành vi |
|---|---|
| New | Progress step, lý do cần thông tin, CTA tiếp tục |
| Returning partial | Resume đúng bước, giữ lựa chọn đã lưu |
| No language selected | Disable continue, inline guidance |
| Allocation invalid | Báo tổng phải bằng 100%, giữ input |
| Placement skipped | Nêu plan có confidence thấp và có thể test sau |
| Mic denied | Hướng dẫn + skip; không chặn onboarding |
| API error | Retry hoặc lưu draft; không yêu cầu nhập lại toàn bộ |
| Complete | Summary plan tuần đầu + CTA bắt đầu ngay |

### 12.3 Today

| State | Nội dung/hành vi |
|---|---|
| Loading | Skeleton header, primary card, progress modules |
| New user | Day 1, first session CTA, setup checklist tối thiểu |
| Active day | Một CTA, tối đa ba tasks, due reviews/checkpoint |
| Goal met | Celebration nhẹ, optional review; không ép làm thêm |
| Missed day | Plan đã reschedule, không hiển thị backlog gây áp lực |
| No task | Recompute CTA; nếu vẫn lỗi cho Quick Review fallback |
| Offline | Hiển thị cached tasks; disable task cần cloud |
| AI degraded | Dùng deterministic lesson/recommendation và banner nhẹ |
| Subscription locked | Core lesson vẫn có; Pro card giải thích entitlement |

### 12.4 Learning Path

| State | Nội dung/hành vi |
|---|---|
| Empty/unassigned | CTA hoàn tất onboarding/placement |
| Loaded | Phase/unit/lesson/checkpoint, can-do và node state |
| Locked node | Nêu prerequisite/evidence còn thiếu |
| Version migrated | Nêu thay đổi plan, không xóa history |
| Content unavailable | Ẩn start, cung cấp next valid node và report |
| Offline partial | Chỉ node cached có thể mở; trạng thái rõ |

### 12.5 Lesson Player

| State | Nội dung/hành vi |
|---|---|
| Pre-start | Outcome, duration, modality, offline/voice requirement |
| Loading content/audio | Skeleton + progress; cho cancel |
| Active | Một task chính, progress trong lesson, hint có kiểm soát |
| Recording | Timer, waveform/status, stop/cancel; keyboard accessible |
| Evaluating | Giữ response, loading không chặn xem prompt |
| Feedback | Contract 5 phần + retry CTA |
| Interrupted | Auto-save, resume/restart lựa chọn rõ |
| Partial complete | Nêu phần đã lưu và phần còn thiếu |
| Complete | Exit result, saved items, next step |
| Content error | Không chấm learner; report + tải replacement/fallback |

### 12.6 Assessment

| State | Nội dung/hành vi |
|---|---|
| Intro | Loại test, thời lượng, skills, tác động và giới hạn |
| In progress | Item progress, autosave, không lộ correctness ngay nếu ảnh hưởng routing |
| Connection lost | Tiếp tục item đã tải hoặc pause; answer không mất |
| Audio invalid | Thu lại/skip theo rubric, không gán score sai |
| Submit pending | Disable duplicate action, idempotency key |
| Scoring | Tách deterministic scoring và AI explanation status |
| AI failed | Vẫn trả score + requirements deterministic |
| Result | Skill scores, evidence quality, internal-level disclaimer, requirements |
| Incomplete | Không tính fail; resume hoặc reschedule |

### 12.7 AI Coach/Conversation

| State | Nội dung/hành vi |
|---|---|
| Empty | Prompt suggestions theo plan, không chat trắng hoàn toàn |
| Connecting | Route/provider status ở mức người dùng hiểu được |
| Listening/thinking/speaking | State khác nhau, có cancel/interrupt |
| Low confidence | Transcript confirmation trước feedback |
| Rate limited | Thời điểm thử lại/alternative; không trừ quota lỗi |
| Provider unavailable | Fallback provider/demo/text; giữ conversation |
| Safety redirect | Giải thích ngắn, đưa topic học phù hợp |
| Complete | Transcript, fixes, retry, save items |

### 12.8 Practice Hub, Notebook và Progress

| Screen | Empty state | Error/offline state |
|---|---|---|
| Practice Hub | “Chưa có lỗi cần ôn”; đề xuất quick practice | Lane cached hoạt động; cloud lane disabled |
| Vocabulary | Giải thích cách lưu phrase + CTA mở lesson | Giữ queue local; sync later |
| Mistakes | Ghi nhận chưa có pattern đủ evidence | Hiển thị snapshot gần nhất |
| Progress | Hướng dẫn hoàn tất first lesson/checkpoint | Không hiển thị score 0 giả; last updated |
| Weekly report | Chưa đủ tuần dữ liệu; preview metric sẽ có | Cho xem report cache/download |

### 12.9 Subscription và Settings

| State | Nội dung/hành vi |
|---|---|
| Free | Entitlement hiện tại, quota và upgrade CTA |
| Checkout loading | Không submit trùng; cho cancel an toàn |
| Purchase pending | Poll/refresh có giới hạn, không mở quyền từ client callback đơn thuần |
| Pro active | Renewal/end date và manage link |
| Grace/payment failed | Hướng dẫn cập nhật payment, ngày ảnh hưởng nếu có từ provider |
| Canceled | Vẫn Pro tới end date; nêu dữ liệu được giữ |
| Billing unavailable | Core learning không bị chặn; retry/support |
| Delete/export | Phạm vi, xác nhận, trạng thái request; không đưa claim thời hạn chưa duyệt |

### 12.10 Admin CMS

| State | Nội dung/hành vi |
|---|---|
| Empty course | Template và checklist bắt buộc |
| Draft invalid | Validator errors theo field và preview blocked |
| In review | Read-only cho author ở field khóa hoặc tạo revision mới |
| Publish conflict | Hiển thị version mới hơn và diff; không overwrite |
| Publish partial failure | Transaction rollback; không để graph curriculum nửa vời |
| Emergency issue | Kill switch/unpublish với reason bắt buộc |
| Unauthorized | Không render data nhạy cảm; ghi security event phù hợp |

## 13. Notification specification

### 13.1 Loại thông báo

| Mã | Trigger | Channel khả dụng | Deep link | Frequency rule |
|---|---|---|---|---|
| NTF-01 | Đến khung học đã chọn, chưa bắt đầu | Push/email opt-in | Today next action | Tối đa 1/ngày |
| NTF-02 | Review due có priority cao | Push/email opt-in | Quick Review | Gộp theo ngày |
| NTF-03 | Checkpoint sắp tới | Push/email opt-in | Checkpoint intro | Tối đa 2 trước mốc |
| NTF-04 | Session bị gián đoạn còn resumable | Push/in-app | Resume session | Một lần, hủy khi complete |
| NTF-05 | Weekly report sẵn sàng | Push/email/in-app | Weekly report | Một/tuần |
| NTF-06 | Goal tuần đã đạt | In-app, push opt-in | Progress | Một/tuần |
| NTF-07 | Subscription purchase/cancel/payment state | Email/in-app theo provider/policy | Billing settings | Transactional, dedupe webhook |
| NTF-08 | Security/service-critical account notice | Email/in-app | Relevant settings/status | Theo sự kiện đã xác minh |
| NTF-09 | Content/report resolution | In-app/email opt-in | Report detail | Một theo state change hữu ích |

### 13.2 Quy tắc gửi

- Tôn trọng timezone, quiet hours và channel consent.
- Nếu learner đã hoàn thành task trên thiết bị khác, notification pending phải bị hủy khi khả thi.
- Gộp review và task; không gửi từng item.
- Copy ngắn, cụ thể, không gây tội lỗi, không hứa level/chứng chỉ.
- Delivery/open/click là analytics; không coi open là meaningful learning.

## 14. Subscription và entitlement model

### 14.1 Ma trận entitlement đề xuất

| Capability | Free | Pro | Ghi chú |
|---|---|---|---|
| Core daily lesson | Có | Có | Không khóa path cốt lõi |
| Basic SRS/review | Có | Có | Pro có personalization sâu hơn |
| Placement cơ bản | Có | Có | Không paywall result cơ bản |
| AI Coach | Giới hạn lượt | Fair-use/unlimited theo policy | Limit server-side |
| AI Conversation | Trial/giới hạn nếu bật | Có | Availability phụ thuộc voice/provider |
| Advanced pronunciation/tone | Preview/basic | Có | Chỉ khi audio analyzer V1 sẵn sàng |
| Personalized lesson generation | Giới hạn | Có | Qua validated schema |
| Reader/import | Core reader | Full/import | Import là V2 nếu chưa sẵn sàng |
| Detailed weekly report | Basic | Full | Core progress luôn có |
| Offline packs | Core/current lesson | Mở rộng | Theo quota thiết bị |
| Privacy/accessibility/report | Có | Có | Không paywall |

### 14.2 Entitlement states

`free`, `trialing`, `pro_active`, `grace`, `canceled_until_end`, `expired`, `billing_pending`, `restricted`.

Nguồn sự thật là entitlement ledger cập nhật từ billing provider/webhook đã xác thực. Giá, trial, thuế, refund và thời điểm hiệu lực không được bịa trong copy hoặc hardcode trong PRD; phải lấy từ catalog/policy đã được owner phù hợp phê duyệt.

## 15. Analytics event taxonomy

### 15.1 Event envelope bắt buộc

Mỗi event gồm tối thiểu:

```text
event_id, event_name, event_version, occurred_at, received_at,
pseudonymous_user_id, anonymous_id, session_id, device_id,
app_version, platform, locale, timezone, language_profile,
content_version, experiment_assignments, correlation_id
```

Không đưa raw audio, full transcript, API key hoặc nội dung nhạy cảm vào analytics payload mặc định.

### 15.2 Events cốt lõi

| Event | Trigger | Thuộc tính bổ sung chính |
|---|---|---|
| `app_opened` | App foreground | source, online_state |
| `onboarding_started` | Bước đầu | entry_point |
| `onboarding_step_completed` | Hoàn tất bước | step, duration_ms, skipped |
| `onboarding_completed` | Plan tạo thành công | languages, daily_minutes, allocation |
| `placement_started` | Run tạo | language, definition_version |
| `assessment_item_answered` | Answer lưu | run_id, modality, difficulty, response_type; không gửi answer raw mặc định |
| `placement_completed` | Result sẵn sàng | language, internal_level, score_bands, preliminary |
| `study_plan_created` | Plan publish | languages, weekly_minutes, target_days |
| `today_viewed` | Today render | task_count, goal_state, offline |
| `next_action_selected` | CTA/tự chọn | recommendation_rank, reason_code |
| `lesson_started` | Session start | lesson_id, duration_target, language, level |
| `exercise_viewed` | Exercise active | exercise_type, skill |
| `exercise_attempted` | Attempt lưu | result_band, hint_count, duration_ms |
| `audio_played` | Play đủ ngưỡng | asset_id, speed, route |
| `speech_recording_started` | Mic record | permission_state, input_route |
| `speech_recorded` | Audio valid | duration_ms, quality_band, consent_state |
| `feedback_viewed` | Feedback visible | feedback_type, provider, confidence_band |
| `retry_started` | Retry CTA | error_pattern_id |
| `retry_completed` | Retry scored/saved | improvement_band |
| `lesson_completed` | Exit ticket | completion_type, meaningful_seconds, items_saved |
| `session_interrupted` | Exit/crash/network | reason, resumable |
| `review_due` | Scheduler creates due | item_count, priority_band |
| `review_completed` | Review session ends | item_count, result_bands, meaningful_seconds |
| `phrase_saved` | Learner saves phrase | source_type, language |
| `mistake_created` | Pattern recorded | modality, severity_band |
| `checkpoint_started` | Run start | checkpoint_kind, day, rubric_version |
| `checkpoint_completed` | Result | score_bands, level_changed, requirements_count |
| `learning_requirement_created` | Goal Controller publish | skill, reason_code, minutes, due_window |
| `learning_requirement_completed` | Evidence accepted | evidence_type, attempts_count |
| `level_evidence_updated` | Evidence state change | language, from_state, to_state, missing_count |
| `level_changed` | Rule engine changes level | language, from_level, to_level, evidence_bundle_id |
| `ai_request_completed` | AI run ends | purpose, provider, model, prompt_version, latency_ms, status, fallback_count |
| `ai_content_reported` | Report submitted | category, content_type, version |
| `voice_route_selected` | Voice route chosen | route, language, fallback_reason |
| `voice_turn_completed` | Turn plays | latency stages, status |
| `openvox_fallback` | Route changes | error_class, target_route |
| `notification_scheduled` | Job accepted | notification_type, channel, local_hour |
| `notification_delivered` | Provider callback | type, channel, status |
| `notification_opened` | Deep link open | type, latency_since_delivery |
| `paywall_viewed` | Paywall visible | entry_point, entitlement, catalog_version |
| `checkout_started` | Billing redirect | product_id, cycle |
| `entitlement_changed` | Ledger update | from_state, to_state, source, reason_code |
| `offline_queue_synced` | Queue processed | operations, conflicts, failures |
| `content_published` | Version published | entity_type, version, reviewer_count |
| `content_rolled_back` | Rollback | entity_type, from_version, to_version, reason_code |

### 15.3 Metric rules

- MPM lấy từ `meaningful_seconds` server-validated, không cộng trùng khi offline sync.
- Spoken output hợp lệ cần audio hoặc response path được định nghĩa; mic-denied typing không tính là pronunciation attempt.
- Retry rate mẫu số là feedback có retry hợp lệ; loại feedback view bị thoát trước khi CTA sẵn sàng.
- Checkpoint improvement chỉ so sánh run có blueprint/rubric tương thích hoặc có normalization được Learning/Data duyệt.
- Level change phải truy vết được tới evidence bundle và rule version.

## 16. Admin và content operations

### 16.1 Content lifecycle

```text
Draft → Validation passed → In review → Approved → Scheduled/Published
                               ↘ Rejected → Draft
Published → Archived hoặc Emergency unpublished → Revised version
```

### 16.2 Definition of Ready cho content

Một lesson/assessment chỉ được gửi review khi có:

- Owner, language, nội bộ Level 1–7 và can-do outcome.
- Skill/modality, prerequisite, duration và learner instruction.
- Target text, translation/explanation tiếng Việt khi cần.
- Audio/transcript/caption hoặc trạng thái asset rõ.
- Exercise schema, answer/rubric reference và feedback rationale.
- Source/attribution/right-to-use metadata cho asset nhập ngoài.
- Accessibility metadata.
- Validator pass và preview thành công.

### 16.3 Definition of Done cho publish

- Learning reviewer approve.
- Schema, link, asset, answer/rubric và prohibited-claim checks pass.
- English/Chinese linguistic QA phù hợp.
- Golden/smoke test không regression nghiêm trọng.
- Version immutable được tạo; rollout/rollback plan có owner.
- Analytics identifiers và content version xuất hiện đúng.

### 16.4 AI content operations

- Prompt, system instruction, schema và model config có version độc lập.
- Golden sets bao gồm level boundary, Vietnamese explanation, English pronunciation limits, Chinese tone/pinyin, prompt injection và provider malformed JSON.
- Rollout theo môi trường/percentage/feature flag.
- Invalid output không publish trực tiếp; fallback hoặc queue review.
- Model/provider change là thay đổi có thể ảnh hưởng learning quality, phải qua evaluation trước production.

### 16.5 Report và correction

- Report không tự xóa content; severity rule quyết định hide, unpublish hoặc review.
- Correction tạo version mới; lịch sử attempt giữ content version cũ.
- Nếu score bị ảnh hưởng do answer/rubric lỗi, Learning/Product/Data phải xác định re-score strategy và thông báo phù hợp; không âm thầm sửa lịch sử.

## 17. Yêu cầu phi chức năng và quality attributes

### 17.1 Hiệu năng

- **NFR-001:** p95 local UI interaction <200 ms trên thiết bị/mạng mục tiêu đã xác định.
- **NFR-002:** p95 CRUD API <500 ms, không tính model inference và upload lớn.
- **NFR-003:** Voice guided turn hướng tới p95 <3,5 giây ở cấu hình mục tiêu; phải đo theo từng stage.
- **NFR-004:** Page/asset budgets phải được Engineering chốt theo route; regression được kiểm soát trong CI.

### 17.2 Tin cậy và phục hồi

- **NFR-005:** Crash-free sessions ≥99,5% trước Public V1.
- **NFR-006:** Không mất answer/session đã xác nhận khi AI/voice timeout.
- **NFR-007:** Backup, restore test, incident runbook và alert on-call là release gate Public V1.
- **NFR-008:** Critical write dùng idempotency, transaction hoặc retry-safe design.

### 17.3 Security và privacy engineering

- **NFR-009:** Secret chỉ ở server/secret store, không trong client bundle, analytics hoặc log.
- **NFR-010:** AuthN/AuthZ server-side cho mọi resource; object access kiểm tra owner/role.
- **NFR-011:** Rate limit, request size limit, input validation, secure headers và dependency scanning trước Public V1.
- **NFR-012:** Audio/object storage dùng access control và signed access phù hợp thiết kế.
- **NFR-013:** Data inventory, retention, export/delete, consent versioning và access audit phải hoàn tất trước public release.
- **NFR-014:** Yêu cầu pháp lý cụ thể phải được chuyên gia phù hợp xác nhận theo thị trường; PRD này không đưa ra kết luận tuân thủ pháp luật.

### 17.4 Accessibility và localization

- **NFR-015:** Mục tiêu thiết kế là WCAG 2.2 AA cho flow chính; kết quả phải được audit, không tự tuyên bố đạt nếu chưa kiểm chứng.
- **NFR-016:** Keyboard navigation, visible focus, screen-reader labels, caption/transcript, reduced motion và high contrast.
- **NFR-017:** Không truyền đạt score/tone/chính xác chỉ bằng màu.
- **NFR-018:** Hanzi có font/size/line-height dễ đọc; UI tiếng Việt, target content English/Chinese.
- **NFR-019:** Number/date/time theo locale/timezone; thuật ngữ level luôn có nhãn nội bộ.

### 17.5 Compatibility

- **NFR-020:** Browser support matrix do Engineering/Product chốt từ analytics mục tiêu; unsupported browser nhận thông báo và fallback.
- **NFR-021:** PWA install/offline theo capability; không giả vờ hỗ trợ feature nếu platform không cho phép.
- **NFR-022:** Mic/ASR/TTS capability được feature-detect, không dựa chỉ vào user agent.

## 18. Dependencies và assumptions

### 18.1 Dependencies

| Dependency | Mục đích | Rủi ro/giảm thiểu |
|---|---|---|
| Gemini API | AI tutor/generation option | Adapter, schema validation, fallback, budget cap |
| DeepSeek API | AI tutor/generation option | Adapter, timeout, fallback, output validation |
| OpenAI API | Provider fallback option | Không phụ thuộc bắt buộc; adapter/budget controls |
| OpenVox local | TTS local English/Chinese | Discovery/health/warm/fallback browser/cloud |
| Browser mic/audio APIs | Record/playback | Feature detect, permission UX, text fallback |
| ASR/speech analyzer | Transcript, pronunciation/tone | Provider decision + calibration trước V1 |
| PostgreSQL | Identity/progress/content source of truth | Backup/migration/restore tests |
| Redis/job queue | Cache, jobs, notifications, generation | Retry/idempotency/dead-letter/monitoring |
| Object storage | Consent-based audio/content assets | Retention/access control/cleanup |
| Auth provider/library | Account/session | Security review và recovery flow |
| Billing provider | Subscription/entitlement | Verified webhook, ledger, reconciliation |
| Push/email provider | Notifications | Consent, quiet hours, delivery health |
| Analytics/error monitoring | KPI và reliability | Data minimization, event QA, sampling |
| Learning reviewers | Curriculum/rubric/golden set | Capacity planning, review SLA nội bộ |
| Vietnamese/English/Chinese linguistic QA | Chất lượng content | Reviewer pool và escalation |

### 18.2 Assumptions cần xác nhận

- Launch song song English và Chinese; nếu nguồn lực QA không đủ, Product Owner phải ưu tiên một ngôn ngữ thay vì giảm chất lượng cả hai.
- Người dùng chính là người trưởng thành Việt Nam; scope trẻ vị thành niên chưa được mở.
- 35 phút/ngày là mặc định nhưng không phải điều kiện dùng app.
- Local-first OpenVox là lựa chọn ưu tiên về chi phí/riêng tư, không phải khả năng luôn sẵn có trên mọi thiết bị.
- Simplified Chinese là mặc định đến khi có quyết định V2.
- Free/Pro là mô hình đề xuất; giá, trial, refund và billing terms chưa được PRD xác lập.

## 19. Rủi ro và biện pháp giảm thiểu

| ID | Rủi ro | Xác suất | Tác động | Giảm thiểu | Owner |
|---|---|---:|---:|---|---|
| R-01 | Người dùng hiểu Level 7 như chứng chỉ/đảm bảo | Cao | Cao | Nhãn nội bộ, copy review, cấm mapping marketing trực tiếp | Product/Marketing |
| R-02 | AI đưa feedback sai hoặc ngoài level | Cao | Cao | Schema, validator, curriculum bounds, golden set, report, rollout | AI/Learning |
| R-03 | LLM sửa điểm/nâng level ngoài rule | Trung bình | Cao | Tách scoring/rule engine, quyền API, audit và tests | Engineering/Learning |
| R-04 | Transcript đúng nhưng phát âm/tone sai | Cao | Cao | Không chấm speech dimension từ transcript, audio analyzer riêng | Speech/Learning |
| R-05 | Bias/sai lệch speech scoring với giọng Việt | Trung bình | Cao | Pilot, human raters, subgroup analysis, confidence/appeal path | Learning/Data |
| R-06 | Provider AI outage/latency/cost tăng | Cao | Trung bình/Cao | Multi-provider, fallback, timeout, circuit breaker, cap | Platform |
| R-07 | OpenVox không có model/voice tương thích | Trung bình | Trung bình | Discovery, warm, preferred/fallback route, status UX | Speech |
| R-08 | Raw audio/transcript bị lưu quá mức | Trung bình | Cao | Consent, minimization, retention config, access audit | Privacy/Engineering |
| R-09 | Curriculum AI-generated không nhất quán | Cao | Cao | Human QA, immutable version, validators, golden lessons | Content/Learning |
| R-10 | Hai ngôn ngữ làm scope quá lớn | Cao | Cao | Shared primitives, separate QA, release gate theo coverage | Product |
| R-11 | Gamification tăng click nhưng giảm học thật | Trung bình | Trung bình | MPM/evidence guardrails, chống farm XP | Product/Data |
| R-12 | Assessment bị lộ answer key/client tampering | Trung bình | Cao | Server scoring, answer ref, auth, idempotency, security tests | Engineering |
| R-13 | Offline sync ghi trùng/mất progress | Trung bình | Cao | Operation ID, conflict rules, audit/reconciliation | Engineering |
| R-14 | Billing state không khớp entitlement | Trung bình | Cao | Verified webhook, ledger, reconciliation job, support tooling | Billing/Platform |
| R-15 | Notification gây phiền hoặc guilt | Trung bình | Trung bình | Opt-in, quiet hours, cap, copy guideline, unsubscribe | Product/CRM |
| R-16 | Community tạo harassment/PII risk | Cao | Cao | Không mở trước V2 controls, report/block/human moderation | Trust & Safety |
| R-17 | Accessibility không đạt flow voice | Trung bình | Cao | Keyboard/text alternatives, captions, audit với người dùng | Design/QA |
| R-18 | KPI bị sai do idle/duplicate events | Cao | Trung bình | Server validation, dedupe, event contract/data quality | Data |
| R-19 | Thay rubric làm mất khả năng so sánh | Trung bình | Cao | Versioning, compatibility map, không sửa lịch sử | Learning/Data |
| R-20 | Claim privacy/compliance vượt bằng chứng | Trung bình | Cao | Chỉ mô tả design intent; review chuyên gia trước public copy | Product/Privacy |

## 20. Acceptance criteria và release gates

### 20.1 Acceptance criteria cấp sản phẩm

| ID | Tiêu chí nghiệm thu | Bằng chứng bắt buộc |
|---|---|---|
| AC-001 | Người mới hoàn tất onboarding, placement và nhận plan cho English hoặc Chinese. | E2E test + persisted profile/plan records |
| AC-002 | Người học cả hai ngôn ngữ có profile, level, mastery và allocation độc lập. | Integration test và data inspection |
| AC-003 | Today luôn trả next-best-session hợp lệ hoặc fallback có hành động. | Rule tests + E2E empty/degraded cases |
| AC-004 | Lesson hoàn tất nghe–đọc–nói, feedback và retry; progress cập nhật đúng một lần. | E2E + idempotency assertions |
| AC-005 | Placement/checkpoint start không lộ answer key và submit có deterministic score. | API contract/security test |
| AC-006 | AI outage vẫn trả fallback requirements tối đa ba item và không mất answer. | Fault-injection integration test |
| AC-007 | Level chỉ tăng khi đủ bốn nhóm evidence; XP/streak/LLM không thể bypass. | Rule-engine unit/property tests + audit record |
| AC-008 | Transcript-only speaking result gắn preliminary; pronunciation/tone không xuất hiện khi thiếu audio analyzer. | Rubric tests + UI snapshot/E2E |
| AC-009 | Gemini/DeepSeek/OpenAI/demo đổi qua server config, key không xuất hiện ở client/status/log fixture. | Build secret scan + API/log tests |
| AC-010 | OpenVox hoạt động khi available và fallback không chặn lesson khi unavailable. | Live adapter test + fault-injection test |
| AC-011 | Offline attempt sync không trùng và conflict không làm mất evidence. | Multi-device/offline integration tests |
| AC-012 | Free/Pro entitlement được quyết định server-side; cancel/hạ gói giữ dữ liệu. | Billing sandbox/webhook/idempotency tests |
| AC-013 | Admin content có draft→review→publish→rollback, immutable versions và audit. | Admin E2E + database audit inspection |
| AC-014 | Analytics event contract đầy đủ, dedupe và MPM loại idle. | Event schema/data-quality tests |
| AC-015 | Flow chính đáp ứng accessibility target đã chọn và không khóa accessibility sau paywall. | Automated + manual accessibility audit |
| AC-016 | Export/delete/consent/retention flows hoạt động theo policy đã được duyệt; không có claim pháp lý không được xác minh. | Functional test + approved policy/review record |
| AC-017 | Trong 7 ngày production-like với ≥10.000 API requests và ≥1.000 core-journey attempts: web shell ≥99,9%, authenticated API p95 <500 ms, voice p95 <3,5 giây trong network profile đã công bố, uncaught client error <0,5%. | Performance/load/RUM report có sample, profile và raw query lưu lại |
| AC-018 | 100% unit ngày 1–90 của cả hai ngôn ngữ có stable ID, prerequisite hợp lệ, đủ listening/reading/speaking theo catalog, objective→exercise→rubric→checkpoint mapping; không dangling reference và có hai reviewer ngôn ngữ ký. | Automated content coverage report + 2 reviewer approvals/ngôn ngữ |

### 20.2 Gate MVP/Alpha

- Auth/profile/placement hoạt động; dữ liệu progress server-side.
- Curriculum 30 ngày cho cả English và Chinese có review.
- Core lesson nghe–đọc–nói + feedback/retry.
- Checkpoint 7/14/30, scoring và Goal Controller.
- Basic SRS và Today recommendation.
- Gemini/DeepSeek/OpenAI/demo adapter, schema/fallback và secret scan.
- OpenVox local + fallback.
- Content publish tối thiểu, report, consent và observability.
- Không có defect P0/P1 mở theo severity rubric của team.

### 20.3 Gate Beta

- Curriculum 90 ngày đầy đủ; checkpoint ngày 45/60/75/90.
- Reader/Listener, Error Notebook, advanced speech analysis có calibration.
- AI conversation, golden-set regression và sampled human review đạt threshold do Learning/Product duyệt.
- D7, MPM, retry và checkpoint metrics đo được với data-quality pass.
- Offline/sync flow chính và notification preferences hoạt động.
- Accessibility audit flow chính hoàn tất và issue chặn được xử lý.

### 20.4 Gate Public V1

- Auth hardening, rate limit, backup/restore, monitoring, incident runbook và load test hoàn tất.
- Billing/entitlement sandbox-to-production checklist và reconciliation hoạt động.
- Consent, retention, export/delete và access audit hoàn tất theo policy được phê duyệt.
- Privacy policy, terms, subscription copy và market-specific obligations đã được người có chuyên môn phù hợp review; đây là gate review, không phải claim tuân thủ tự động.
- Prompt/model regression suite và kill switch đã diễn tập.
- Crash-free ≥99,5%; performance targets đạt trên sample/environment đã định nghĩa.
- Không còn P0/P1 security issue mở; residual risks được owner chấp thuận.

### 20.5 Definition of Done cho mỗi FR

Một FR chỉ được coi là hoàn thành khi:

1. Acceptance test trace tới FR-ID đã pass.
2. UI có loading/empty/error/offline/permission state liên quan.
3. Authorization, audit và analytics đã được kiểm tra nếu áp dụng.
4. Accessibility và localization được review.
5. Documentation/runbook/content ops được cập nhật nếu vận hành cần.
6. Không tạo regression trên curriculum, assessment, level evidence hoặc entitlement.

## 21. Ma trận truy vết coverage

| Hạng mục yêu cầu PRD | Vị trí chính |
|---|---|
| Document control/status/owner | Mục 0 |
| Product philosophy | Mục 2 |
| Problem/vision/non-goals | Mục 3–4 |
| Personas/JTBD | Mục 5 |
| Outcomes/KPI | Mục 6 |
| Scope MVP/V1/V2 | Mục 7 |
| Exhaustive functional requirements FR-xxx | Mục 10, FR-001–FR-180 |
| Business rules | Mục 9, BR-001–BR-040 |
| User roles/permissions | Mục 8 |
| User journeys | Mục 11 |
| Screen/state/edge/error/empty/loading/offline | Mục 12 |
| Notifications | Mục 13 và FR-124–FR-132 |
| Subscriptions/entitlements | Mục 14 và FR-133–FR-144 |
| Admin/content ops | Mục 16 và FR-151–FR-164 |
| Analytics events | Mục 15 và FR-171–FR-180 |
| Dependencies/assumptions | Mục 18 |
| Risks | Mục 19 |
| Acceptance criteria/release gates | Mục 20 |
| Level 1–7 là nội bộ | BR-001–BR-005, FR-012, FR-097, AC-007 |

## 22. Quyết định còn mở

Các mục sau cần Product Owner và owner chuyên môn chốt trước khi ảnh hưởng release; chúng không làm thay đổi các nguyên tắc bất biến trong PRD:

| ID | Quyết định | Owner đề xuất | Hạn chốt |
|---|---|---|---|
| OD-01 | Launch song song hay ưu tiên một ngôn ngữ nếu capacity QA hạn chế | Product + Learning | Trước planning MVP |
| OD-02 | Provider/auth mechanism production | Engineering + Security | Trước implementation auth |
| OD-03 | ASR và analyzer cho English pronunciation/Chinese tone | Speech + Learning | Trước V1 speech build |
| OD-04 | Raw audio có lưu không, retention bao lâu, theo mode nào | Product + Privacy + Engineering | Trước Beta |
| OD-05 | Local-first hay cloud-first cho account/voice ở V1 | Product + Engineering | Trước architecture freeze |
| OD-06 | Billing provider, catalog, trial, refund và grace policy | Product + Finance/Billing | Trước V1 billing |
| OD-07 | KPI targets sau pilot và ngưỡng AI human-review | Product + Data + Learning | Trước Beta exit |
| OD-08 | Community có nằm trong năm đầu hay giữ ngoài scope | Product + Trust & Safety | Trước V2 planning |
| OD-09 | Browser/device support matrix | Product + Engineering | Trước Beta |
| OD-10 | Data retention/export/delete và market-specific review | Privacy/Security + counsel phù hợp | Trước Public V1 |

## 23. Thuật ngữ

| Thuật ngữ | Định nghĩa |
|---|---|
| Internal Level 1–7 | Thang điều phối nội dung nội bộ của LingoPilot; không phải chứng chỉ |
| Can-do outcome | Năng lực thực hiện quan sát được sau unit/lesson |
| Meaningful Practice Minutes | Phút có hoạt động học chủ đích được xác thực |
| Evidence | Attempt, retention result, checkpoint hoặc artifact chứng minh tiến bộ |
| Learner model | Trạng thái mastery theo language × skill × modality |
| Next-best-action | Hoạt động ưu tiên tiếp theo từ rule/learner model |
| Requirement | Nhiệm vụ học do Goal Controller giao với tiêu chí thành công |
| Deterministic scoring | Điểm tính từ rule/answer/rubric cố định, không do LLM tùy ý quyết định |
| Preliminary score | Điểm sơ bộ vì evidence chưa đủ, ví dụ speaking chỉ có transcript |
| Golden set | Bộ tình huống đã human-review để kiểm tra regression AI/content |
| Entitlement | Quyền tính năng do trạng thái gói/billing server-side xác định |
| Degraded mode | Flow giới hạn nhưng còn dùng được khi AI/voice/network gặp lỗi |
