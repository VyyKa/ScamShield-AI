# ScamShield — PostgreSQL / Prisma schema

## Sơ đồ quan hệ (core blacklist)

```
User ──┬── Report ──► ScamRecord ◄── Vote
       │                  ▲
       └── ModerationEvent┘
```

| Model | Vai trò |
|-------|---------|
| **User** | Tài khoản + role + reputation |
| **ScamRecord** | 1 entity blacklist (dedupe theo `category` + `targetNormalized`) |
| **Report** | Mỗi lần tố cáo (bằng chứng, status PENDING/…) |
| **Vote** | CONFIRM / DISPUTE / UPVOTE (unique user+entity+type) |
| **ModerationEvent** | Audit trail mod (VERIFY, ARCHIVE, …) |

## Trạng thái entity (`ScamRecord.status`)

| Status | Ý nghĩa |
|--------|---------|
| `UNDER_REVIEW` | Mới / chưa đủ tín hiệu |
| `VERIFIED` | Đã xác nhận (mod hoặc rule auto) |
| `DISPUTED` | Cộng đồng phản đối nhiều |
| `ARCHIVED` | Ẩn / hết hạn / sai |

## Scoring (`src/lib/scoring.ts`)

- `confidenceScore` 0–100 từ report / confirm / dispute / external hit / status
- `riskLevel`: CRITICAL | HIGH | MEDIUM | LOW
- Normalize target: `src/lib/normalize.ts`

## Dedupe

```
unique(category, targetNormalized)
```

Ví dụ:

- STK `1903 888` → `1903888`
- SĐT `0901234567` → `84901234567`
- web `https://WWW.Evil.com/x` → `evil.com`

## Ops models

- **ScanLog** — lịch sử quét + intel snapshot  
- **TrollSession** — từng lượt troll  
- **HoneyToken / TrapLog** — canary + hit geo  
- **SystemLog** — audit hệ thống  

## Chạy local

```bash
docker compose up -d
# .env
# DATABASE_URL="postgresql://scamshield:scamshield@localhost:5432/scamshield?schema=public"

npx prisma db push
npm run db:seed
```

## Migration production

```bash
npx prisma migrate dev --name init_community_schema
npx prisma migrate deploy   # production
```

## API mapping (Phase 1)

| Endpoint | Ghi |
|----------|-----|
| `POST /api/database` | Tạo/cập nhật `ScamRecord` + 1 `Report` |
| `GET /api/database` | List entity (filter status/category) |
| `POST /api/database/vote` *(sẽ thêm)* | Vote + recompute score |
| `POST /api/moderation/*` *(sẽ thêm)* | VERIFY / ARCHIVE + `ModerationEvent` |
