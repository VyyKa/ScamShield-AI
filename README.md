# ScamShield AI · VietGuard

Ứng dụng web chống lừa đảo cho người Việt: giám định bill/tin nhắn (Gemini + URLhaus), auto-troll scammer, honey-token canary, kho blacklist cộng đồng.

## Tính năng

| Module | Mô tả | Nguồn online |
|--------|--------|--------------|
| **Quét & xác minh** | Ảnh + text forensics | Google Gemini, URLhaus, dns.google |
| **Auto-Troll** | Persona câu giờ scammer | Gemini |
| **Honey / Deepfake** | Canary URL + thử thách video call | ip-api.com, Gemini |
| **Kho cảnh báo** | Tra STK/SĐT/domain, tố giác | SQLite + URLhaus khi là domain |
| **API Hub** | Thử REST endpoints | `/api/lookup` gộp intel |

## Stack

- Next.js 14 (App Router) · React 18 · TypeScript · Tailwind
- **Prisma + PostgreSQL** (community blacklist: Report / Vote / Moderation)
- Google Generative AI (`@google/generative-ai`)

Chi tiết schema: [`prisma/SCHEMA.md`](./prisma/SCHEMA.md)

## Chạy local

```bash
# 1. Postgres
docker compose up -d

# 2. Env
cp .env.example .env
# DATABASE_URL=postgresql://scamshield:scamshield@localhost:5432/scamshield?schema=public

# 3. Schema + seed
npm install
npx prisma db push
npm run db:seed

# 4. App
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Seed users (demo):

| Email | Role |
|-------|------|
| `admin@scamshield.local` | ADMIN |
| `mod@scamshield.local` | MODERATOR |
| `user@scamshield.local` | USER |

Lấy `user.id` từ DB để test `POST /api/database/vote` và `POST /api/moderation`.

### API keys (tuỳ chọn)

| Biến | Nguồn free | Bắt buộc? |
|------|------------|-----------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Không — fallback heuristic |
| `URLHAUS_AUTH_KEY` | [auth.abuse.ch](https://auth.abuse.ch/) | Không — DNS + urlscan vẫn chạy |
| `GOOGLE_SAFE_BROWSING_API_KEY` | [Safe Browsing](https://developers.google.com/safe-browsing/v4/get-started) | Không |

Hoặc dán Gemini key trên web (icon chìa khóa trên header → localStorage).

**Theme:** icon mặt trời/trăng trên header (dark / light, lưu localStorage).

## Scripts

| Lệnh | Việc |
|------|------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run db:setup` | `db push` + seed |
| `npm run db:seed` | Seed blacklist mẫu |

## API chính

- `POST /api/scan` — forensics
- `POST /api/troll` — auto-troll
- `POST /api/honeygen` — token / deepfake
- `GET /api/trap/:token` — canary hit (HTML hoặc JSON)
- `GET|POST /api/database` — blacklist
- `GET /api/lookup?q=` — URLhaus + DNS + (optional) IP
- `GET /api/system/status` — health

## Docker / Cloud Run

Dockerfile multi-stage, `output: 'standalone'`, port `8080`.

```bash
docker build -t scamshield-ai .
docker run -p 8080:8080 -e GEMINI_API_KEY=... scamshield-ai
```

## Lưu ý

- SQLite file: `prisma/dev.db` (local). Production nên chuyển Postgres nếu scale.
- Honey-trap ghi IP từ header proxy + geo ip-api.com (rate limit public).
- Đây là công cụ hỗ trợ cộng đồng — không thay thế cơ quan chức năng (hotline 111 / 156).
