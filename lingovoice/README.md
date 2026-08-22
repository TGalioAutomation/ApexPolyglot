# LingoVoice

Webapp học tiếng Anh và tiếng Trung **voice-driven** với **lộ trình học cá nhân hóa 90 ngày (P0–P4)**, dùng giọng nói tự nhiên từ **OpenVox local TTS** và **giáo viên AI (DeepSeek/Gemini/OpenAI)**.

## Tính năng theo giai đoạn

| Giai đoạn | Module | Nội dung |
|---|---|---|
| **P4** | Lộ trình cá nhân hóa | Placement test (deterministic), hồ sơ mục tiêu/phút/tỷ lệ Anh–Trung, lộ trình 3 chặng 90 ngày, next-best-action, kế hoạch ngày theo SRS + lỗi + điểm yếu |
| **P0** | Từ mới + SRS | Học cụm theo thẻ (nghĩa, ví dụ, audio), AI sinh thẻ từ, SRS SM-2 lite (new→learning→review→mastered), error notebook tự nạp lỗi |
| **P1** | Viết câu | Sắp xếp chunks, nghe–viết (dictation), dịch ngược, viết tự do + cô giáo chấm (praise/fix/corrected/why/retry) |
| **P2** | Giao tiếp | Shadowing (nghe–nhại–ASR), **Gọi thoại với cô giáo** (roleplay tình huống, nói qua micro + cô đọc to lời thoại, kết thúc có nhận xét + nạp lỗi), hỏi–đáp tự do |
| **P3** | Đọc | Bài đọc graded 3 cấp độ (Anh/Trung), read-aloud từng câu, tap cụm lưu ôn (phrase mining), câu hỏi đọc hiểu |
| **Memory** | Trí nhớ dài hạn | Store server-side (`data/learner-memory.json`) lưu mục tiêu, placement level, điểm yếu, tiến độ SRS, từ đã học, lỗi sai, ghi chú; tự nạp vào mọi câu trả lời giáo viên để luôn cá nhân hóa và hướng tới thông thạo nói/nghe/dùng |
| **Coach** | Cô giáo chủ động | Thẻ "Lời khuyên của cô giáo" trên Hôm nay tính từ trí nhớ (lỗi lặp lại, review đến hạn, điểm yếu, mục tiêu) + CTA chuyển tab + nghe ví dụ bằng OpenVox; tự nhắc khi mở app |
| Chung | Voice + Giáo viên | Nút bấm nghe/tự đọc câu mẫu (OpenVox, fallback browser TTS), panel cô giáo đồng hành mọi màn hình (nhập chữ + gợi ý nhanh) |

Tất cả dữ liệu học (hồ sơ, SRS, lỗi, cụm đã lưu) lưu `localStorage`; trước mắt chạy 1 thiết bị, không cần tài khoản.

## Dữ liệu từ vựng đã chuẩn bị (data preparation)

- **`data/terms-en.txt` / `data/terms-zh.txt`** — danh sách từ khởi điểm theo định dạng `term|topic|workplace|freq|cefr` (tham chiếu tần suất BNC/COCA + CEFR).
- **`data/vocab-en.json` / `data/vocab-zh.json`** — dữ liệu đã sinh: EN ~150 từ (96 công việc, 141 từ freq 1–2, A1:30 · A2:50 · B1:62 · B2:8) + ZH 40 từ (đủ pinyin dấu thanh). App tải qua `GET /data/vocab-{lang}.json` và gộp vào Vocabulary Studio (giữ nguyên schema).
- **Sinh dữ liệu mới**:
  ```bash
  node scripts/prep-vocab.mjs --lang en            # đọc terms-en.txt, sinh thẻ, xuất vocab-en.json
  node scripts/prep-vocab.mjs --lang zh --limit 20 --dry-run   # thử trước, chưa ghi
  ```
  Script gán hint chuẩn (freq/workplace/cefr/topic) ghi đè AI, kiểm tra chất lượng tự động (IPA/pos/collocations EN, pinyin ZH, độ dài ví dụ theo CEFR), dedupe theo term, xuất JSON. Chi tiết: `docs/data-preparation.md`.
- `data/learner-memory.json` (trí nhớ cô giáo) được gitignore; `vocab-*.json` và `terms-*.txt` là nội dung đã chuẩn bị và được theo dõi.

## Lộ trình CEFR & từ vựng theo tần suất

- **Màn Lộ trình** hiển thị **khung tham chiếu CEFR (A1→C2)** kèm mốc từ vựng A1 ~500 · A2 ~1.500 · B1 ~2.500 · B2 ~5.000 · C1 ~8.000 · C2 ~16.000 từ. Mỗi cấp nêu rõ chủ đề, cấu trúc, kỹ năng và đầu ra cần học; số từ chỉ là mốc tham chiếu, không thay cho đánh giá năng lực hoặc chứng chỉ CEFR.
- **Học từ theo tần suất + giao tiếp công việc**: mỗi từ có `freq` (1–5, 1 = rất phổ biến) và `workplace` (dùng trong công việc); Learn Session ưu tiên từ **tần suất cao trước**, và **nhóm công việc trước** nếu mục tiêu là "Công việc & phỏng vấn"; card hiển thị chip "Tần suất x/5 · Giao tiếp công việc"; Word Bank thêm lọc **Tần suất** và **Công việc**; AI sinh thẻ kèm freq/workplace.
- Bộ từ tiếng Anh có **Workplace Pack** (deadline, report, colleague, project, manager, client, interview, presentation, negotiate, salary, feedback, task…).

## Vocabulary Studio (khu vực Từ mới)

Khu vực "Từ mới" là một **Vocabulary Studio** chuyên biệt:

- **Studio Home**: số từ cần ôn / từ mới / thời lượng; CTA chính "Bắt đầu phiên ôn tập", phụ "Học 3 từ mới"; tab Ôn tập · Học mới · Kho từ · Lỗi.
- **Focused Session**: 1 thẻ mỗi lần, mặt trước **không lộ nghĩa/ví dụ**, CTA "Hiện đáp án"; sau reveal mới hiện **Lại / Khó / Tốt / Dễ** kèm interval dự kiến (1 phút / 1 ngày / 3 ngày / 10 ngày); phím **Space** = hiện đáp án, **1–4** = đánh giá; kết thúc có summary.
- **SRS 4 mức** (`public/srs-core.cjs` dùng chung browser + test): Lại ~1 phút, Khó ~1 ngày, Tốt ~3 ngày, Dễ ~10 ngày; **không mastered sau một lượt Dễ** (cần 3 lượt tốt liên tiếp); hiện lịch ôn dễ hiểu.
- **Card EN**: từ, từ loại, IPA + trọng âm, audio thường + **audio chậm**, nghĩa, câu ví dụ, 2 collocations. **Card ZH**: Hanzi chính, pinyin có dấu thanh, audio, nghĩa, ví dụ Hanzi+pinyin+dịch, ghi chú measure word/tone pair.
- **Word Bank**: search + lọc ngôn ngữ/chủ đề/trạng thái (new/learning/review/mastered/difficult), màn chi tiết từ, AI tạo thẻ có **preview/edit trước khi lưu** + **cảnh báo từ trùng**.
- **Fix UI**: `[hidden]` ẩn thật; mini player nằm **trên bottom nav** (mobile); teacher dock ẩn trong session để không che card/grade; responsive 320–430 full-width + action cố định dưới; desktop card ≤680px giữa; vùng chạm ≥44px; `aria-live` cho card mới/kết quả; không dùng flip 3D (chỉ fade/transition ngắn).

## Nhân vật 2D Cô Linh

- **Cô Linh là nhân vật 2D** (SVG flat hoạt hình): mắt **chớp**, thân hình **lơ lửng nhẹ**, **miệng cử động khi nói** (khi cô đọc to câu mẫu), **chấm suy nghĩ** khi đang trả lời; xuất hiện ở nút dock, header panel và **stage trong Trò chuyện** (bong bóng hiển thị lời thoại).
- Trạng thái: `body.co-speaking` khi cô đọc to, `body.co-thinking` khi đang suy nghĩ — đều có hiệu ứng trên nhân vật.

## Giao tiếp bằng giọng nói (voice conversation)

- **"Gọi thoại tự do"** trong Trò chuyện với cô giáo: bạn **nói qua mic** → cô giáo nghe (ASR) → suy nghĩ → **trả lời và nói to đầy đủ** (phần tiếng Việt qua giọng trình duyệt nếu có, câu mẫu qua OpenVox) → **tự mở mic nghe tiếp** (vòng lặp liên tục, hands-free). Bật bằng nút "Gọi thoại tự do".
- Trạng thái trên nhân vật: "Cô đang nói…" / "Cô đang nghe bạn nói…" (viền xanh) / "Cô đang suy nghĩ…". Nếu phản hồi thiếu câu mẫu 【 】, tự trích câu tiếng Anh/Hanzi để vẫn đọc to.
- Không có mic: tự nhắc gõ tin nhắn (fallback).

## Giao tiếp với giáo viên

- **Trò chuyện với cô giáo** (Speaking → Trò chuyện): **nói qua micro** (ASR) hoặc gõ; cô giáo **nhớ mạch hội thoại** (gửi lịch sử lượt gần nhất), trả lời kèm câu mẫu và **tự đọc to** câu mẫu bằng OpenVox (có nút "Nghe lại"); 4 gợi ý chủ đề (giới thiệu bản thân, kể về ngày, sửa câu, hỏi một câu).
- Ngoài ra: **Gọi thoại** (roleplay kịch bản, cô đọc lời thoại), panel Cô Linh đồng hành, trí nhớ dài hạn.

## Đà học tập & báo cáo tuần

- **Đà học tập** trên màn Hôm nay: streak (ngày liên tiếp, hôm nay chưa học vẫn tính chờ), **phút hôm nay / mục tiêu**, **từ học tuần này**, biểu đồ **7 ngày gần nhất**, và nhắc nhẹ khi nghỉ ≥1 ngày ("Đã N ngày chưa học — quay lại với 5 phút nhé!").
- Hoạt động được ghi nhận tự động: khi **kết thúc phiên học từ** và **hoàn thành bài luyện nghe** (lưu `lv-days` theo ngày).

## Trải nghiệm bắt đầu

- **Onboarding 3 bước lần đầu mở app**: ① tạo hồ sơ tên riêng, chọn giai đoạn 3–25 tuổi, mục tiêu + thời gian → ② test đầu vào EN/ZH (hoặc bỏ qua) → ③ nút **"Học bài đầu tiên ngay"** tự mở phiên học từ mới (lưu hồ sơ `startedAt` + cờ `lv-onboarded`).
- **Tiếp tục bài đang dở**: thoát giữa phiên học thì trạng thái phiên được lưu (`lv-session`); màn Hôm nay ưu tiên hiển thị **"Tiếp tục bài đang dở"** và bấm là resume đúng tiến độ (x/y); tự xoá khi hoàn thành phiên.

## Một hồ sơ học tập xuyên suốt 3–25 tuổi

- Một người học dùng một hồ sơ liên tục: từ đã học, lịch SRS, lỗi thường gặp, placement và mối quan hệ với Cô Linh không bị reset khi đổi độ tuổi.
- Bốn giai đoạn thích ứng: **3–6 Làm quen**, **7–12 Xây nền**, **13–17 Bứt phá**, **18–25 Ứng dụng**.
- Mỗi giai đoạn đổi nội dung ưu tiên, mục tiêu phù hợp, CTA, màu nhấn, mật độ và kích thước thao tác; nền giao diện vẫn đủ trưởng thành để không biến trải nghiệm 18–25 thành app trẻ con.
- `stageHistory` và `journeyStartedAt` lưu lịch sử hành trình bằng ngày theo múi giờ thiết bị; hồ sơ này cũng được đồng bộ vào trí nhớ dài hạn của Cô Linh.

## Bắt đầu học — luôn rõ "hôm nay học gì"

- Màn **Hôm nay** luôn có **một bài học cụ thể** + một nút **"Bắt đầu ngay" hoạt động thật** (ưu tiên: lỗi lặp lại → từ sắp quên → điểm yếu theo placement → mặc định **"Học 3 từ mới hôm nay"**) — không bao giờ là dead-end.
- Người mới chưa thiết lập vẫn **học được ngay**; đồng thời hiện hướng dẫn **"Bắt đầu ở đây — 2 bước"** (① chọn mục tiêu & thời gian → ② test đầu vào) với nút **Thiết lập ngay** / **Bỏ qua, học luôn**; guide tự ẩn sau khi thiết lập.
- **Checklist hôm nay**: mỗi mục có nút **"Bắt đầu →"** mở đúng hoạt động (học từ mới / đọc / nói / ôn tập) + vòng check đánh dấu đã làm (lưu theo ngày).

## Điều hướng & UX (audit fixes)

- **Nav 5 mục**: Hôm nay · Lộ trình · Luyện tập · Cô Linh · Thêm. Trên mobile dùng **bottom navigation** (icon+label, ≥44px, safe-area); desktop dùng pills trên đầu. Các kỹ năng (Từ mới/Viết/Nói/Đọc/Nghe) gom vào **Luyện tập** dạng sub-tabs.
- **Tab semantics**: `aria-controls`/`aria-labelledby`, roving tabindex, phím **ArrowLeft/ArrowRight/Home/End**.
- **Cô Linh**: panel đóng/mở đúng (`hidden` thật), mobile là **bottom sheet** (max 70dvh, backdrop, Escape, trả focus).
- **Màn Hôm nay**: một hero "Bài tốt nhất tiếp theo", checklist ≤4 hoạt động, roadmap thành progress bar.
- **Màn Nghe**: mở trực tiếp tự khởi tạo câu (không 0/0); mỗi bài 5 câu → kết quả + thêm cụm vào SRS.
- Không tràn ngang tại 320/390/768/1280; vùng chạm ≥44px trên mobile; `prefers-reduced-motion` hỗ trợ.

## Chạy

Yêu cầu: Node ≥ 18 và **OpenVox** đang chạy tại `http://127.0.0.1:8000/v1`.

```bash
npm start
# hoặc
node server.mjs
```

Mở http://localhost:4174

## Chạy bản production bằng Docker

```bash
docker build -t lingovoice .
docker run -d --name lingovoice \
  --env-file .env \
  -e APP_ACCESS_USER=student \
  -e APP_ACCESS_PASSWORD='mật-khẩu-dài-ngẫu-nhiên' \
  -p 4174:4174 \
  --restart unless-stopped \
  lingovoice
curl http://127.0.0.1:4174/healthz
```

`APP_ACCESS_PASSWORD` bật Basic Auth cho toàn bộ giao diện và API (trừ
`/healthz`). Nên bật khi public để bảo vệ API key AI và bộ nhớ học viên; không
đưa mật khẩu vào Git hoặc Docker image. Đặt HTTPS ở reverse proxy/tunnel phía
trước container.

## Model & giọng nói (theo ngôn ngữ)

OpenVox có model hỗ trợ tiếng khác nhau, nên app chọn model **theo ngôn ngữ**:

| Ngôn ngữ | Model mặc định | Giọng mặc định |
|---|---|---|
| English | `supertonic-3` (giọng tự nhiên, 44.1 kHz) | `F1` |
| 中文 | `kokoro` (có giọng tiếng Trung `zf_`/`zm_`) | `zf_xiaoxiao` |

Đổi qua env trong `.env`:
```
OPENVOX_EN_MODEL=supertonic-3
OPENVOX_ZH_MODEL=kokoro
OPENVOX_EN_VOICE=F1
OPENVOX_ZH_VOICE=zf_xiaoxiao
```
Nếu model không hỗ trợ ngôn ngữ (hoặc giọng yêu cầu thiếu), server tự tìm model/giọng hợp lệ thay thế.

## Audio sinh sẵn (pre-generation) & cache

Toàn bộ audio của **bài nghe/đọc** (thư viện câu mẫu, thẻ từ vựng, bài đọc graded, quiz nghe) được **sinh TRƯỚC và lưu vào `cache/audio/`**, nên khi người dùng bấm "nghe" là phát ngay từ đĩa, không chờ gen.

- **Control plane**: mở `/admin` và bấm **Đảm bảo đủ audio**. Job chạy tuần tự, chỉ tạo phần thiếu và cập nhật `cache/audio/manifest.json`.
- Khi OpenVox tạm dừng, job tự chuyển sang chế độ lập chỉ mục offline: chỉ kích hoạt WAV đã có, không chờ retry mạng và không tạo file mới.
- **Tự động có chủ đích**: chỉ chạy lúc khởi động khi đặt `PREGEN_ON_START=1` (mặc định tắt để request người học không phải gánh tác vụ nền).
- **Thủ công**: `npm run pregen` — quét toàn bộ nội dung (từ chính `public/app.js` + `public/learning.js` + `placement.mjs`), sinh tuần tự theo hợp đồng OpenVox (tôn trọng giới hạn 1 job/lần, retry 429) và lưu WAV.
- **Client prepared-only**: website/mobile gọi `/api/voice/prepared`. Endpoint chỉ đọc WAV đã có trong manifest; cache miss trả `AUDIO_NOT_PREPARED` và client dùng giọng thiết bị, không gọi OpenVox.
- **Pipeline nội bộ**: `/api/voice/speak` và streaming chỉ mở cho admin/loopback để phục vụ tạo cache phía server; giao diện người học không gọi các endpoint sinh audio này.
- **Tắt pregen lúc khởi động**: đặt `PREGEN_DISABLED=1`.
- **Cache tức thì**: `/api/voice/speak` kiểm tra cache theo hash `(ngôn ngữ | văn bản)`; lần đầu miss thì gọi OpenVox rồi lưu, lần sau `X-Audio-Cache: hit` phát ngay. Audio do LLM sinh động (phản hồi giáo viên, roleplay) vẫn tự động được cache sau lần đầu.
- Xoá cache: xoá thư mục `cache/` (nằm trong `.gitignore`).

## Trang quản trị

Mở `http://localhost:4175/admin` để vận hành toàn bộ content plane:

- theo dõi Node, OpenVox, AI provider, số WAV/manifest, catalog audio và bộ nhớ học viên;
- chạy audit schema/duplicate/CEFR cho kho English và 中文;
- tạo trước audio theo giọng/tốc độ đã chọn, một job tại một thời điểm;
- chuẩn bị thêm từ vựng theo batch và xem log/progress;
- lọc từ theo ngôn ngữ/CEFR, đánh dấu `reviewed` ngay trên dashboard.

Bảo vệ admin bằng credential riêng:

```env
ADMIN_ACCESS_USER=admin
ADMIN_ACCESS_PASSWORD=mat-khau-quan-tri-dai-ngau-nhien
```

Khi chưa đặt `ADMIN_ACCESS_PASSWORD`, `/admin` và `/api/admin/*` chỉ cho phép kết nối loopback (`localhost`). API không bao giờ trả khóa AI hay nội dung `.env`.

## Cấu hình giáo viên AI

```bash
cp .env.example .env
# điền DEEPSEEK_API_KEY (hoặc GEMINI_API_KEY / OPENAI_API_KEY) vào .env
```

Không có key: app vẫn chạy đủ (voice, từ vựng, SRS, viết-dictation/chunks, đọc, lộ trình); các phần cần LLM (sinh thẻ từ, chấm bài, roleplay, chat giáo viên) báo rõ "cần key AI".

## API

- `GET /healthz` · `GET /api/voice/status` · `POST /api/voice/prepared` — trạng thái và WAV đã tạo sẵn cho learner.
- `GET /api/admin/overview` · `/jobs` · `/vocab` — inventory và dữ liệu quản trị.
- `POST /api/admin/jobs/pregen` · `/audit` · `/vocab` · `/vocab/review` — pipeline quản trị có giới hạn.
- `GET /api/teacher/status` · `POST /api/teacher/chat` — giáo viên đồng hành (có ngữ cảnh + bộ nhớ học viên).
- `GET /api/memory` · `POST /api/memory` · `POST /api/memory/note` — trí nhớ dài hạn (mục tiêu, level, điểm yếu, tiến độ, lỗi, ghi chú) theo `learner`.
- `POST /api/placement/start` · `/submit` — test đầu vào deterministic (không gửi answer key xuống client).
- `POST /api/vocab/card` — AI tạo thẻ từ `{term, meaning, example, translation, pinyin?}`.
- `POST /api/writing/feedback` — cô giáo chấm bài viết `{praise, fix, corrected, why, retry}`.
- `POST /api/roleplay/turn` — lượt hội thoại roleplay `{reply, hint}`.
- `POST /api/roleplay/feedback` — nhận xét cuối cuộc gọi thoại `{praise, topFix, corrected, next}`.

Proxy OpenVox tuân hợp đồng: khám phá model → warm → languages → voices → `/audio/speech` (`response_format=wav`); retry khi 429; giọng thiếu thì fetch lại chọn thay thế; OpenVox mất thì 503 → frontend fallback giọng trình duyệt.

## Kiểm thử

```bash
npm run check   # syntax tất cả module + frontend
npm test        # 19 integration tests (mock OpenVox + mock DeepSeek)
npm run pregen  # sinh sẵn toàn bộ audio bài nghe/đọc vào cache
```

## Trí nhớ dài hạn của giáo viên

Cô giáo AI ghi nhớ học viên qua `data/learner-memory.json` (gitignored):

- **Lưu**: hồ sơ mục tiêu, placement level + điểm yếu, tiến độ SRS (đã học / cần ôn / lỗi), từ đã học, lỗi sai, ghi chú.
- **Đồng bộ tự động**: frontend gửi lên sau khi lưu hồ sơ, nộp placement, học từ, ghi lỗi.
- **Sử dụng**: mọi `/api/teacher/chat` tự nạp bộ nhớ vào prompt; cô giáo được chỉ thị luôn bám mục tiêu và hướng tới **dùng, nói, nghe** thông thạo, nhắc điểm yếu và lỗi lặp lại.
- **UI**: tab **Mục tiêu** hiển thị "Bộ nhớ cô giáo", cho thêm ghi chú, nút đồng bộ.
- Muốn reset: xoá `data/learner-memory.json` rồi khởi động lại server.

## Cấu trúc

```
lingovoice/
  server.mjs            # Node server: static + API học tập + memory + control-plane routes
  admin.mjs             # Control plane: inventory, job queue, audit, vocab review
  ai.mjs                # Adapter LLM giáo viên (DeepSeek/Gemini/OpenAI) + structured JSON
  voice.mjs             # VoiceClient OpenVox + cache audio trên đĩa + speakWithCache
  placement.mjs         # Ngân hàng câu + scoring deterministic
  memory.mjs            # Trí nhớ dài hạn của giáo viên (store server-side + prompt builder)
  pregen.mjs            # Sinh trước toàn bộ audio (thư viện câu, thẻ từ, bài đọc, quiz)
  cache/audio/          # WAV đã sinh (gitignored)
  design-system/        # Quy chuẩn giao diện admin
  data/                 # learner-memory.json (gitignored)
  public/
    admin/              # Dashboard quản trị responsive
    index.html          # Giao diện 7 màn hình (Hôm nay, Mục tiêu, Từ mới, Viết, Nói, Đọc, Nghe)
    styles.css          # Design system (indigo + green, Plus Jakarta Sans)
    app.js              # Core: playback, quiz, giáo viên đồng hành
    learning.js         # P0–P4 + memory: SRS, planner, placement, từ mới, viết, nói, đọc
  test/server.test.mjs  # Integration tests (19)
```
