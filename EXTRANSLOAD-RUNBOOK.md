# Extransload 이전 — 직접 완료할 계정 설정

작성일: 2026-09-10. 표시명은 **Extransload**, 주소와 내부 이름은 **extransload**입니다.

이 문서는 기존 GitHub 계정의 사용자명을 변경하는 경로입니다. 새 계정을 만들어 저장소를 옮기는 절차가 아닙니다. 새 계정을 쓰면 관리자 숫자 ID와 GitHub App 설치 ID도 달라지므로 아래 기존 번호를 그대로 사용하면 안 됩니다.

## 1. 이미 처리한 부분과 남은 부분

| 항목 | 현재 상태 |
|---|---|
| 사이트 제목·SEO·RSS·sitemap·robots·본문의 본인 링크 | 로컬 코드 변경 완료 |
| 홈페이지·사이드바 타이틀 이미지 | 금색 자수 `Extransload` 이미지 교체 완료. 남색 배경을 가진 이미지이며 투명 PNG가 아님 |
| 관리자 표시명·API 기본 주소·CORS·브라우저 저장소 키 | 로컬 코드 변경 완료 |
| Git remote | 새 저장소 주소로 변경 완료. GitHub 실제 이름 변경 전에는 push하지 않기 |
| 새 D1 | `extransload-admin` 생성, 기존 5개 migration 적용 완료 |
| 새 D1 ID | `aac506ff-8c9d-4ece-b775-2a24123493a4` — 설정에 반영 완료 |
| 새 Worker | `https://extransload-admin.tmdrbsla123.workers.dev` 배포 완료 |
| 댓글 비밀키 | 새 Worker에 `COMMENTS_SECRET` 생성·등록 완료 |
| Worker 관리자 페이지 / 댓글 목록 읽기 | HTTP 200 / 빈 목록 응답 확인 |
| GitHub 사용자명·저장소명 | 직접 변경 필요 |
| OAuth callback·로그인/발행/Google 비밀키 | 직접 설정 필요. 새 Worker에 자동 복사되지 않음 |
| GA4·Search Console·GitHub Actions Variables | 직접 설정 필요 |
| 새 주소의 공개 사이트 배포 | 아래 계정 설정 후 실행 필요 |

기존 Worker와 D1은 삭제하지 않았습니다. 새 D1은 빈 데이터로 시작하며 원격 DB의 기존 기록을 복사하지 않았습니다. 관리자 페이지가 열린다는 사실만으로 로그인·글 발행·통계 연결이 끝난 것은 아닙니다.

현재 로컬 폴더 이름은 `itsdangerous.github.io`입니다. 개발 서버를 유지하기 위해 폴더는 그대로 두었습니다. 폴더명은 공개 주소에 영향을 주지 않습니다. 아래 터미널 명령은 이 실제 경로를 사용합니다.

## 2. GitHub 사용자명과 저장소명 변경

예상 영향: 사용자명을 바꾸면 이 블로그뿐 아니라 본인 GitHub 프로필과 다른 저장소의 소유자 주소도 바뀝니다. 원하는 사용자명이 사용 가능해야 합니다. 이름이 이미 사용 중이라면 여기서 멈추고 다른 소유자 경로를 결정해야 합니다. 저장소명만 바꿔서는 `extransload.github.io`가 되지 않습니다. [GitHub 사용자 사이트 규칙](https://docs.github.com/en/pages/quickstart)

1. GitHub에 현재 블로그 소유자 계정으로 로그인합니다.
2. 오른쪽 위 프로필 사진 → **Settings → Account → Change username**으로 이동합니다.
3. 새 사용자명에 `extransload`를 입력합니다. GitHub가 보여주는 영향 안내를 읽고 비밀번호/2단계 인증 확인을 완료합니다.
4. `https://github.com/extransload`에서 본인의 기존 저장소들이 보이는지 확인합니다. 동일 계정의 이름 변경이어야 합니다.
5. 기존 블로그 저장소를 엽니다. 이 시점에는 이름이 아직 `itsdangerous.github.io`일 수 있습니다.
6. 저장소 **Settings → General → Repository name**을 `extransload.github.io`로 바꾸고 **Rename**을 누릅니다.
7. 브라우저에서 `https://github.com/extransload/extransload.github.io`가 본인 저장소로 열리는지 확인합니다.
8. 저장소 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다. 이 사이트는 Astro이므로 Jekyll 설정 파일이나 CNAME을 만들 필요가 없습니다.

완료 확인: 아래 명령이 새 저장소의 main 커밋을 출력해야 합니다. 실패하면 GitHub 이름 변경 또는 터미널 Git 인증을 먼저 확인합니다.

```bash
cd /Users/gyu/Documents/projects/itsdangerous.github.io
git remote -v
git ls-remote origin refs/heads/main
```

GitHub 저장소의 자동 redirect와 웹사이트의 이전 URL 처리는 별개입니다. 기존 블로그 URL의 자동 이전을 보장하지 않습니다. 검색 결과·프로필·외부 공유 링크도 새 URL로 갱신해야 합니다. 사용자명을 되돌릴 수 있다고 전제하지 마세요. [GitHub 사용자명 변경 영향](https://docs.github.com/en/enterprise-cloud%40latest/account-and-profile/concepts/username-changes)

## 3. 로그인용 OAuth App 수정

1. GitHub **Settings → Developer settings → OAuth Apps**에서 현재 관리자 로그인 앱을 엽니다.
2. 기존 앱을 유지하고 아래 표시명과 URL만 수정합니다.

| 입력란 | 입력값 |
|---|---|
| Application name | `Extransload admin` |
| Homepage URL | `https://extransload-admin.tmdrbsla123.workers.dev/admin/` |
| Authorization callback URL | `https://extransload-admin.tmdrbsla123.workers.dev/auth/callback` |

3. **Update application**을 누릅니다. callback에 `/admin/`을 추가하면 안 됩니다.
4. 같은 화면의 **Client ID**를 확인합니다. 기존 앱을 유지했다면 `admin/wrangler.jsonc`의 `GITHUB_CLIENT_ID`와 같아야 합니다.
5. 기존 Client Secret을 안전하게 보관 중이면 그것을 사용합니다. 없다면 새 Client Secret을 생성합니다. 값을 채팅·문서·Git에 붙이지 마세요.
6. Cloudflare **Workers & Pages → extransload-admin → Settings → Variables and Secrets → Add**에서 유형을 **Secret/Encrypt**로 선택하고 `GITHUB_CLIENT_SECRET`에 등록합니다.

OAuth App은 로그인용입니다. 다음 절의 GitHub App과 ID·비밀키를 섞지 마세요. 기존 앱을 새로 만들지 않으면 코드의 Client ID도 바꿀 필요가 없습니다.

## 4. 글 발행용 GitHub App 연결

1. GitHub **Settings → Developer settings → GitHub Apps**에서 기존 글 발행 앱을 엽니다.
2. App의 표시명을 가능한 범위에서 `Extransload admin`으로 변경하고 Homepage URL을 새 Worker 주소로 갱신합니다. 앱 이름이 전역에서 중복된다면 `Extransload blog publisher`처럼 구별되는 이름을 사용해도 코드 동작에는 영향이 없습니다.
3. **Permissions & events → Repository permissions**에서 **Contents: Read and write**, **Actions: Read-only**를 확인합니다. Webhook은 기존처럼 비활성화합니다.
4. **Install App**, 또는 **Settings → Applications → Installed GitHub Apps → Configure**에서 `extransload.github.io` 저장소가 선택되어 있는지 확인하고 저장합니다. 권한 변경 승인 화면이 나오면 승인합니다.
5. 설정 화면의 App ID와 설치 화면 URL 마지막 숫자를 확인합니다. 현재 코드의 기준은 App ID `4870716`, Installation ID `160010465`입니다. 이름 변경만 했다면 번호를 임의로 바꾸지 마세요. 재설치해서 번호가 달라졌다면 `admin/wrangler.jsonc`의 해당 값도 실제 번호로 바꿉니다.
6. 기존 App private key의 PEM 파일을 가지고 있으면 사용합니다. 없다면 **Private keys → Generate a private key**로 새 키를 다운로드합니다.
7. 새 Worker의 Secret `GITHUB_PRIVATE_KEY`에 PEM 전체 내용을 등록합니다. `BEGIN ... PRIVATE KEY`와 `END ... PRIVATE KEY` 줄을 포함하고 JSON이나 추가 따옴표는 넣지 않습니다.

관리자 허용 ID `76903093`은 사용자명이 아닌 계정 고유 번호입니다. `https://api.github.com/users/extransload`의 `id`와 같아야 합니다. 다르면 새 계정으로 진행한 것이므로 허용 ID와 앱 설치를 다시 확인하세요.

## 5. Google 통계 연결

**다시 시작하는 위치: 아래 5-2부터 진행합니다.** GCP는 새 프로젝트 `MyBlog`와 새 서비스 계정으로 처음부터 설정합니다. 이미 완료한 GitHub·Cloudflare 설정과 5-1의 GA4 설정은 반복하지 않습니다. GA4 속성과 웹 스트림은 기존 것을 유지하므로 통계 기록과 Measurement ID도 유지됩니다.

### 5-1. GA4의 표시명과 사이트 주소

1. [Google Analytics](https://analytics.google.com/) → 왼쪽 아래 **Admin**을 엽니다.
2. 기존 블로그 속성을 선택합니다. 현재 Worker는 숫자 Property ID `552453352`를 사용합니다.
3. **Property details**에서 이름을 `Extransload`로 저장합니다.
4. **Data collection and modification → Data streams**에서 기존 Web stream을 선택합니다.
5. Stream details의 연필 아이콘을 눌러 Stream name을 `Extransload`, Website URL을 `https://extransload.github.io`로 저장합니다. 프로토콜 선택칸이 별도라면 입력칸에는 `extransload.github.io`만 씁니다.
6. 해당 화면의 **Measurement ID** (`G-...`)를 메모합니다. 기존 스트림을 유지하므로 기존 ID를 계속 사용합니다.

숫자 Property ID는 통계 조회용이고 `G-...`는 사이트 방문 수집용입니다. 서로 대체할 수 없습니다. [Google 공식 스트림 수정 절차](https://support.google.com/analytics/answer/9304776)

### 5-2. 새 GCP 프로젝트 MyBlog에서 처음부터 설정

#### A. 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인합니다.
2. 상단 프로젝트 선택 → **새 프로젝트 / New project**를 누릅니다.
3. **프로젝트 이름 / Project name**에 `MyBlog`를 입력합니다.
4. **프로젝트 ID / Project ID**는 자동 생성된 `myblog-...` 형태를 확인합니다. 직접 정하려면 생성 전에 **수정 / Edit**을 눌러 `myblog-` 뒤에 고유한 숫자 등을 붙입니다. 프로젝트 ID는 전역에서 고유해야 하며 생성 후 변경할 수 없습니다. `MyBlog`는 표시명이고 ID는 소문자입니다.
5. 개인 계정에서 조직이 없다면 위치는 **조직 없음 / No organization**으로 둡니다. 조직 계정이면 허용된 조직·폴더를 선택합니다.
6. **만들기 / Create**를 누른 뒤 상단 프로젝트 선택에서 방금 만든 `MyBlog`를 선택합니다. 이미 만들었다면 새로 만들지 말고 해당 프로젝트를 선택합니다.
7. 프로젝트 설정에서 실제 **Project ID**를 메모합니다. 아래 이메일의 `<실제 프로젝트 ID>`는 이 값으로 결정되며 예시 문자열을 그대로 입력하지 않습니다.

이후 GCP 화면을 이동할 때마다 상단 선택이 `MyBlog`인지 확인합니다. [Google 프로젝트 생성 안내](https://docs.cloud.google.com/resource-manager/docs/creating-managing-projects)

#### B. 통계 API 두 개 활성화

1. **API 및 서비스 / APIs & Services → 라이브러리 / Library**를 엽니다.
2. `Google Analytics Data API` 검색 → 선택 → **사용 / Enable**을 누릅니다.
3. 라이브러리로 돌아가 `Google Search Console API` 검색 → 선택 → **사용 / Enable**을 누릅니다.
4. **사용 설정된 API 및 서비스 / Enabled APIs & services**에서 두 API가 보이는지 확인합니다. 이미 활성화되어 **관리 / Manage**가 보이면 그대로 진행합니다.

여기서는 서비스 계정으로 인증합니다. 별도 OAuth 동의 화면, OAuth 클라이언트 ID, API 키는 만들 필요가 없습니다.

#### C. 새 서비스 계정 생성

1. **IAM 및 관리자 / IAM & Admin → 서비스 계정 / Service Accounts**를 엽니다.
2. **서비스 계정 만들기 / Create service account**를 누릅니다.
3. 다음 값을 입력합니다.

| 입력란 | 입력값 |
|---|---|
| 서비스 계정 이름 | `MyBlog admin reader` |
| 서비스 계정 ID | `myblog-admin-reader` |
| 설명 | `Read GA4 and Search Console statistics for MyBlog` |

4. **만들고 계속하기 / Create and continue**를 누릅니다.
5. 프로젝트 액세스 권한을 부여하는 선택 단계는 비워 두고 계속합니다. 이 통계 조회를 위해 GCP 프로젝트의 Owner·Editor 역할을 부여할 필요는 없습니다.
6. 이 서비스 계정을 사용할 사용자에게 액세스를 부여하는 선택 단계도 비워 두고 **완료 / Done**를 누릅니다.
7. 생성된 계정을 열고 이메일을 복사해 둡니다. 형태는 `myblog-admin-reader@<실제 프로젝트 ID>.iam.gserviceaccount.com`입니다. 이후 GA4·Search Console·Worker에 모두 이 동일한 새 이메일을 사용합니다.

[Google 서비스 계정 생성 안내](https://docs.cloud.google.com/iam/docs/service-accounts-create)

#### D. 새 JSON 비밀키 발급

1. 방금 만든 서비스 계정의 **키 / Keys** 탭을 엽니다.
2. **키 추가 / Add key → 새 키 만들기 / Create new key → JSON → 만들기 / Create**를 누릅니다.
3. 다운로드된 JSON을 저장소 밖의 안전한 위치에 보관합니다. Git·채팅·스크린샷에 포함하지 않습니다.
4. 로컬 편집기로 파일을 열어 `project_id`가 A에서 만든 프로젝트 ID이고 `client_email`이 C의 새 이메일인지 확인합니다. 기존 프로젝트에서 받은 JSON은 사용하지 않습니다.

키 생성이 조직 정책으로 차단되면 해당 조직 관리자에게 허용된 인증 방식 또는 키 발급 정책을 확인합니다. 메뉴가 막혀 있는 상태에서 다음 단계로 넘어가면 연결되지 않습니다. [Google 키 생성 안내](https://docs.cloud.google.com/iam/docs/keys-create-delete)

#### E. 기존 GA4에 새 이메일 권한 추가

1. [Google Analytics](https://analytics.google.com/) → **관리 / Admin**에서 기존 블로그 속성을 선택합니다. 현재 설정 기준 Property ID는 `552453352`입니다.
2. **속성 액세스 관리 / Property access management** → **+ → 사용자 추가 / Add users**를 누릅니다.
3. C에서 복사한 새 서비스 계정 이메일을 입력합니다.
4. **뷰어 / Viewer** 역할을 선택합니다. 이메일 알림 옵션이 있으면 해제하고 **추가 / Add**를 누릅니다.
5. 권한 목록에 새 이메일이 표시되는지 확인합니다. GCP에서 계정을 만든 것만으로 GA4 권한이 생기지는 않습니다.

[Google Analytics 서비스 계정 연결 안내](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart)

#### F. Cloudflare Worker의 Google Secret 두 개 교체

1. Cloudflare 대시보드 → **Workers & Pages → extransload-admin → Settings → Variables and Secrets**를 엽니다.
2. 아래 이름이 이미 있으면 편집하고, 없으면 **Add**로 추가합니다. 유형은 **Secret / Encrypt**로 설정합니다.

| Secret 이름 | 입력값 |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | D에서 받은 새 JSON의 `client_email` 값 |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | 같은 새 JSON의 `private_key` 값. JSON 전체가 아님 |

3. 값 바깥의 JSON 따옴표와 쉼표는 제외합니다. private key는 `-----BEGIN PRIVATE KEY-----`부터 `-----END PRIVATE KEY-----`까지 포함합니다. 현재 Worker는 실제 줄바꿈과 JSON 안의 문자 `\n`을 모두 처리합니다.
4. 두 값은 반드시 같은 JSON에서 가져옵니다. 이전 이메일과 새 키를 섞으면 인증에 실패합니다.
5. 대시보드의 **저장 / Save**, **배포 / Deploy** 또는 **Save and deploy**를 완료합니다.

GCP 프로젝트 ID를 `admin/wrangler.jsonc`에 추가할 필요는 없습니다. 현재 Worker는 위 이메일과 비밀키로 Google에 인증합니다. 기존 GA4 속성을 유지했다면 `GA4_PROPERTY_ID`와 사이트의 `G-...` 값도 그대로 사용합니다.

완료 확인: `MyBlog` 프로젝트에 API 두 개와 `myblog-admin-reader` 서비스 계정이 있고, GA4에 새 이메일 권한을 추가했으며, Worker의 Google Secret 두 개를 새 JSON 값으로 저장했다면 아래 5-3으로 진행합니다.

### 5-3. Search Console 새 URL 속성

이 단계의 소유권 확인은 새 사이트 배포 후 완료합니다. 먼저 속성을 추가하여 확인용 파일을 받아두세요.

1. [Search Console](https://search.google.com/search-console) → 왼쪽 위 속성 선택 → **Add property**를 누릅니다. 이미 `https://extransload.github.io/` 속성을 만들었다면 그 속성을 선택합니다. 소유권 확인도 끝났다면 바로 6번으로 진행합니다.
2. **URL prefix**를 선택하고 `https://extransload.github.io/`를 입력합니다. `github.io`의 DNS를 소유하지 않으므로 Domain 방식은 선택하지 않습니다.
3. **HTML file** 확인 방식에서 Google이 제공하는 파일을 다운로드합니다.
4. 다운로드된 `google…html` 파일을 저장소의 `public/` 폴더에 원래 파일명·내용 그대로 복사합니다. 이 파일은 공개 소유권 확인 파일이므로 배포할 수 있습니다.
5. 아래 7절에서 사이트를 배포한 후 `https://extransload.github.io/google…html`이 열리는지 확인하고 Search Console의 **Verify**를 누릅니다.
6. **Settings → Users and permissions → Add user**에서 5-2 C의 새 `myblog-admin-reader@…` 이메일을 등록합니다. 통계 조회용 **Restricted** 권한을 우선 사용합니다. 기존 계정에 권한이 있어도 새 계정은 별도로 추가해야 합니다.
7. **Sitemaps → Add a new sitemap**에 `sitemap-index.xml`을 제출합니다.
8. **URL inspection**에 홈페이지와 글 하나를 넣어 실제 URL 테스트 후 필요하면 색인 생성을 요청합니다. 제출 직후 데이터가 0이어도 오류라고 단정하지 않습니다.

기존 Search Console 속성 이름을 바꾸는 것만으로 새 주소를 추적할 수 없습니다. 새 URL 속성을 추가해야 합니다. [Google 속성 등록 설명](https://support.google.com/webmasters/answer/34592)

## 6. GitHub Actions 공개 변수 설정

새 저장소 **Settings → Secrets and variables → Actions → Variables**에서 다음 값을 저장합니다. **Secrets 탭이 아니라 Variables 탭**입니다.

| 변수 이름 | 값 |
|---|---|
| `PUBLIC_ADMIN_URL` | `https://extransload-admin.tmdrbsla123.workers.dev/admin/` |
| `PUBLIC_COMMENTS_API_URL` | `https://extransload-admin.tmdrbsla123.workers.dev` |
| `PUBLIC_GA_MEASUREMENT_ID` | 5-1에서 확인한 기존 `G-...` 값 |

이 값은 사이트 빌드 때 HTML/JS에 들어갑니다. 저장만 하고 기존 배포를 그대로 열면 반영되지 않습니다. 다음 절에서 새로 배포해야 합니다.

Cloudflare 새 Worker의 Variables는 코드로 이미 배포했습니다. 대시보드에서만 수정한 값을 후속 배포가 되돌리지 않도록, ID가 달라진 경우 `admin/wrangler.jsonc`도 같은 값으로 맞춥니다. 비밀키는 절대로 이 파일에 넣지 않습니다.

## 7. 최종 게시와 확인

앞의 계정 이름 변경·앱 설정·변수 등록을 마친 뒤 진행합니다. 로컬 개발 서버는 종료할 필요가 없습니다.

```bash
cd /Users/gyu/Documents/projects/itsdangerous.github.io
git status --short
npm test -- --run
npm run build
git diff --check
```

오류가 없고 변경 목록이 이번 이전 작업임을 확인한 뒤 게시합니다. 이 단계는 공개 GitHub에 변경을 올립니다.

```bash
git add -A
git commit -m "Rebrand site as Extransload"
git push origin main
```

이미 커밋했다면 commit 단계는 생략하고 push합니다. **Actions → Deploy to GitHub Pages**에서 build와 deploy가 모두 초록색인지 확인합니다. Variables만 고친 경우 **Run workflow → main**으로 재배포합니다.

Worker 비밀키는 대시보드의 저장/배포를 완료해야 적용됩니다. 설정 파일의 ID를 변경했다면 아래 명령으로 Worker도 다시 배포합니다.

```bash
cd /Users/gyu/Documents/projects/itsdangerous.github.io/admin
npm test
npm run build
npx wrangler deploy
```

완료 체크:

- [ ] 새 홈페이지와 사이드바에서 `Extransload` 타이틀이 보인다.
- [ ] 글 하나·방명록·Markdown Viewer가 새 주소로 열린다.
- [ ] `/robots.txt`, `/sitemap-index.xml`, `/rss.xml`에 새 도메인이 들어 있다.
- [ ] `/admin/`이 새 Worker로 연결된다.
- [ ] GitHub 로그인 후 본인 계정으로 관리자 기능을 사용할 수 있다.
- [ ] 테스트 초안을 저장하고 새로고침해도 남는다. 발행하기 전 공개 목록에 나오지 않는다.
- [ ] 테스트 글 발행 시 새 GitHub 저장소에 commit이 생기고 Pages 배포가 성공한다. 확인 후 필요하면 관리자에서 발행 취소한다.
- [ ] 방명록 테스트 댓글 작성·삭제가 된다.
- [ ] GA4 Realtime에서 새 사이트 방문이 확인된다. 관리자 통계는 데이터 반영 지연을 고려한다.
- [ ] Search Console 새 속성 소유권 확인과 sitemap 제출을 완료했다.

## 8. 막혔을 때 바로 확인할 곳

| 증상 | 확인 및 조치 |
|---|---|
| 사용자명 사용 불가 | `extransload`를 확보할 수 있는지 GitHub 화면에서 확인. 다른 사람 계정으로 이전하려 하지 않기 |
| git push repository not found | 사용자명과 저장소명을 모두 변경했는지, Git 인증 계정이 소유자인지 확인 |
| 새 사이트 404 | Pages source가 GitHub Actions인지, Actions deploy 성공 여부, 저장소명이 `extransload.github.io`인지 확인 |
| OAuth callback 오류 | OAuth App의 callback을 3절과 문자 단위로 대조. 새 Worker Secret 등록 확인 |
| 로그인 후 403 | 숫자 허용 User ID와 실제 로그인 계정 ID 비교 |
| 로그인은 되지만 글 발행 실패 | GitHub App의 선택 저장소·Contents 쓰기 권한·설치 ID·PEM Secret 확인 |
| 새 창에서는 로그인 유지 안 됨 | Worker와 github.io 간 쿠키가 브라우저의 서드파티 쿠키 정책으로 차단되는지 확인. Worker 관리자 URL을 직접 열어 비교 |
| 댓글 503 | 새 Worker에 `COMMENTS_SECRET`과 D1 DB 바인딩이 있는지 확인 |
| GA4 403 | 서비스 계정 이메일에 해당 숫자 Property의 Viewer 권한이 있는지 확인 |
| GA4 방문 0 | Pages의 `G-...` 변수와 재배포 여부, 광고 차단기, 실제 새 URL 방문 확인 |
| Search Console 확인 실패 | 확인 HTML 파일이 public에 들어 있고 새 도메인 루트에서 200으로 열리는지 확인 |
| 관리자 연결이 옛 주소로 감 | GitHub PUBLIC 변수를 수정하고 Pages 재배포. 로컬 .env에 옛 값이 있으면 별도 갱신 |

문제가 있으면 기존 Worker/D1을 유지한 채 해당 단계만 수정합니다. 새 DB를 지우고 다시 만드는 것은 로그인·댓글 오류의 일반적인 해결책이 아닙니다. 이전 사용자명 회수가 보장되지 않으므로 계정 이름을 반복해서 되돌리지 않습니다.

## 9. 이사 후 정리

Google 연결도 확인합니다. 새 Worker 관리자에 로그인해 GA4와 Search Console 통계 화면에서 인증·권한 오류가 없는지 확인합니다. 새 사이트는 데이터가 비어 있을 수 있지만, 401·403이나 설정 누락 오류는 해결해야 합니다. 두 조회가 정상임을 확인한 후 GA4와 Search Console에서 기존 서비스 계정 권한을 제거할 수 있습니다. 기존 GCP 프로젝트는 다른 서비스가 사용하지 않는지 확인한 뒤 별도로 삭제를 결정합니다. 새 프로젝트 생성만으로 기존 프로젝트가 삭제되지는 않습니다.

새 주소의 모든 체크가 끝나면 본인 프로필·외부 링크·북마크·Google 태그 이름의 옛 표시명을 갱신합니다. 기존 Worker/D1은 새 서비스 사용을 확인한 뒤 Cloudflare에서 개별 삭제할 수 있습니다. 삭제 전 정확한 기존 이름 `itsdangerous-admin`을 확인하세요. 삭제는 별도 선택이며 이 작업에서 실행하지 않았습니다.

게시글 안의 예전 스크린샷은 역사적인 작업 화면입니다. 현재 브랜드 워드마크와 달리, 화면에 찍힌 당시 계정 정보를 임의로 새 계정 화면처럼 바꾸지 않았습니다. Git 기록과 이 이전 안내의 과거 이름도 남아 있습니다.

추가 공식 참고: [D1 migration](https://developers.cloudflare.com/d1/reference/migrations/), [D1 생성과 배포](https://developers.cloudflare.com/d1/get-started/). 새 DB를 다시 만들 필요는 없습니다.
