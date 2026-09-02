# itsdangerous.github.io

Astro 정적 기술 블로그입니다. 기본 테마는 어두운 `midnight`이며, 게시물은 `src/content/posts/{category}/{slug}.md`의 Markdown으로 관리합니다.

## 로컬 개발

커밋된 lockfile과 동일한 의존성을 설치한 뒤 개발 서버를 실행합니다.

```bash
npm ci
npm run dev
```

프로덕션 빌드는 Astro 정적 사이트, RSS, sitemap, Pagefind 검색 색인을 모두 `dist/`에 생성합니다.

```bash
npm run build
```

검증 명령은 다음과 같습니다.

```bash
npm test -- --run
npm run test:e2e
```

## Tistory 마이그레이션 확인

원본 URL, Markdown 경로, 로컬 이미지 경로의 현황은 `src/content/tistory-migration-manifest.json`에 관리합니다. 현재 원본 URL 30건 중 검증된 공개 글 29건을 게시하며, 보호 글 `https://0418.tistory.com/14`는 소유자가 공개로 전환할 때까지 제외합니다. 이미지 경로와 누락 파일을 확인하려면 아래 보고서를 실행합니다.

```bash
node scripts/migration-report.mjs
```

출력의 `missingAssets`, `duplicateSlugs`, `duplicateSourceUrls`, `unmigratedSources`가 의도한 상태인지 검토한 후 게시합니다.

## Giscus와 GA4 설정

다음 값은 브라우저에 공개되는 배포 설정이므로 GitHub repository variables에 등록합니다. 소스 코드나 GitHub Secrets에 넣지 않습니다.

| Variable | 용도 |
| --- | --- |
| `PUBLIC_GA_MEASUREMENT_ID` | GA4 Measurement ID. 비워 두면 분석 스크립트를 로드하지 않습니다. |
| `PUBLIC_GISCUS_REPO` | Giscus를 연결한 `owner/repository`입니다. |
| `PUBLIC_GISCUS_REPO_ID` | Giscus 설정 화면에서 받은 repository ID입니다. |
| `PUBLIC_GISCUS_COMMENTS_CATEGORY` | 게시물 댓글에 사용할 GitHub Discussions category 이름입니다. |
| `PUBLIC_GISCUS_COMMENTS_CATEGORY_ID` | 게시물 댓글 category의 Giscus ID입니다. |
| `PUBLIC_GISCUS_GUESTBOOK_CATEGORY` | 방명록에 사용할 GitHub Discussions category 이름입니다. |
| `PUBLIC_GISCUS_GUESTBOOK_CATEGORY_ID` | 방명록 category의 Giscus ID입니다. |
| `PUBLIC_GUESTBOOK_DISCUSSION_NUMBER` | 방명록에 고정할 양의 GitHub Discussion 번호입니다. |

Giscus 앱을 repository에 설치하고 Discussions를 활성화한 후, Giscus 설정 화면에서 repository/category ID를 복사합니다. 게시물 댓글은 `Comments` category의 URL별 Discussion을 쓰고, 방명록은 `Guestbook` category의 고정 Discussion 번호를 씁니다. 값이 없거나 유효하지 않으면 댓글 영역은 안전한 안내문만 표시됩니다.

## GitHub Pages 배포와 확인

`.github/workflows/deploy.yml`은 `main` push 또는 수동 실행에서 `npm ci`, `npm run build`, Pages artifact 업로드, GitHub Pages 배포를 순서대로 수행합니다. Build 단계는 repository variables를 `PUBLIC_*` 환경 변수로 전달하며, deploy job에만 `pages: write`와 `id-token: write` 권한을 부여합니다.

GitHub repository의 **Settings → Pages**에서 source를 **GitHub Actions**로 설정합니다. 배포 후 `https://itsdangerous.github.io/`에서 다음을 확인합니다.

- `https://itsdangerous.github.io/rss.xml`과 `https://itsdangerous.github.io/sitemap-index.xml`이 열리는지
- `/robots.txt`, `/favicon.svg`, `pagefind/`가 빌드 산출물에 포함되는지
- 데스크톱/모바일 레이아웃, 테마 저장, 검색 결과 이동, TOC, 댓글 컨테이너와 방명록 경로가 정상인지
- Giscus의 실제 GitHub 로그인/댓글 작성은 배포된 사이트에서 한 번 수동으로 확인하는지
