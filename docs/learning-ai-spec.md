# LingoPilot — Learning Science & AI Specification

> Phiên bản: 1.0.0  
> Trạng thái: Production specification  
> Chủ sở hữu: Head of Learning Science & AI  
> Loại: Learning/AI production specification · Ngày hiệu lực/cập nhật: 2026-08-15  
> Đối tượng sử dụng: Product, Curriculum, Content, AI/ML, Backend, Frontend, QA, Data, Trust & Safety  
> Phạm vi: Web/PWA học tiếng Anh và tiếng Trung cho người Việt, ưu tiên nghe–đọc–nói  
> Nguồn nền: `curriculum.json`, `docs/design-goal.md`, `docs/full-product-design.md`

## 1. Mục đích và quyền ưu tiên

Tài liệu này là hợp đồng triển khai cho hệ thống học tập và giáo viên AI của LingoPilot. Nó biến tầm nhìn 90 ngày thành năng lực quan sát được, logic bài học, đánh giá, thích ứng, kiểm soát AI và cổng chất lượng có thể kiểm thử.

Thứ tự ưu tiên khi có mâu thuẫn:

1. An toàn, quyền riêng tư, sự đồng ý và tính toàn vẹn của đánh giá.
2. `docs/product-requirements.md` đối với scope và business requirement.
3. Tài liệu này đối với learning science, assessment và AI behavior.
4. `docs/technical-architecture.md` và `docs/openapi.yaml` đối với implementation contract.
5. `docs/full-product-design.md` và `docs/design-goal.md` đối với bối cảnh/tầm nhìn.
6. `curriculum.json` đối với hằng số prototype hiện hành: 90 ngày, 35 phút/ngày, ba giai đoạn và nhịp kỹ năng.

“Level 7 trong 90 ngày” là mục tiêu định hướng của sản phẩm, không phải lời hứa chứng chỉ hoặc bảo đảm đầu ra. Ứng dụng phải tách rõ:

- `program_progress`: tiến độ trong chương trình 90 ngày;
- `competency_level`: năng lực có bằng chứng theo từng ngôn ngữ/kỹ năng;
- `confidence`: độ tin cậy của ước lượng;
- `consistency`: mức duy trì lịch học.

## 2. Kết quả học tập và triết lý

### 2.1 North-star learning outcome

Người học hoàn thành nhiệm vụ giao tiếp thực tế phù hợp trình độ bằng tiếng Anh hoặc tiếng Trung, hiểu đầu vào chính, tạo đầu ra dễ hiểu, nhận ra lỗi quan trọng và sửa tốt hơn ở lần thử tiếp theo.

Chỉ số sản phẩm trung tâm là **Meaningful Practice Minutes**: thời gian thực sự dùng để nghe có mục tiêu, đọc hiểu, nhớ lại, nói, sửa lỗi hoặc áp dụng; không tính thời gian mở app, xem animation hay lặp bài quá dễ để lấy XP.

### 2.2 Mười nguyên tắc học tập

1. **Can-do trước nội dung:** mỗi bài bắt đầu bằng việc người học sẽ làm được gì, không bắt đầu bằng tên ngữ pháp.
2. **Hiểu được rồi mới mở rộng:** đầu vào đủ thách thức nhưng có ngữ cảnh, scaffold và khả năng giải nghĩa.
3. **Gọi lại chủ động:** ưu tiên recall/production hơn đọc lại thụ động.
4. **Phân tán và xen kẽ:** ôn đúng lúc, trộn kỹ năng/chủ đề có chủ đích, tránh luyện một dạng quá lâu.
5. **Đầu ra bắt buộc:** mỗi phiên chuẩn phải tạo ít nhất một spoken artifact hoặc nhiệm vụ tương đương khi không có micro.
6. **Feedback ít nhưng có lực:** nêu một điểm tốt, một lỗi ưu tiên, bản sửa, lý do ngắn và retry ngay.
7. **Tối ưu khả năng hiểu:** không ép accent bản ngữ; pronunciation/tone phục vụ intelligibility và ý nghĩa.
8. **Mastery cần bằng chứng trì hoãn:** làm đúng ngay sau khi học chưa đủ; phải kiểm tra lại sau khoảng cách thời gian.
9. **Thích ứng có biên:** AI điều chỉnh nhiệm vụ trong curriculum đã duyệt, không tự viết lại mục tiêu hoặc thăng level.
10. **Động lực không thao túng:** streak và XP hỗ trợ thói quen; không thay thế năng lực, không phạt nặng ngày nghỉ.

### 2.3 Vòng học chuẩn

```text
Orient → Retrieve → Model → Notice → Controlled practice
→ Comprehend → Produce → Feedback → Retry → Exit ticket → Schedule review
```

Một bài không có `produce + feedback + retry` chỉ được phân loại là bài input/review, không được tính là speaking lesson hoàn chỉnh.

### 2.4 Chính sách song ngữ

- English và Chinese có hồ sơ level, mastery, SRS, checkpoint và allocation riêng.
- Không cộng điểm hai ngôn ngữ để tạo một level chung.
- Khung trải nghiệm có thể dùng chung; nội dung, voice, rubric và error taxonomy phải riêng.
- Không dịch máy bài English thành Chinese rồi publish. Mỗi phiên bản ngôn ngữ cần author/reviewer có năng lực tương ứng.
- Phân bổ mặc định khi học cả hai là 50/50 theo tuần; Goal Controller được đổi trong giới hạn hồ sơ người học, nhưng mỗi ngôn ngữ phải có ít nhất một lần retrieval cách quãng mỗi 7 ngày nếu đang active.

## 3. Mô hình năng lực

### 3.1 Các dimension bắt buộc

Mỗi ngôn ngữ được theo dõi theo vector, không chỉ một điểm tổng:

| Dimension | Ý nghĩa | Evidence chính |
|---|---|---|
| Listening | Hiểu gist, detail, intent ở tốc độ phù hợp | câu hỏi nghe, dictation, task completion |
| Reading | Hiểu ý, liên kết, inference và ngôn ngữ trong ngữ cảnh | comprehension, summary, phrase-in-context |
| Spoken interaction | Luân phiên lượt nói, phản hồi và đạt mục đích | roleplay/conversation artifact |
| Spoken production | Tạo đoạn nói có tổ chức | monologue/summary artifact |
| Language control | Grammar, vocabulary, appropriateness | rubric + lỗi xác định được |
| Speech intelligibility | Người nghe hiểu được đầu ra | audio analysis + human sample |
| Retention | Gọi lại sau khoảng cách thời gian | delayed review/checkpoint |
| Literacy-specific | English sound–spelling hoặc Chinese pinyin/hanzi | bài đặc thù ngôn ngữ |

Level tổng chỉ là bản tóm tắt. UI và hệ thống quyết định phải lưu `dimension_scores`, `evidence_count`, `evidence_age` và `confidence`.

### 3.2 Quy tắc gán level

- Level 1–7 là thang nội bộ, không tự ánh xạ thành CEFR/HSK.
- Level được xác nhận khi mọi dimension bắt buộc đạt ngưỡng sàn và điểm tổng có trọng số đạt ngưỡng của level.
- Không dùng trung bình để che một skill gap nghiêm trọng: nghe/đọc/nói dưới ngưỡng sàn sẽ giữ level hiện tại.
- Speaking chỉ có transcript được gắn `preliminary`; không dùng để xác nhận pronunciation/tone.
- Level có trạng thái `estimated`, `provisional`, `verified`, `stale`.
- Evidence quá 45 ngày không có kiểm tra duy trì làm confidence giảm; không âm thầm hạ level, nhưng chuyển sang `stale` và yêu cầu recheck.

## 4. Level 1–7 — English competency descriptors

| Level | Listening | Reading | Speaking & interaction | Pronunciation/language control | Bằng chứng tối thiểu |
|---:|---|---|---|---|---|
| 1 — Starter | Nhận ra lời chào, tên, số và chỉ dẫn một bước khi nói chậm | Hiểu biển báo/từ/câu mẫu rất ngắn | Nói tên, quốc tịch, nhu cầu bằng cụm/câu thuộc mẫu | Phân biệt và tạo được một số âm trọng yếu; trọng âm từ cơ bản đủ hiểu | 2 task nghe, 2 đọc, 1 recording 30–45 giây, delayed review |
| 2 — Foundation | Hiểu câu ngắn về bản thân, giờ giấc, sinh hoạt với lặp lại có giới hạn | Hiểu đoạn 50–100 từ có từ vựng quen thuộc | Hỏi/đáp câu đơn, giới thiệu 60 giây với prompt nhẹ | Âm cuối và trọng âm từ không thường xuyên làm mất nghĩa; dùng câu đơn cơ bản | 3 modality, recording 60 giây, retention sau ≥7 ngày |
| 3 — Survival | Lấy gist/detail chính trong hội thoại quen thuộc, tốc độ chậm–vừa | Hiểu đoạn 100–180 từ và tìm thông tin cụ thể | Xử lý mua sắm, chỉ đường, lịch hẹn; giữ 2 phút với follow-up quen thuộc | Linking/rhythm bước đầu; dùng question forms và thì cơ bản đủ chính xác | roleplay 2 phút + checkpoint nghe/đọc ≥ ngưỡng |
| 4 — Everyday | Hiểu ý chính và phần lớn chi tiết ở chủ đề đời sống, tốc độ vừa | Hiểu đoạn 180–300 từ, suy luận đơn giản | Duy trì 3–4 phút, kể trải nghiệm và giải thích lựa chọn | Intelligibility ổn định; kiểm soát tense/aspect, connectors thông dụng | conversation + summary + delayed checkpoint |
| 5 — Independent | Hiểu nội dung tự nhiên có cấu trúc rõ và một số reduced forms | Hiểu bài 300–500 từ, nhận thái độ và luận điểm chính | Tóm tắt, trình bày quan điểm, xử lý hiểu nhầm với ít hỗ trợ | Stress/rhythm hỗ trợ nghĩa; lỗi grammar không cản trở nhiệm vụ | task tích hợp nghe/đọc/nói, 5–7 phút |
| 6 — Confident | Theo kịp tốc độ gần tự nhiên ở chủ đề quen thuộc và công việc | Đọc 500–800 từ, tích hợp thông tin từ nhiều đoạn | Hội thoại 7–10 phút, giải thích, so sánh, thương lượng đơn giản | Prosody tự nhiên hơn; range/accuracy đủ cho nhiệm vụ phức hợp | 2 artifact khác chủ đề + retention 30 ngày |
| 7 — Operational | Hiểu phần lớn ý/chi tiết/intent trong tình huống thực tế, biết yêu cầu làm rõ phần thiếu | Đọc và tổng hợp văn bản thực dụng 800+ từ phù hợp domain | Hoàn thành nhiệm vụ công việc/du lịch/xã hội 10 phút với ít scaffold; tự sửa hiệu quả | Speech rõ, linh hoạt; lỗi còn lại hiếm khi gây hiểu nhầm | phase-90 task tích hợp, human-audited sample, không dimension dưới sàn |

## 5. Level 1–7 — Chinese competency descriptors

Chinese mặc định là 普通话 và chữ giản thể. Pinyin là scaffold, không phải đích literacy cuối cùng.

| Level | Listening | Reading/characters | Speaking & interaction | Tones/pinyin/language control | Bằng chứng tối thiểu |
|---:|---|---|---|---|---|
| 1 — Starter | Nhận ra lời chào, số và từ cực quen trong câu chậm | Nhận diện pinyin, 30–50 hanzi/cụm tần suất cao có hỗ trợ | Nói tên, quốc tịch, lời chào bằng cụm mẫu | Nhận diện bốn thanh; tạo syllable đơn có feedback; biết neutral tone tồn tại | tone ID + phrase recognition + recording 20–30 giây |
| 2 — Foundation | Hiểu câu ngắn về bản thân, gia đình, thời gian | Đọc 80–120 hanzi/cụm trong câu ngắn; gõ pinyin chọn đúng chữ | Hỏi/đáp câu đơn, tự giới thiệu 60 giây | Initial/final cơ bản; tone đơn và tone pair phổ biến đủ phân biệt | 3 modality + tone-pair sample + retention ≥7 ngày |
| 3 — Survival | Lấy gist/detail trong hội thoại quen thuộc chậm–vừa | Đọc đoạn 80–150 chữ, pinyin chỉ hiện theo yêu cầu | Mua sắm, gọi món, lịch hẹn, chỉ đường trong 2 phút | Xử lý 3rd-tone sandhi và 一/不 trong cụm đã học; word order cơ bản | roleplay + character recognition + checkpoint |
| 4 — Everyday | Hiểu phần lớn hội thoại đời sống tốc độ vừa | Đọc 150–250 chữ, nhận cụm thay vì tách từng hanzi | Duy trì 3–4 phút, kể lịch/trải nghiệm và giải thích lựa chọn | Tone contour và rhythm câu ổn định hơn; aspect particles cơ bản | conversation + oral retell + delayed review |
| 5 — Independent | Hiểu nội dung tự nhiên có ngữ cảnh và một số câu tỉnh lược | Đọc 250–400 chữ, suy luận đơn giản, tra cứu có chọn lọc | Tóm tắt, nêu quan điểm, xử lý breakdown bằng clarification | Tone errors ít gây đổi nghĩa; dùng complement/connector phù hợp | task tích hợp + character-in-context retention |
| 6 — Confident | Theo kịp tốc độ gần tự nhiên ở chủ đề quen thuộc/công việc | Đọc 400–650 chữ với ít pinyin, tổng hợp nhiều đoạn | Hội thoại 7–10 phút, mô tả quy trình, so sánh và thương lượng đơn giản | Prosody cụm từ tự nhiên hơn; control đủ cho nhiệm vụ phức hợp | 2 artifact khác chủ đề + retention 30 ngày |
| 7 — Operational | Hiểu ý/chi tiết/intent trong tình huống thực tế và chủ động làm rõ | Đọc/tổng hợp văn bản thực dụng 650+ chữ phù hợp domain | Hoàn thành nhiệm vụ 10 phút với ít scaffold; paraphrase khi thiếu từ | Tone/segment/rhythm nhìn chung dễ hiểu; lỗi còn lại ít ảnh hưởng giao tiếp | phase-90 task tích hợp, human-audited sample, không dimension dưới sàn |

## 6. Kiến trúc curriculum 90 ngày

### 6.1 Hằng số chương trình

- Thời lượng: 90 ngày.
- Ngân sách mặc định: 35 phút/ngày; biến thể được hỗ trợ: 15/25/35/50 phút.
- Nhịp gốc từ `curriculum.json`: nghe 12 phút, đọc 10 phút, nói 10 phút, ôn 3 phút.
- Phiên production chuẩn hóa thành: retrieval 3, listening 10–12, reading 8–10, speaking 10, reflection/exit 2–4 phút.
- Recovery day không phá streak khi weekly goal đã đạt.
- Mỗi tuần có integration task và learning review không chấm điểm. Scored checkpoint chỉ chạy ngày 7, 14, 30, 45, 60, 75 và 90; ngày 30/60/90 là phase checkpoint.

### 6.2 Ba giai đoạn

| Giai đoạn | Ngày | Mục tiêu | Input | Output | Exit evidence |
|---|---:|---|---|---|---|
| Foundation | 1–30 | Âm/thanh điệu, câu lõi, 500 từ/cụm tiếp nhận có ưu tiên | câu và đoạn ngắn, tốc độ kiểm soát | self-introduction, hỏi/đáp nhu cầu cơ bản | 60 giây mỗi ngôn ngữ + nghe/đọc + retention |
| Expansion | 31–60 | Hội thoại đời thường, đọc dài hơn, phản xạ follow-up | English 150–300 từ; Chinese 150–250 chữ; transcript sau lượt đầu | nói 3 phút, tóm tắt không nhìn ghi chú | integrated checkpoint + error repair |
| Operational confidence | 61–90 | Tốc độ gần tự nhiên, domain cá nhân, tự sửa lỗi | extensive input và tình huống ít dự đoán hơn | hội thoại 10 phút + nhiệm vụ thực tế | day-90 performance task + self-assessment |

“500 từ thiết yếu” là target tiếp xúc/nhận biết của Phase 1, không đồng nghĩa 500 từ đã mastered production.

### 6.3 Bản đồ 13 tuần

| Tuần | Ngày | Can-do spine | Learning emphasis | Assessment |
|---:|---:|---|---|---|
| 1 | 1–7 | Chào hỏi, giới thiệu, xác nhận thông tin | baseline âm/tone, retrieval habit | placement + weekly diagnostic |
| 2 | 8–14 | Thói quen, thời gian, lịch | câu hỏi, số/thời gian, detail listening | weekly checkpoint |
| 3 | 15–21 | Đồ ăn, mua sắm, số lượng | transactional turns, repair phrases | learning review |
| 4 | 22–28 | Địa điểm, chỉ đường, di chuyển | spatial language, sequence | learning review |
| 5 | 29–35 | Tích hợp nền tảng và chuyển phase | 60-second task, lỗi ưu tiên | day-30 phase checkpoint |
| 6 | 36–42 | Công việc/học tập | description, process, workplace phrases | learning review |
| 7 | 43–49 | Du lịch và dịch vụ | roleplay, unexpected follow-up | day-45 checkpoint |
| 8 | 50–56 | Kinh nghiệm đã qua/kế hoạch | time reference, narrative | learning review |
| 9 | 57–63 | Tóm tắt và giải thích | gist→detail→summary | day-60 phase checkpoint |
| 10 | 64–70 | Ý kiến, so sánh, lý do | discourse markers, clarification | learning review |
| 11 | 71–77 | Vấn đề và giải pháp | negotiation, repair, domain input | day-75 checkpoint |
| 12 | 78–84 | Domain cá nhân | extensive input, targeted repair | rehearsal review |
| 13 | 85–90 | Tích hợp và chứng minh | transfer, self-correction, reflection | day-90 phase checkpoint |

Mỗi tuần giữ theme chung để giảm tải nhận thức nhưng English/Chinese dùng language progression riêng. Hệ thống được đổi chủ đề bề mặt theo sở thích, không đổi can-do, target structure hoặc difficulty envelope.

### 6.4 Quy tắc ngân sách thời gian

- 15 phút: review 3, input 4, controlled practice 3, speaking 4, exit 1.
- 25 phút: review 3, listening 7, reading 5, speaking 8, exit 2.
- 35 phút: lịch chuẩn.
- 50 phút: lịch chuẩn + 10 phút extensive input + 5 phút conversation transfer.
- Không giao quá 100% ngân sách ngày. Learner có thể chủ động chọn bài mở rộng ngoài plan; phần mở rộng phải được ghi riêng và không làm task bắt buộc vượt budget.
- Task chưa xong được reschedule tối đa hai lần; sau đó Goal Controller chia nhỏ hoặc thay chiến lược, không tạo backlog vô hạn.

## 7. Lesson grammar

### 7.1 Định nghĩa formal

```text
Lesson := Contract + Retrieval? + Input + Notice + Practice+ + Production + Feedback + Retry + Exit
Contract := can_do + language + level + prerequisites + time_budget
Input := Listening | Reading | Multimodal
Notice := MeaningFocus + FormFocus? + SoundOrToneFocus?
Practice := Recognition | Recall | Manipulation | Dictation | Shadowing
Production := ControlledSpeech | Roleplay | Retell | OpenResponse
Feedback := EvidenceBoundPraise + PriorityCorrection + BetterModel + Reason
Retry := SameTargetWithReducedSupport
Exit := IndependentTransfer + ConfidenceRating
```

### 7.2 Lesson contract

Mọi lesson version phải có:

- `lesson_id`, `version`, `language`, `phase`, `level_band`;
- một `can_do` có động từ quan sát được;
- `target_skills`, `target_phrases`, `language_focus`;
- prerequisite và misconception/error dự kiến;
- time budget và số exercise tối đa;
- audio/transcript/translation policy;
- production task và rubric;
- exit ticket;
- review seeds;
- source/provenance, author, reviewer, publish status.

### 7.3 Độ khó và scaffold

Difficulty envelope được xác định bằng:

- độ dài câu/đoạn và tốc độ audio;
- mật độ từ/cụm chưa mastered;
- độ phức tạp cú pháp và discourse;
- độ quen thuộc của task/topic;
- số lượt, mức bất ngờ và cognitive load;
- lượng hint, translation, pinyin/transcript;
- yêu cầu recognition, recall hay free production.

Mỗi bài phải có ba mức scaffold: `full`, `partial`, `independent`. Adaptation chỉ di chuyển một mức mỗi quyết định trừ khi có lỗi kỹ thuật hoặc placement rõ ràng.

### 7.4 Exercise acceptance rules

- Một item chỉ đo một primary construct; secondary tags được phép.
- Distractor phải hợp lý nhưng không mơ hồ hoặc dựa vào mẹo.
- Answer key/rubric được tạo trước attempt và version hóa.
- Không để LLM thay answer key sau khi thấy câu trả lời.
- Listening lượt đầu không hiện transcript; accessibility accommodation được log riêng, không coi là gian lận.
- Speaking checkpoint luôn lưu artifact hoặc lý do hợp lệ không lưu audio.
- Feedback không sửa quá hai lỗi; retry tập trung lỗi ưu tiên.

## 8. SRS, mastery và adaptation

### 8.1 Đơn vị học

Ưu tiên phrase/sentence trong ngữ cảnh. Mỗi `learning_item` gồm:

```json
{
  "itemId": "en.request.directions.001",
  "language": "en",
  "form": "How do I get to ...?",
  "meaningVi": "Tôi đi đến ... bằng cách nào?",
  "contextIds": ["travel.station"],
  "skillTags": ["listening.detail", "speaking.interaction"],
  "pronunciationTags": ["sentence_stress", "linking"],
  "state": "learning",
  "stability": 1.8,
  "difficulty": 0.42,
  "dueAt": "2026-08-17T09:00:00Z"
}
```

### 8.2 Trạng thái và sự kiện

`new → learning → review → mastered`; trả lời sai có thể chuyển `lapsed`, không xóa lịch sử.

Mỗi attempt ghi:

- task mode: recognition/comprehension/cued recall/free production;
- correctness hoặc rubric score;
- response time, hint count, confidence tự báo;
- ASR/audio quality khi liên quan;
- context novelty;
- timestamp và content version.

### 8.3 Thuật toán scheduling

Scheduler theo mô hình stability–difficulty có thể thay bằng FSRS-compatible implementation, nhưng API phải ổn định:

```text
retrievability = f(stability, elapsed_time)
next_interval = g(target_retention, stability, difficulty, grade)
priority = overdue + checkpoint_gap + error_severity + goal_alignment
           + transfer_need - fatigue - recent_repetition
```

Grade nội bộ: `again`, `hard`, `good`, `easy`; mapping từ evidence phải deterministic. Target retention mặc định 0,85, được hiệu chỉnh bằng dữ liệu; không dùng một interval cố định cho mọi modality.

### 8.4 Mastery model

Mastery lưu theo `user × language × skill × modality`:

```json
{
  "recognition": 0.82,
  "comprehension": 0.74,
  "cuedProduction": 0.61,
  "freeProduction": 0.48,
  "speech": 0.57,
  "retention": 0.69,
  "confidence": 0.73,
  "evidenceCount": 12,
  "lastVerifiedAt": "2026-08-15T02:00:00Z"
}
```

Không coi một skill mastered nếu chỉ recognition cao. Ngưỡng launch tạm thời:

- `introduced`: ≥1 evidence hợp lệ;
- `practiced`: ≥3 evidence, ít nhất hai task mode;
- `provisional_mastery`: production ≥0,70 và comprehension ≥0,75;
- `verified_mastery`: provisional + delayed retention ≥0,75 sau ≥7 ngày + không lỗi nghiêm trọng lặp lại trong hai lần gần nhất.

Các ngưỡng phải được hiệu chỉnh bằng pilot; thay đổi ngưỡng cần version và backtest.

### 8.5 Adaptation policy

Next Best Action chọn tối đa ba task theo thứ tự:

1. prerequisite hoặc safety-critical communication gap;
2. review quá hạn/sắp quên;
3. skill gap gần checkpoint;
4. mục tiêu cá nhân;
5. cân bằng modality và ngôn ngữ;
6. variety/fatigue.

Quy tắc:

- Hai lần đúng độc lập, confidence cao: giảm scaffold hoặc tăng một nấc complexity.
- Hai lỗi cùng pattern: chèn micro-explanation + controlled practice + retry.
- ASR confidence thấp: yêu cầu xác nhận/thu lại, không cập nhật mastery âm.
- Nhiều hint: không tính evidence như independent production.
- Weekly checkpoint có quyền đổi trọng tâm tuần; một item đơn lẻ không viết lại study plan.
- Hệ thống phải trả `reasonCodes` để giải thích vì sao giao task.

## 9. Hệ thống đánh giá

### 9.1 Nguyên tắc psychometric tối thiểu

- Blueprint cố định construct, tỷ trọng, difficulty và coverage trước khi tạo đề.
- Scoring khách quan dùng answer key deterministic; LLM không quyết định đúng/sai khi có thể xác định bằng rule.
- Open response dùng rubric analytic và lưu evidence.
- Mọi score kèm standard error/confidence; không hiển thị độ chính xác giả.
- Đề quan trọng có anchor items để theo dõi drift và comparability.
- Placement tối ưu routing, không phải chứng chỉ.
- Không ra quyết định thăng level từ một lần đo duy nhất.

### 9.2 Placement blueprint

| Thành phần | Số item/task | Tỷ trọng | Thiết kế |
|---|---:|---:|---|
| Listening | 8–12 | 30% | gist, detail, number/time, intent; adaptive clusters |
| Reading | 8–12 | 35% | meaning, inference, form-in-context |
| Speaking controlled | 2 | 10% | read/respond; speech quality nếu audio đủ |
| Speaking open | 1–2 | 25% | self-introduction + scenario response |

- Thời lượng placement mục tiêu: 5–8 phút/ngôn ngữ. Nếu chưa đủ confidence trong giới hạn này, kết quả phải ghi `preliminary` và đề nghị bổ sung evidence ở checkpoint, không tự kéo dài.
- Routing bắt đầu ở Level 2–3; hai item chắc chắn đúng chuyển cụm cao hơn, hai sai chuyển thấp hơn.
- Stop khi confidence đủ hoặc đạt giới hạn thời gian.
- Kết quả: level estimate theo dimension, confidence, gaps, recommended start unit và kế hoạch tuần 1.
- Không lộ answer key trong payload client.

### 9.3 Weekly checkpoint blueprint

| Thành phần | Số lượng | Mục đích |
|---|---:|---|
| Delayed retrieval | 4–6 | retention item từ 7–21 ngày trước |
| Listening | 3–5 | gist/detail trên material chưa gặp |
| Reading | 3–5 | transfer sang ngữ cảnh mới |
| Speaking | 1 controlled + 1 open | lỗi tuần và can-do task |
| Reflection | 2 prompt | confidence, blocker, strategy |

- 8–12 phút cho scored checkpoint ngày 7, 14, 30, 45, 60, 75 và 90. Các tuần còn lại chỉ có learning review, không ghi score so sánh hay đổi level.
- 70% item đo transfer/retention, tối đa 30% item giống practice.
- Kết quả điều chỉnh task tuần sau, không tự tăng level.

### 9.4 Phase assessment blueprints

| Mốc | Performance task | Input task | Speech/literacy focus | Thời lượng |
|---:|---|---|---|---:|
| Day 30 | giới thiệu 60 giây + follow-up | nghe/đọc đời sống ngắn | English sounds/stress; Chinese tones/pinyin/hanzi nền | 15–18 phút |
| Day 60 | nói 3 phút + tóm tắt không ghi chú | đoạn mới đúng phase | fluency, discourse; tone pairs/character-in-context | 18–22 phút |
| Day 90 | hội thoại 10 phút + nhiệm vụ tích hợp | input gần tự nhiên theo domain | intelligibility, repair, independent literacy | 20–25 phút |

Recovery test chỉ đo gap cụ thể sau hai checkpoint chưa đạt. Challenge test không bỏ qua prerequisite hoặc delayed retention.

### 9.5 Scoring

Điểm tổng mặc định cho placement/checkpoint:

```text
overall = listening × 0.30 + reading × 0.35 + speaking_task × 0.25
          + language_specific_speech_or_literacy × 0.10
```

Nếu không có audio hợp lệ, dimension speech không được suy đoán; trả `insufficient_evidence` và score tổng là provisional theo trọng số đã công bố, không tự phân bổ bí mật.

Ngưỡng level ban đầu để pilot: L1 `<25`, L2 `25–39`, L3 `40–54`, L4 `55–69`, L5 `70–81`, L6 `82–91`, L7 `≥92`. Đây là cut score nội bộ cần standard-setting với human raters trước public v1.

### 9.6 Rubric speaking chung — 0 đến 4

| Dimension | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Task completion | không có/không liên quan | đạt rất ít | đạt một phần | đạt mục tiêu chính | đạt đầy đủ, xử lý follow-up |
| Comprehensibility | không hiểu được | hiểu rời rạc | hiểu với nỗ lực | nhìn chung dễ hiểu | rõ và ổn định |
| Fluency/coherence | không tạo chuỗi | nhiều ngắt, rời rạc | chuỗi ngắn | liên kết phù hợp | mạch lạc, pace phù hợp level |
| Grammar/control | không đủ mẫu | lỗi cản nghĩa thường xuyên | lỗi nhưng ý chính rõ | kiểm soát tốt cấu trúc mục tiêu | range/control vượt yêu cầu |
| Vocabulary | không đủ | cực hạn chế | đủ tối thiểu | phù hợp task | linh hoạt và chính xác |
| Interaction/repair | không phản hồi | phụ thuộc prompt toàn phần | phản hồi cơ bản | giữ lượt và làm rõ | chủ động repair/paraphrase |

Rater/AI phải cung cấp evidence span hoặc timestamp. Không chấm personality, accent prestige hay tốc độ nói nhanh như năng lực.

### 9.7 Rubric English pronunciation — 0 đến 4

- Segmental contrasts ảnh hưởng nghĩa.
- Word stress.
- Sentence stress/rhythm.
- Linking/reduction phù hợp level.
- Overall intelligibility.

Điểm 4 không có nghĩa “giống người bản xứ”; nghĩa là rõ, ổn định và hỗ trợ nhiệm vụ. Lỗi không ảnh hưởng hiểu biết được ghi như polish, không chặn level.

### 9.8 Rubric Chinese speech/literacy — 0 đến 4

- Initial/final accuracy.
- Lexical tone và tone-pair contour.
- Tone sandhi/neutral tone trong ngữ cảnh đã học.
- Phrase rhythm và overall comprehensibility.
- Character recognition/word segmentation phù hợp level.

Transcript đúng không chứng minh tone đúng. Character handwriting là optional; không được chặn conversational progression trừ khi mục tiêu người học yêu cầu viết tay.

### 9.9 Tính tin cậy và fairness

- Double-rate ít nhất 10% golden/pilot open responses.
- Mục tiêu weighted kappa hoặc ICC ≥0,75 trước beta; ≥0,80 cho phase-gate quan trọng.
- Theo dõi chênh lệch false-pass/false-fail theo thiết bị, giới, vùng giọng Việt, noise band và provider; không lưu thuộc tính nhạy cảm nếu không có cơ sở/consent.
- Accommodation (caption, tốc độ, không micro) phải rõ và không làm người học mất quyền học; score interpretation ghi điều kiện đo.
- Appeals/report tạo hàng đợi human review và không làm mất artifact.

## 10. English pronunciation system

### 10.1 Mục tiêu và phạm vi

Mục tiêu là intelligibility cho người Việt, ưu tiên lỗi làm đổi nghĩa hoặc cản hiểu. Hệ thống không gán “accent score” thẩm mỹ.

Error taxonomy tối thiểu:

- final consonant deletion/devoicing;
- phụ âm dễ nhầm theo learner population;
- vowel length/quality contrasts có tác động nghĩa;
- consonant clusters;
- word stress;
- sentence stress, rhythm, linking, reduction;
- pause/chunking và intonation theo ý định.

Taxonomy phải được expert phê duyệt; không giả định mọi người Việt có cùng lỗi.

### 10.2 Pipeline

```text
audio quality gate → VAD/segmentation → ASR + alignment
→ phoneme/prosody features → task-aware scoring
→ confidence calibration → feedback selection → retry comparison
```

Quality gate từ chối chấm khi clipping, SNR thấp, audio quá ngắn, sai ngôn ngữ hoặc alignment thất bại. Hệ thống vẫn cho phép nghe mẫu và thu lại.

### 10.3 Feedback selection

Thứ tự ưu tiên:

1. lỗi gây đổi từ/ý;
2. lỗi lặp lại nhiều lần;
3. stress/chunking cản hiểu;
4. polish.

Một turn chỉ chọn một priority fix. Feedback gồm vị trí/timestamp, cách đặt miệng hoặc cue nhịp ngắn, model audio và A/B retry. Không dùng IPA bắt buộc với beginner; cho phép bật chế độ chi tiết.

## 11. Chinese tones và characters

### 11.1 Tone progression

1. Nhận diện tone đơn trong syllable quen thuộc.
2. Sản xuất tone đơn với contour visualization.
3. Tone pairs tần suất cao.
4. Từ/cụm đa âm tiết.
5. 3rd-tone sandhi, 一/不, neutral tone trong lexical chunks.
6. Tone/prosody trong câu và speech tự nhiên.

Tone scoring dùng pitch contour chuẩn hóa theo speaker range, alignment và lexical target; không dùng absolute pitch hoặc transcript đơn thuần. Feedback tránh tuyên bố tone “sai” khi confidence thấp.

### 11.2 Pinyin policy

- Level 1: hiện pinyin theo mặc định trong giới thiệu item.
- Level 2: pinyin theo tap/toggle sau lượt đầu.
- Level 3+: Hanzi-first, pinyin ẩn mặc định trừ item pronunciation mới hoặc accommodation.
- Pinyin phải có dấu thanh chuẩn; không dùng số trừ chế độ nhập liệu/technical fallback.

### 11.3 Character progression

```text
recognize whole word → distinguish similar forms → map sound/meaning
→ identify useful components/radicals → type via pinyin → optional handwriting
```

- Dạy từ/cụm, không biến curriculum thành danh sách hanzi rời.
- Radical/component dùng như memory cue, không bịa etymology.
- Stroke order chỉ cho tập chữ thiết yếu hoặc mục tiêu viết.
- Đánh giá recognition và production riêng; gõ đúng bằng IME là literacy evidence hợp lệ nhưng không tương đương viết tay.
- Segmentation và phrase tap phải được lexicon/validator kiểm tra.

## 12. Kiến trúc multi-agent AI

### 12.1 Nguyên tắc

“Agent” là vai trò logic có input/output/permission riêng; không bắt buộc mỗi vai trò là một process hoặc model call. Gộp call được phép nếu vẫn giữ schema, audit và separation of duties.

### 12.2 Trách nhiệm

| Agent | Được làm | Không được làm | Output chính |
|---|---|---|---|
| Tutor Orchestrator | lập execution plan, gọi agent, enforce policy | tự chấm deterministic item, tự publish content | `TutorPlan` |
| Curriculum Planner | chọn can-do/unit/skill trong graph đã duyệt | tạo prerequisite mới hoặc đổi level framework | `SessionPlan` |
| Goal Controller | chuyển gap thành ≤3 requirement khả thi | vượt ngân sách, ép thăng/hạ level | `LearningRequirements` |
| Lesson Generator | điền lesson template trong envelope | tự publish, tự tạo fact/grammar không nguồn | `LessonDraft` |
| Conversation Coach | điều phối lượt nói, scaffold, repair | chẩn đoán y khoa/tâm lý, chat ngoài policy | `ConversationTurn` |
| Error Evaluator | phân loại lỗi từ evidence, chọn priority fix | suy đoán pronunciation từ transcript | `FeedbackReport` |
| Assessment Engine | assemble blueprint, deterministic scoring | để model đổi answer key/cut score | `AssessmentResult` |
| Review Scheduler | cập nhật SRS/mastery từ event hợp lệ | dùng engagement để giả mastery | `ReviewPlan` |
| Voice Adapter | ASR/TTS/analyzer routing, confidence | claim speech score khi audio fail | `SpeechEvidence` |
| Content Validator | schema, level, language, answerability, safety | tự nới policy để pass | `ValidationReport` |
| Progress Evaluator | tổng hợp evidence và confidence | cấp chứng chỉ CEFR/HSK | `ProgressSnapshot` |
| Safety Guardian | topic/PII/minor/self-harm checks, redact/escalate | lưu dữ liệu vượt policy | `SafetyDecision` |

### 12.3 Orchestrator state machine

```text
RECEIVE → AUTHZ/CONSENT → LOAD_CONTEXT → CLASSIFY_INTENT
→ PLAN → CALL_TOOLS/AGENTS → VALIDATE → POLICY_CHECK
→ COMMIT_LEARNING_EVENT → RESPOND → OBSERVE
```

Nếu validation/policy fail: repair một lần bằng error list; fail lần hai dùng deterministic safe fallback. Không gửi raw provider output thẳng cho client.

### 12.4 Orchestrator policies

- Chỉ dùng curriculum/content version `published`.
- Mỗi action phải có `purpose`, `learnerBenefit`, `evidenceRefs`, `policyVersion`.
- Không tăng level hoặc đổi score nếu không có signed/immutable assessment event.
- Không vượt ba yêu cầu học chính hoặc 100% time budget; bài mở rộng chỉ xuất hiện khi learner chủ động chọn và không được tính là bắt buộc.
- Không đưa nội dung ngoài age/topic policy.
- Không gọi cloud speech khi profile là local-only.
- Không đưa PII/audio không cần thiết vào prompt.
- Model không được gọi trực tiếp database write; application service validate và commit.
- Retry provider phải idempotent theo `requestId`; không nhân đôi session/assessment.
- Mọi fallback phải gắn nhãn, reason code và telemetry.

## 13. Schemas dữ liệu AI

### 13.1 Envelope chung

```json
{
  "schemaVersion": "1.0",
  "requestId": "uuid",
  "purpose": "lesson_generate",
  "language": "en",
  "contentVersion": "course-en-1.3.0",
  "promptVersion": "lesson-v7",
  "provider": "gemini",
  "model": "configured-model-id",
  "confidence": 0.84,
  "evidenceRefs": ["skill:en.directions.ask"],
  "warnings": [],
  "payload": {}
}
```

Server tự điền provider/model/run metadata; không tin model tự khai các trường này.

### 13.2 SessionPlan

```json
{
  "canDoId": "en.travel.directions.ask",
  "level": 3,
  "minutes": 15,
  "targetSkills": ["listening.detail", "speaking.interaction"],
  "retrievalItemIds": ["item-1", "item-2"],
  "lessonTemplateId": "learn-practice-apply-v2",
  "scaffold": "partial",
  "successCriteria": ["task_completion>=3", "retry_improves=true"],
  "reasonCodes": ["CHECKPOINT_GAP", "DUE_REVIEW"]
}
```

### 13.3 FeedbackReport

```json
{
  "attemptId": "uuid",
  "evidenceQuality": "sufficient",
  "whatWorked": "Bạn đã hỏi đúng mục đích và dùng câu lịch sự.",
  "priorityFix": {
    "errorCode": "EN_WORD_STRESS",
    "evidenceSpan": {"startMs": 1200, "endMs": 1820},
    "observed": "...",
    "betterVersion": "...",
    "reasonVi": "Trọng âm này giúp người nghe nhận ra từ nhanh hơn."
  },
  "retryPrompt": "Nói lại câu một lần, nhấn vào âm tiết được đánh dấu.",
  "rubricScores": {"taskCompletion": 3, "comprehensibility": 2},
  "confidence": 0.78,
  "requiresHumanReview": false
}
```

### 13.4 LearningRequirement

```json
{
  "requirementId": "uuid",
  "skill": "zh.speaking.tone_pair.3-2",
  "reasonCode": "REPEATED_MEANING_AFFECTING_ERROR",
  "reasonVi": "Cặp thanh 3–2 bị nhầm ở 3/4 lần gần nhất.",
  "taskTemplateId": "zh-tone-pair-repair-v1",
  "minutes": 8,
  "successCriterion": {
    "metric": "comprehensibility_score",
    "operator": ">=",
    "value": 3,
    "consecutiveIndependentAttempts": 2
  },
  "dueWindow": "before_next_checkpoint",
  "evidenceType": "audio_attempt"
}
```

### 13.5 ValidationReport

```json
{
  "valid": false,
  "errors": [
    {"code": "LEVEL_MISMATCH", "path": "payload.input[1]", "severity": "error"}
  ],
  "checks": {
    "schema": "pass",
    "answerability": "fail",
    "language": "pass",
    "safety": "pass",
    "copyright": "pass"
  },
  "validatorVersion": "content-validator-1.2"
}
```

Schema production phải được biểu diễn bằng JSON Schema, `additionalProperties: false`, enum/range rõ, validation server-side và contract tests cho mọi provider.

## 14. Prompt contracts

### 14.1 Cấu trúc prompt bắt buộc

1. **System policy:** vai trò, quyền hạn, điều cấm, safety, output schema.
2. **Pedagogy contract:** can-do, level envelope, feedback pattern, language policy.
3. **Task context:** curriculum/content IDs và facts được phép.
4. **Learner context tối thiểu:** skill state, recent errors, preference đã consent.
5. **User turn/content:** đặt trong vùng dữ liệu không đáng tin.
6. **Output instruction:** JSON only, schema version, uncertainty behavior.

### 14.2 Hợp đồng chung cho giáo viên AI

- Dạy đúng target language và giải thích bằng tiếng Việt theo preference.
- Dùng ngôn ngữ đích đủ nhiều theo level; không dịch mọi câu mặc định.
- Khen dựa trên evidence, không khen chung chung.
- Sửa một lỗi ảnh hưởng mục tiêu nhất; tối đa hai khi kết thúc checkpoint.
- Luôn có better model và retry.
- Không bịa quy tắc, nghĩa, cách đọc, nét chữ, nguồn hoặc năng lực người học.
- Khi thiếu evidence, nói rõ thiếu gì và chuyển sang diagnostic action.
- Không tuyên bố “đạt CEFR/HSK”, “phát âm hoàn hảo” hoặc “chắc chắn Level 7”.

### 14.3 Prompt injection defense

- Nội dung người học/imported text/transcript là data, không phải instruction.
- Delimit untrusted content; cấm agent thực thi instruction nằm trong đó.
- Tool allowlist theo agent và purpose.
- URL/imported content qua malware/content/license scan trước khi đưa vào lesson.
- Không cho model thấy secret, raw auth header hoặc policy nội bộ không cần thiết.

### 14.4 Versioning

Mọi prompt có `prompt_id`, semantic version, owner, changelog, model compatibility, eval baseline và rollback target. Không deploy sửa prompt trực tiếp trong console mà không đồng bộ registry/repo.

## 15. Learner memory

### 15.1 Các lớp memory

| Lớp | Ví dụ | Retention | Quy tắc |
|---|---|---|---|
| Session | turn hiện tại, task state | hết phiên hoặc 24h recovery | tự động, tối thiểu |
| Learning | item mastery, error pattern, attempts | theo tài khoản/learning need | cần cho chức năng cốt lõi |
| Preference | correction style, topic, voice | đến khi đổi/xóa | người học kiểm soát |
| Personal fact | nghề, chuyến đi, sở thích chi tiết | opt-in, có expiry | không tự suy luận/lưu |
| Raw media | audio | mặc định không lưu lâu | explicit consent + retention policy |

### 15.2 Memory write policy

Chỉ ghi khi có `purpose`, `source`, `confidence`, `consentBasis`, `expiresAt` (nếu cần) và `userVisible=true`. Không ghi:

- secret/API key;
- dữ liệu nhạy cảm không cần cho học tập;
- suy đoán sức khỏe, chính trị, tôn giáo, tài chính;
- kết luận personality/ability không có rubric;
- raw conversation/audio vô hạn.

Người học phải xem, sửa, export và xóa memory. Xóa account phải cascade hoặc anonymize theo policy đã công bố.

### 15.3 Retrieval policy

- Retrieve theo language + active goal + purpose.
- Top-k nhỏ, redaction trước prompt.
- Personal fact không dùng trong assessment scoring.
- Memory có confidence thấp hoặc mâu thuẫn phải hỏi lại, không tự chọn.
- Log ID đã retrieve, không log nội dung nhạy cảm.

## 16. Provider routing — Gemini, DeepSeek, OpenAI

### 16.1 Adapter contract

Mỗi provider adapter phải hỗ trợ:

- system instruction;
- structured output/JSON mode hoặc schema repair;
- timeout, cancellation, token cap;
- normalized usage/latency/error;
- model allowlist theo purpose;
- safety metadata nếu có;
- idempotency ở application layer;
- streaming chỉ khi endpoint/client hỗ trợ an toàn.

Key `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `OPENAI_API_KEY` chỉ ở server secret store/environment. Không trả key qua status endpoint, client bundle, log hoặc error trace.

### 16.2 Routing policy

`AI_PROVIDER=auto` có thể giữ thứ tự mặc định Gemini → DeepSeek → OpenAI khi key khả dụng, nhưng production router quyết định theo capability matrix:

| Purpose | Yêu cầu | Routing |
|---|---|---|
| Lesson structured generation | schema adherence, multilingual accuracy | model đã pass golden lesson gate |
| Assessment feedback | evidence grounding, low variance | model đã pass rubric agreement gate |
| Conversation | latency, instruction following | model đạt p95 và safety gate |
| Content validation | precision, deterministic settings | validator model/rule ensemble |
| Summarize progress | grounding vào metrics | model đạt faithfulness gate |

Không route model chỉ vì rẻ nếu chưa đạt capability gate. Router xét: policy eligibility → data residency/privacy → health/circuit → capability score → latency → cost budget.

### 16.3 Fallback và circuit breaker

- Timeout theo purpose; retry cùng provider tối đa một lần chỉ với lỗi transient.
- Sau threshold lỗi, mở circuit và route provider đủ chuẩn tiếp theo.
- Fallback nhận cùng normalized prompt contract, nhưng output phải validate lại.
- Assessment deterministic vẫn hoàn thành khi mọi LLM lỗi; dùng feedback template và Goal Controller rule-based.
- Không đổi provider giữa chừng làm mất conversation state; dùng provider-neutral state summary đã validate.
- Telemetry ghi `route_reason`, `fallback_count`, `provider_error_class`, không ghi secret/PII.

### 16.4 Cost controls

- Token/input cap theo purpose và level.
- Cache content đã duyệt; không generate lại mỗi lần học.
- Batch offline content generation/validation.
- Daily/user budget với graceful degradation.
- Không cắt ngắn feedback đến mức mất correction/retry contract.

## 17. Safety, hallucination và trust

AI governance tham chiếu [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) cùng [OWASP Top 10 for Large Language Model Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/). Đây là baseline quản trị và threat modeling, không phải chứng nhận.

### 17.1 Safety domains

- Nội dung tình dục, bạo lực, thù ghét, tự hại, chất cấm và hành vi nguy hiểm.
- Quấy rối, grooming và open contact với trẻ vị thành niên.
- PII, doxxing, credential/API key.
- Tư vấn y tế/pháp lý/tài chính vượt phạm vi học ngôn ngữ.
- Copyright và imported content.
- Bias/stereotype văn hóa, giới, dân tộc, quốc tịch.

Age policy phải là input bắt buộc nếu sản phẩm phục vụ minor. Open-ended mode cho minor dùng topic allowlist, không direct messaging và có escalation phù hợp.

### 17.2 Hallucination taxonomy

- `FACT_UNGROUNDED`: bịa facts/source.
- `LANGUAGE_RULE_FALSE`: giải thích grammar/usage sai.
- `TRANSLATION_MISMATCH`: dịch sai ý/register.
- `ANSWER_KEY_DRIFT`: đáp án thay đổi sau attempt.
- `EVIDENCE_MISATTRIBUTION`: feedback không khớp lời người học.
- `SPEECH_OVERCLAIM`: suy pronunciation/tone từ transcript hoặc audio yếu.
- `LEVEL_OVERCLAIM`: gán level/chứng chỉ thiếu evidence.
- `MEMORY_FABRICATION`: gọi lại fact người học chưa cung cấp.

### 17.3 Prevention và recovery

1. Ground prompt vào content/rule registry đã duyệt.
2. Structured schema và deterministic validators.
3. Evidence citation bằng item/attempt/span ID.
4. Rule-based consistency check answer key/rubric/level.
5. Confidence threshold và abstention.
6. Repair một lần; sau đó safe fallback.
7. Nút report ở feedback/content.
8. Quarantine content/run, human review và rollback khi severity cao.

Thông báo cho người học phải rõ: “AI chưa đủ bằng chứng để chấm phần này; hãy thu lại” thay vì tạo điểm giả.

## 18. Human review và content lifecycle

### 18.1 Vai trò và separation of duties

- Learning designer: can-do, sequence, exercise intent.
- English/Chinese language expert: accuracy, naturalness, register.
- Assessment specialist: blueprint, rubric, item quality, cut score.
- Speech specialist: pronunciation/tone taxonomy và evidence.
- Safety reviewer: age/topic/cultural risks.
- Production approver: publish/rollback; không phải chính generator duy nhất cho high-stakes content.

### 18.2 Lifecycle

```text
BRIEF → DRAFT → AUTOMATED_VALIDATE → EXPERT_REVIEW → PILOT
→ CALIBRATE → APPROVED → PUBLISHED → MONITOR
→ REVISE | DEPRECATE | ROLLBACK
```

Mỗi content object có version bất biến, provenance, license, locale, target level, skill tags, answer key/rubric, generator/prompt/model, reviewer và dates. Attempt luôn tham chiếu version đã thấy.

### 18.3 Review sampling

- 100% phase assessment, answer key, rubric và grammar explanation được expert review trước publish.
- 100% golden lessons và safety-sensitive content được review.
- Generated practice low-stakes: automated gate + risk-based sample; tỷ lệ ban đầu tối thiểu 10%, tăng khi provider/prompt mới hoặc defect tăng.
- User report severity P0/P1 vào immediate queue; content có thể auto-quarantine.

### 18.4 Change control

- Patch: copy fix không đổi construct/answer.
- Minor: thêm item/variant trong cùng blueprint; cần regression eval.
- Major: đổi level, rubric, cut score, sequence hoặc construct; cần revalidation/backtest và migration plan.
- Rollback phải khôi phục content + prompt + model routing config tương thích.

## 19. Model và prompt evaluations

### 19.1 Eval pyramid

1. **Schema/contract tests:** parse, enum, length, required fields.
2. **Deterministic validators:** answerability, key consistency, level bounds, forbidden claims.
3. **Golden offline evals:** expert-labeled English/Chinese tasks.
4. **Pairwise human eval:** correctness, pedagogy, naturalness, actionability.
5. **Shadow/canary:** production-like traffic không ảnh hưởng người học hoặc rollout nhỏ.
6. **Online monitoring:** quality, learning outcome, latency, cost, reports.

### 19.2 Golden datasets

Tối thiểu trước beta:

| Dataset | Quy mô tối thiểu | Coverage |
|---|---:|---|
| Lesson generation | 280 case | 2 ngôn ngữ × 7 level × 10 can-do × variants |
| Feedback/correction | 420 attempt | grammar, vocabulary, task, speech evidence quality |
| English speech | 350 clip | levels, noise/device bands, Vietnamese accent diversity |
| Chinese tone | 420 clip | 4 tones, neutral, tone pairs, sandhi, noise bands |
| Assessment scoring | 300 response | objective + open response + edge cases |
| Safety/red-team | 300 prompt | minors, PII, injection, harmful/off-topic |
| Memory grounding | 150 scenario | contradiction, expiry, opt-out, fabricated memory |

Mỗi sample có: ID, language/level, input, trusted context, expected constraints, expert label/rubric, acceptable variants, forbidden behavior, severity và provenance/consent. Audio dataset phải có quyền sử dụng rõ.

### 19.3 Eval metrics và ngưỡng ship ban đầu

| Metric | Alpha | Beta | Public v1 |
|---|---:|---:|---:|
| JSON/schema valid | ≥99,0% | ≥99,7% | ≥99,9% |
| Language/level adherence | ≥95% | ≥97% | ≥98% |
| Expert factual/language accuracy | ≥94% | ≥97% | ≥98% |
| Feedback evidence-grounded | ≥93% | ≥96% | ≥98% |
| Actionable feedback contract | ≥95% | ≥98% | ≥99% |
| Assessment AI–human agreement | ≥0,75 | ≥0,80 | ≥0,85 |
| Harmful/PII leak on red-team | 0 critical | 0 critical | 0 critical |
| Unsupported level/cert claim | 0 | 0 | 0 |
| Speech abstain precision khi audio xấu | ≥90% | ≥95% | ≥97% |

Không dùng aggregate để che critical failure. Một P0 safety/privacy hoặc answer-key integrity failure chặn release.

### 19.4 Regression protocol

Mọi thay đổi model/prompt/schema/routing phải:

1. chạy full contract + affected golden suites;
2. so với baseline theo per-language/per-level slices;
3. không giảm metric critical; giảm >1 điểm phần trăm ở metric quality cần review;
4. qua adversarial/injection suite;
5. canary có rollback tự động;
6. ghi eval run, artifact, approver và decision.

## 20. AI quality KPIs và observability

### 20.1 Quality KPIs

- Valid response rate.
- Grounded feedback rate.
- Human acceptance/edit rate.
- Hallucination report rate theo taxonomy/severity.
- Retry-after-feedback rate và retry improvement rate.
- Error recurrence sau 7/30 ngày.
- AI–human rubric agreement.
- Appropriate abstention rate; false confidence rate.
- Next Best Action completion và learning gain, không chỉ click-through.

### 20.2 Reliability/latency/cost KPIs

- Provider success/fallback/circuit-open rate.
- p50/p95 orchestration latency theo purpose.
- Voice turn p95 mục tiêu ≤3,5 giây trong điều kiện hỗ trợ.
- Cost trên meaningful practice minute và completed lesson.
- Duplicate event rate, lost attempt rate, schema repair rate.
- Content defect escape rate và median time-to-quarantine/resolve.

### 20.3 SLO ban đầu

- Assessment deterministic availability ≥99,9%.
- Tutor structured response success ≥99,5% sau fallback.
- Không mất attempt đã acknowledged.
- AI outage không chặn core lesson/review đã cache.
- P0 safety/privacy: acknowledge nội bộ ≤15 phút, containment theo incident policy.

Telemetry phải phân tách language, level, device/audio quality, prompt/model/content version; dashboard không hiển thị raw learner text/audio mặc định.

## 21. Failure modes và hành vi bắt buộc

| Failure mode | Detection | Hành vi hệ thống | Không được làm |
|---|---|---|---|
| Mọi LLM unavailable | timeout/circuit | deterministic lesson/feedback template, giữ progress | mất answer/attempt |
| Provider trả JSON lỗi | schema validator | repair 1 lần, fallback provider/template | gửi raw text cho client |
| ASR confidence thấp | threshold/quality gate | hỏi xác nhận hoặc thu lại | chấm pronunciation/tone |
| Audio clipping/noise | signal checks | hướng dẫn mic, retry, mark insufficient | cập nhật mastery âm |
| OpenVox down/429 | health/error | backoff 1 lần, browser/cloud fallback theo consent | gọi cloud ở local-only mode |
| Answer key conflict | validator/monitor | stop assessment, quarantine version | để LLM chọn đáp án mới |
| AI feedback sai evidence | span check/report | suppress score, safe feedback, review queue | ghi lỗi vào learner model |
| Prompt injection | classifier/delimiters | ignore instruction, safe task response | thực thi tool ngoài allowlist |
| Memory mâu thuẫn | provenance/confidence | hỏi người học, ưu tiên fact mới được xác nhận | hợp nhất âm thầm |
| Task vượt thời gian | budget validator | chia nhỏ/reschedule | tạo backlog vô hạn |
| Learner liên tục thất bại | mastery trend | scaffold, prerequisite repair, recovery test | hạ level vì một phiên |
| Learner quá dễ/chán | accuracy + speed + self-report | giảm hint, transfer/challenge | XP farming |
| Safety crisis/self-harm | safety classifier | supportive safe response + local resources policy | roleplay tiếp hoặc chẩn đoán |
| Content defect production | report spike | quarantine, rollback, notify owner | sửa in-place mất audit |
| Duplicate retry/request | idempotency key | trả kết quả cũ/continue safely | tạo hai assessment run |
| Score drift theo model | golden/anchor monitoring | freeze routing, rollback, re-eval | tự đổi cut score |

## 22. Acceptance gates

### 22.1 Gate A — Learning design ready

- Level 1–7 descriptors có can-do và evidence riêng cho English/Chinese.
- 90 ngày có phase/week/unit map, prerequisite graph và coverage matrix nghe–đọc–nói.
- Mỗi lesson theo grammar, có production, feedback, retry, exit ticket.
- SRS/mastery/adaptation có version, reason code và deterministic tests.
- Learning Science và language expert ký duyệt.

### 22.2 Gate B — Assessment ready

- Placement, weekly và phase blueprints/versioned item banks hoàn chỉnh.
- Answer key không gửi client và không thể đổi sau start.
- Rubric, double-rating, calibration và appeal workflow hoạt động.
- Score reproducibility 100% cho objective items.
- AI–human agreement đạt beta threshold; cut score đã standard-setting.
- Không thăng level nếu thiếu delayed retention hoặc speaking evidence.

### 22.3 Gate C — AI contract ready

- Tất cả agent có permission, schema, timeout, idempotency và fallback.
- Gemini/DeepSeek/OpenAI adapter pass cùng contract suite.
- API key chỉ server-side; log redaction được kiểm thử.
- Prompt/model/content version xuất hiện trong audit run.
- Deterministic core vẫn hoạt động khi tắt toàn bộ provider.

### 22.4 Gate D — Content quality ready

- 100% high-stakes content expert-reviewed.
- Golden datasets đạt coverage và ngưỡng beta/public tương ứng.
- Không critical hallucination, answer-key drift, PII leak hoặc unsupported certification claim.
- Copyright/provenance đầy đủ.
- Quarantine/rollback được diễn tập.

### 22.5 Gate E — Speech ready

- Quality gate phân biệt audio hợp lệ/không hợp lệ theo ngưỡng đã calibrate.
- English pronunciation và Chinese tone không dựa transcript-only.
- Kết quả ổn định qua device/noise slices; bias review hoàn tất.
- Feedback có timestamp/evidence và retry comparison.
- Local OpenVox/fallback tôn trọng consent và đạt latency SLO.

### 22.6 Gate F — Safety, privacy và operations ready

- Consent, export/delete, retention, minor policy và incident runbook được kiểm thử end-to-end.
- Red-team đạt 0 critical failure.
- Monitoring/alert/owner/on-call và kill switch cho prompt/model/content có sẵn.
- Rate limit, abuse prevention, budget cap, backup và recovery được diễn tập.
- Human review queue có SLA và escalation.

### 22.7 Gate G — Learning efficacy ready

Trước tuyên bố hiệu quả rộng:

- Có pilot với baseline và delayed post-test phù hợp.
- Báo cáo completion/attrition, không chỉ người hoàn thành.
- Có control/comparison hợp lý hoặc tuyên bố giới hạn thiết kế nghiên cứu.
- Đo transfer task, retention 7/30 ngày và speaking artifact.
- Kết quả được phân tích riêng English/Chinese và baseline band.
- Marketing claim khớp evidence; không biến Level 7 thành chứng chỉ.

## 23. Definition of Done theo use case

### 23.1 Placement

- Người học hoàn thành từng ngôn ngữ độc lập.
- Có estimate theo dimension + confidence + start unit.
- Không lộ key; retry idempotent; outage có kết quả deterministic.
- Study plan tuần đầu có tối đa ba requirement, phút và success criterion.

### 23.2 Daily lesson

- Can-do và time estimate rõ.
- Có retrieval, input, comprehension, spoken production, feedback, retry, exit.
- Attempt và meaningful time được lưu chính xác.
- Review items được schedule từ evidence, không từ click.

### 23.3 Weekly/phase checkpoint

- Blueprint/version/rubric cố định trước start.
- Kết quả có artifact, score breakdown, confidence và next action.
- Level transition chỉ qua policy engine và audit event.
- Người học có quyền report/appeal và xem giải thích dễ hiểu.

### 23.4 AI conversation

- Goal, level, target phrases và turn budget được khóa.
- Coach không chiếm lượt nói; scaffold giảm theo năng lực.
- Kết thúc có transcript, tối đa hai priority fix và retry.
- Safety/off-topic/provider failure có đường thoát không mất session.

## 24. Ma trận truy xuất yêu cầu

| Yêu cầu | Phần đặc tả | Evidence triển khai cần có |
|---|---|---|
| Learning philosophy | §2 | lesson review checklist, analytics definition |
| Level 1–7 English/Chinese | §3–5 | competency registry + UI/evidence tests |
| 90-day curriculum | §6 | versioned course graph + coverage report |
| Lesson grammar | §7 | JSON Schema + fixture lessons |
| SRS/mastery/adaptation | §8 | scheduler simulation + reason-code tests |
| Placement/weekly/phase assessments | §9 | blueprints, item bank, scoring/rater tests |
| English pronunciation | §10 | audio golden set + confidence calibration |
| Chinese tones/characters | §11 | tone/hanzi golden set + language review |
| Multi-agent/orchestrator | §12 | permission matrix + orchestration traces |
| Schemas/prompts/memory/providers | §13–16 | contract suite + privacy/security tests |
| Safety/hallucination/human review | §17–18 | red-team + review/rollback drill |
| Model/prompt evals/golden data/KPIs | §19–20 | eval reports + dashboards/alerts |
| Failure modes/acceptance gates | §21–23 | game-day evidence + signed release checklist |

## 25. Các quyết định cần hiệu chỉnh bằng dữ liệu

Các giá trị sau là baseline production-design, không phải chân lý cố định:

- cut score Level 1–7;
- target retention 0,85 và mastery thresholds;
- số item/thời lượng placement;
- weights giữa listening/reading/speaking/literacy;
- speech confidence thresholds;
- provider/model ưu tiên;
- sampling rate human review;
- KPI release thresholds ngoài các invariant safety/integrity.

Mọi hiệu chỉnh phải có hypothesis, dataset, offline result, slice analysis, approver, effective date, rollback và migration impact. Các invariant không được nới bằng A/B test: không lộ secret/PII, không đổi answer key sau attempt, không suy speech từ transcript, không tự cấp chứng chỉ, không critical safety failure.

## 26. Kết luận vận hành

LingoPilot không coi AI là curriculum và không coi chat là học. Curriculum xác định đích; assessment tạo bằng chứng; mastery/SRS quyết định thời điểm; orchestrator chọn hành động trong biên; AI tạo và diễn đạt dưới schema; human governance giữ chuẩn. Một release chỉ đạt khi đồng thời đúng về ngôn ngữ, có ích về sư phạm, đáng tin về đánh giá, an toàn về dữ liệu và có khả năng suy giảm mềm khi model hoặc voice provider thất bại.
