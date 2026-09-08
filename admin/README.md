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

admin 디렉터리에서 `make help`로 전체 명령을 볼 수 있습니다. 최초 설치와 배포 빌드는 루트의 공유 Markdown 의존성도 필요하므로 `make install`이 루트와 admin 양쪽을 설치합니다.

```bash
cd admin
make help
make install
make check
```

개발 서버는 다음처럼 실행합니다.

```bash
make dev
```

Wrangler 배포는 빌드까지 자동으로 수행합니다. 로컬에서는 먼저 `npx wrangler login`으로 로그인하거나, CI에서는 `CLOUDFLARE_API_TOKEN`을 설정한 뒤 실행하세요.

```bash
npx wrangler login
make deploy
```

CI/API 토큰 방식은 다음과 같습니다.

```bash
export CLOUDFLARE_API_TOKEN='your-token'
make deploy
```

배포 전 `wrangler.jsonc`의 D1 ID를 생성한 데이터베이스로 바꾸고, GitHub OAuth/App, Google 서비스 계정, GA4 property, Search Console property를 Worker secrets/vars로 설정해야 합니다. 비밀값은 이 저장소나 `PUBLIC_*` 변수에 넣지 않습니다.

`wrangler.jsonc`에는 `keep_vars: true`가 설정되어 있어 Cloudflare Dashboard에서 등록한 일반 Variables를 Wrangler 배포가 덮어쓰지 않도록 했습니다. Variables를 코드로 관리하려면 Dashboard 설정을 `vars`에 옮겨 저장소를 단일 기준으로 사용해야 합니다.
# 로컬 디자인 미리보기

공개 사이트와 동일한 개발 서버를 사용하려면 저장소 루트에서 `npm run dev` 실행 후 `http://localhost:4321/admin/`을 엽니다. Markdown 렌더러를 공유하므로 저장소 루트의 의존성도 설치되어 있어야 합니다.

repository 루트에서 다음을 실행합니다.

```bash
cd admin
npm install
npm run dev
```

터미널에 표시되는 로컬 주소를 엽니다. 로그인과 Cloudflare/Google 설정 없이 샘플 통계, 글 목록, 새 글 및 편집 화면을 사용할 수 있습니다. 저장·발행 동작은 메모리의 샘플 데이터에만 반영되며 새로고침하면 초기화됩니다. 로그아웃 후에도 미리보기로 다시 진입합니다.

개발환경과 배포환경은 `src/main.ts`와 `src/styles.css`를 공유합니다. 이후 디자인 문서에 따른 수정도 이 공통 UI에 적용합니다. `npm run dev`에서만 샘플 API를 사용하고, `npm run build` 및 배포에서는 실제 API를 사용하며 샘플 모듈은 번들에서 제외됩니다. `vite preview`는 운영 빌드 확인용이므로 샘플 모드가 아닙니다.

## 통계와 편집 기능

- 최근 기간은 브라우저의 현재 날짜 기준입니다. 화면이 보이는 동안 5분마다 조회하고, 직접 선택한 기간은 고정합니다. 입력·달력 조작 중에는 자동 조회를 미룹니다.
- 그래프에서 페이지뷰·방문자·세션을 선택할 수 있습니다. 마우스/터치 또는 좌우 방향키로 상세 값을 확인합니다. 빈 날짜는 0이 아니라 응답 데이터가 없는 구간입니다.
- GA4의 처리 지연은 자동 조회와 별개입니다. 마지막 조회 시각이 바뀌어도 최신 방문이 바로 표시되지는 않을 수 있습니다.
- 저장소에 한 번도 기록되지 않은 초안은 확인 후 삭제합니다. 복구할 수 없으므로 필요한 본문은 먼저 복사합니다.
- 저장소 원본이 있는 글은 **수정 초안 버리기**로 원본을 다시 불러옵니다. 공개 글이나 저장소 파일은 삭제하지 않습니다. 원본 조회 실패 시 작업본을 보존합니다.
- 본문 미리보기는 Markdown 제목·표·인용문·코드 강조를 지원합니다. 좁은 화면은 편집/미리보기 탭으로 전환합니다. 본문 상대 이미지 경로는 관리자 도메인에서 접근 가능해야 합니다.

저장소 루트에서 `npx playwright test --config playwright.admin.config.ts`로 Chrome 기반 관리자 UI 테스트를 실행합니다. 테스트는 로컬 샘플 API만 사용하며 운영 글은 변경하지 않습니다.
