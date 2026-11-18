# 🚀 멀티-PC 개발 및 배포 세팅 가이드 (GitHub + Vercel + Turso + MCP)

어느 PC에서든 이 프로젝트를 클론해 바로 개발·배포할 수 있도록 구성한 가이드입니다.

---

## 1. 사전 준비 (새 PC에서 1회)
1. **Node.js LTS** 설치 (`node`, `npx`, `npm` 포함)
2. **Git** 설치 후 저장소 클론:
   ```bash
   git clone https://github.com/Choi-Byunggeun/amway-platform.git
   cd amway-platform
   npm install
   ```

---

## 2. Turso DB 연결 (`.env.local`)
1. `.env.example`을 복사해 `.env.local` 파일을 만듭니다 (`.env.local`은 `.gitignore`에 포함되어 Git에 올라가지 않습니다).
2. Turso 대시보드 또는 CLI에서 DB URL과 Auth Token을 발급받아 입력합니다:
   ```env
   TURSO_DATABASE_URL=libsql://<db-name>-<org>.turso.io
   TURSO_AUTH_TOKEN=<your-turso-auth-token>
   ```
3. **Vercel 대시보드 > Project Settings > Environment Variables**에도 동일한 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`을 등록합니다.
   - 첫 API 요청(`/api/bootstrap`) 시 `partners`, `app_settings`, `monthly_schedules` 테이블과 기본 계정이 자동 생성됩니다.

---

## 3. Antigravity MCP 연결 (`mcp_config.json`)
각 PC의 Antigravity 글로벌 MCP 설정 파일(`~/.gemini/config/mcp_config.json`, Windows는 `C:\Users\<사용자명>\.gemini\config\mcp_config.json`)에 아래 내용을 넣고 토큰만 채워주세요:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PAT"
      }
    },
    "vercel": {
      "url": "https://mcp.vercel.com"
    },
    "turso": {
      "command": "npx",
      "args": ["-y", "mcp-turso-cloud"],
      "env": {
        "TURSO_API_TOKEN": "YOUR_TURSO_API_TOKEN",
        "TURSO_ORGANIZATION": "YOUR_TURSO_ORG_SLUG"
      }
    }
  }
}
```
- **Vercel**은 Antigravity Marketplace의 공식 **Vercel 플러그인**을 추가해서 바로 OAuth 로그인으로 사용할 수도 있습니다.

---

## 4. 로컬 실행 및 배포
```bash
# Vercel 로컬 개발 서버 실행 (프론트엔드 + /api/* 동시 실행)
npx vercel dev

# 프로덕션 배포 (또는 GitHub main 브랜치 푸시 시 Vercel 자동 배포)
npx vercel --prod
```
