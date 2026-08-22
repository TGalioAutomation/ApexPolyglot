# LingoPilot

Webapp học tiếng Anh và tiếng Trung trong lộ trình 90 ngày, tập trung vào nghe, đọc và nói. App chạy bằng Node server nhỏ, có test đầu vào/checkpoint, AI Coach endpoint an toàn và deterministic fallback để demo không cần key.

Practice có mô-đun học từ mới theo active recall/SRS-lite và ngữ pháp theo mẫu câu + retry cho cả English và `zh-CN`. Các từ đã nhớ, từ cần ôn và mẫu ngữ pháp đã đạt được lưu local trên thiết bị.

Tài liệu sản phẩm:

- [Production documentation index](docs/README.md)
- [Design goal](docs/design-goal.md)
- [Full product design](docs/full-product-design.md)
- [Product requirements](docs/product-requirements.md)
- [UX & design system](docs/ux-design-system.md)
- [Learning & AI specification](docs/learning-ai-spec.md)
- [Technical architecture](docs/technical-architecture.md)
- [OpenAPI contract](docs/openapi.yaml)
- [Security, privacy, SRE & QA](docs/production-operations.md)
- [Delivery & governance](docs/delivery-governance.md)
- [Traceability matrix](docs/traceability-matrix.md)

## Chạy local

```bash
npm start
```

Mở http://localhost:4173. Curriculum 90 ngày nằm trong [curriculum.json](./curriculum.json), gồm nhịp học 35 phút/ngày và checkpoint theo 3 chặng.

Chạy kiểm thử:

```bash
npm test
```

Nếu OpenVox AI đang mở trên máy, chạy thêm test kết nối audio thật:

```bash
npm run test:openvox
```

## Cấu hình AI

```bash
cp .env.example .env
# điền một trong GEMINI_API_KEY / DEEPSEEK_API_KEY / OPENAI_API_KEY
# có thể đặt AI_PROVIDER=gemini, deepseek, openai hoặc auto
# tuyệt đối không commit file .env
```

`AI_PROVIDER=auto` ưu tiên Gemini → DeepSeek → OpenAI theo key đang có và fallback sang provider tiếp theo nếu request lỗi. Client chỉ gọi backend; `/api/ai/status` chỉ trả trạng thái/tên provider, không trả key. Model mặc định nằm trong `.env.example` và có thể đổi mà không sửa code.

Kiểm tra cấu hình không làm lộ secret:

```bash
curl http://127.0.0.1:4173/api/ai/status
```

## Kiểm tra đầu vào và theo giai đoạn

- Placement riêng cho English và Chinese đo nghe, đọc và nói trong 5–8 phút.
- Checkpoint theo giai đoạn dùng cùng scoring engine trong prototype; production dùng đề/rubric version hóa.
- Điểm được tính deterministic phía server. Gemini/DeepSeek chỉ phân tích điểm yếu và tạo tối đa ba yêu cầu học có thời lượng, tiêu chí hoàn thành.
- Nếu AI unavailable, app vẫn trả kế hoạch học an toàn ở demo mode.
- Điểm nói từ transcript trong prototype chỉ là sơ bộ; phát âm tiếng Anh và thanh điệu tiếng Trung cần audio analyzer ở V1.

## Kết nối OpenVox local

Mở OpenVox AI và tải model/voice trước. App dùng local API mặc định `http://127.0.0.1:8000/v1`, tự khám phá model, warm model, chọn language/voice rồi gọi `/audio/speech`. Khi chạy bằng Docker trên macOS, Compose dùng `host.docker.internal` để gọi OpenVox trên máy host. Nút **Nghe mẫu** trong practice room sẽ ưu tiên OpenVox và fallback về Speech Synthesis nếu OpenVox chưa chạy.

Kiểm tra kết nối:

```bash
curl http://127.0.0.1:4173/api/voice/status
```

## Deploy VPS nhanh bằng Docker

```bash
docker build -t lingopilot .
docker run -d --name lingopilot --env-file .env -p 4173:4173 --restart unless-stopped lingopilot
```

Hoặc dùng Compose để mở cổng 80:

```bash
docker compose up -d --build
curl http://127.0.0.1/healthz
```

Có thể upload và chạy trên VPS bằng script (không tự truyền secret):

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh user@your-vps /opt/lingopilot
ssh user@your-vps 'cd /opt/lingopilot && nano .env && docker compose up -d'
```

Sau khi chạy, kiểm tra container và endpoint:

```bash
ssh user@your-vps 'docker compose -f /opt/lingopilot/docker-compose.yml ps && curl -fsS http://127.0.0.1/healthz'
```

Container chạy bằng user không phải root và có healthcheck tự động. HTTPS nên đặt sau reverse proxy/Caddy hoặc Nginx khi đã có domain.

## Kiến trúc AI đề xuất

- Backend `/api/coach` giữ API key Gemini/DeepSeek/OpenAI ở server, gửi system prompt theo ngôn ngữ/mục tiêu/ngày học và trả feedback.
- Backend `/api/lesson` tạo micro-lesson 10 phút; khi chưa có key, endpoint trả bài mẫu để app vẫn chạy được.
- Backend `/api/assessment/start` không gửi answer key; `/api/assessment/submit` tính điểm rubric rồi nhờ AI tạo yêu cầu học thích ứng.
- Browser dùng Speech Synthesis để nghe mẫu, Speech Recognition để ghi nhận câu nói khi trình duyệt hỗ trợ.
- Dashboard tính ngày học, chuỗi phiên và số giờ từ `localStorage`; Level đã xác minh luôn hiển thị “chưa đủ bằng chứng” cho tới khi có evidence từ assessment policy.
- Giai đoạn tiếp theo: Postgres cho hồ sơ và tiến độ, object storage cho audio, chấm phát âm chuyên sâu và tài khoản người dùng.

## Lộ trình sản phẩm

1. MVP hiện tại: dashboard, streak, lộ trình 90 ngày, practice room nghe/đọc/nói, AI Coach và AI micro-lesson.
2. V1: tài khoản, lưu tiến độ, bài học sinh bởi AI, audio thật và chấm phát âm.
3. V2: spaced repetition, hội thoại voice realtime, analytics và nhắc học cá nhân.
