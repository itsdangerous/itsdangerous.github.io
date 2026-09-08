# 관리자 CMS 기반

이 디렉터리는 `docs/superpowers/plans/2026-09-08-admin-cms.md`의 관리자 UI와 Cloudflare Worker 기반입니다.

현재 구현된 범위는 다음과 같습니다.

- 관리자 UI의 통계·글 목록·글 편집 화면과 API 계약
- Markdown 글 입력과 미리보기 화면
- D1 초기 스키마: posts, operations, sessions, oauth_states, analytics_cache
- Worker 라우팅·GitHub OAuth/PKCE·세션/CSRF·D1 글 CRUD·GitHub App 발행·GA4/Search Console 조회 기반
- `/admin/` 정적 파일 제공
- 공개 Astro의 `/admin` 진입점과 `/publication-manifest.json`

외부 계정이 필요한 기능은 운영 설정과 통합 검증이 남아 있습니다. Pages workflow 완료 확인을 포함한 발행 재조정, 예약 cron의 실제 D1 작업 처리, 통계 캐시, 관리자 E2E는 후속 검증 대상입니다. 설정이 없을 때 Worker는 `503 ADMIN_NOT_CONFIGURED`를 반환하며, 가짜 로그인이나 fixture 통계를 제공하지 않습니다.

## 로컬 확인

```bash
npm install
npm run build
npx tsc --noEmit
```

Wrangler 배포 전 `wrangler.jsonc`의 D1 ID를 생성한 데이터베이스로 바꾸고, GitHub OAuth/App, Google 서비스 계정, GA4 property, Search Console property를 Worker secrets/vars로 설정해야 합니다. 비밀값은 이 저장소나 `PUBLIC_*` 변수에 넣지 않습니다.
