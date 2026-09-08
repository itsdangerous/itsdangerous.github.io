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
# 로컬 디자인 미리보기

repository 루트에서 다음을 실행합니다.

```bash
cd admin
npm install
npm run dev
```

터미널에 표시되는 로컬 주소를 엽니다. 로그인과 Cloudflare/Google 설정 없이 샘플 통계, 글 목록, 새 글 및 편집 화면을 사용할 수 있습니다. 저장·발행 동작은 메모리의 샘플 데이터에만 반영되며 새로고침하면 초기화됩니다. 로그아웃 후에도 미리보기로 다시 진입합니다.

개발환경과 배포환경은 `src/main.ts`와 `src/styles.css`를 공유합니다. 이후 디자인 문서에 따른 수정도 이 공통 UI에 적용합니다. `npm run dev`에서만 샘플 API를 사용하고, `npm run build` 및 배포에서는 실제 API를 사용하며 샘플 모듈은 번들에서 제외됩니다. `vite preview`는 운영 빌드 확인용이므로 샘플 모드가 아닙니다.
