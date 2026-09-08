# 관리자 CMS 연결 Runbook

이 문서는 사이트 관리자 기능을 운영 환경에 연결하기 위해 운영자가 수행해야 하는 절차를 설명합니다.

이 절차를 완료하면 다음 운영 흐름을 사용할 수 있습니다.

```text
itsdangerous.github.io/admin
        ↓
GitHub 로그인
        ↓
관리자 화면에서 글 작성
        ↓
초안 저장 또는 발행
        ↓
GitHub Pages 자동 배포
        ↓
관리자 화면에서 GA4/Search Console 통계 확인
```

비밀번호, Client Secret, private key는 이 문서에 적거나 채팅으로 보내지 않습니다. 모두 Cloudflare의 secret 입력 화면에 직접 등록합니다.

## 먼저 알아둘 것

### 사용 서비스

| 서비스 | 하는 일 |
|---|---|
| GitHub | 로그인과 글 발행 대상 |
| Cloudflare | 관리자 서버와 비공개 초안 저장 |
| Google Cloud/GA4 | 방문자·페이지뷰 통계 |
| Search Console | Google 검색어·노출 통계 |

### 설정 값의 의미

| 값 | 쉽게 말하면 | 공개 여부 |
|---|---|---|
| GitHub OAuth Client ID | 로그인 앱의 이름표 | 공개 가능 |
| GitHub OAuth Client Secret | 로그인 앱의 비밀번호 | secret |
| GitHub 숫자 User ID | 본인 계정의 고유 번호 | 공개 가능 |
| GitHub App Private Key | 글을 repository에 저장할 열쇠 | secret |
| Google private key | 통계를 읽을 열쇠 | secret |
| GA4 Property ID | 통계를 가져올 대상 번호 | 공개 가능 |

## 1. GitHub 숫자 User ID 확인

1. GitHub에 로그인합니다.
2. 본인 프로필 주소의 사용자 이름을 확인합니다. 예를 들어 `https://github.com/example`이면 `example`입니다.
3. 주소창에 다음을 입력합니다.

```text
https://api.github.com/users/본인사용자이름
```

4. JSON 화면에서 다음처럼 표시된 `id` 숫자를 복사합니다.

```json
{
  "login": "example",
  "id": 12345678
}
```

`id` 숫자를 사용합니다. `login`, 이메일, 프로필 주소를 넣으면 안 됩니다.

## 2. GitHub 로그인 앱 만들기

1. GitHub 오른쪽 위 프로필 사진 → `Settings`를 누릅니다.
2. 왼쪽 아래 `Developer settings` → `OAuth Apps`로 이동합니다.
3. `New OAuth App`을 누릅니다.
4. 다음처럼 입력합니다.

| 입력란 | 입력할 내용 |
|---|---|
| Application name | `itsdangerous admin` |
| Homepage URL | 관리자 Worker 주소 |
| Authorization callback URL | `<관리자 Worker 주소>/auth/callback` |

5. `Register application`을 누릅니다.
6. `Client ID`를 복사합니다.
7. `Generate a new client secret`을 누르고 secret을 안전하게 임시 보관합니다.

관리자 Worker 주소가 아직 없다면 이 단계는 Worker 생성 후 callback URL을 다시 입력하면 됩니다.

## 3. Cloudflare Worker와 D1 만들기

D1은 관리자 화면에서 작성한 초안을 보관하는 비공개 데이터베이스입니다. 초안을 공개 repository에 저장하면 `draft: true`여도 repository를 볼 수 있는 사람이 원문을 읽을 수 있습니다.

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)에 로그인합니다.
2. `Workers & Pages` → `Create application`을 누릅니다.
3. 지금 보이는 `Make something new` 화면에서는 **`Start with Hello World!`**를 선택합니다.
4. `Connect GitHub`는 공개 사이트 repository를 연결하는 메뉴이므로 이 작업에서는 선택하지 않습니다.
5. Worker 이름을 `itsdangerous-admin`으로 정합니다.
6. 생성 또는 배포 화면에서 Worker를 먼저 만듭니다. 이 단계에서 나오는 `workers.dev` 주소는 임시로 메모합니다.
7. 왼쪽 메뉴에서 `Storage & databases` → `D1 SQL Database`를 엽니다.
8. `Create database`를 누릅니다.
9. 데이터베이스 이름을 정확히 `itsdangerous-admin`으로 입력합니다.
10. 생성 후 표시되는 `Database ID`를 복사합니다.
11. 다음 파일을 엽니다.

```text
/Users/gyu/Documents/projects/itsdangerous.github.io/admin/wrangler.jsonc
```

12. 아래 값만 Cloudflare의 실제 Database ID로 바꿉니다.

```jsonc
"database_id": "REPLACE_AFTER_CREATE"
```

## 4. GitHub App 만들기

OAuth App과 GitHub App은 서로 다른 앱입니다. OAuth App은 로그인용이고, GitHub App은 글을 repository에 저장하는 용도입니다. **Callback URL은 앞의 OAuth App에만 입력합니다. GitHub App에는 Callback URL을 입력하지 않습니다.**

여기서 말하는 **관리자 Worker 주소**는 Cloudflare에서 Worker를 만든 뒤 나온 `workers.dev` URL입니다. 별도로 새 주소를 만드는 것이 아닙니다.

Cloudflare 대시보드에 표시된 Worker 주소 전체를 `<WORKER_URL>`에 대입합니다. 예를 들어 Worker 주소가 `https://itsdangerous-admin.example.workers.dev`라면 해당 주소를 그대로 사용합니다.

```text
Homepage URL
<WORKER_URL>
```

1. GitHub `Settings` → `Developer settings` → `GitHub Apps` → `New GitHub App`을 누릅니다.
2. Cloudflare에서 확인한 Worker 주소를 Homepage URL에 입력합니다.
3. GitHub App의 Callback URL 입력란은 비워 둡니다.
4. Webhook은 사용하지 않도록 설정합니다.
5. 생성 화면을 아래로 스크롤하여 `Permissions` 또는 `Repository permissions` 영역을 찾습니다.
6. Repository permissions를 다음처럼 설정합니다.

| 권한 | 설정 |
|---|---|
| Contents | Read and write |
| Actions | Read-only |
| 나머지 | No access |

7. 권한 영역이 생성 화면에 보이지 않으면 먼저 App을 생성합니다.
8. 생성된 GitHub App의 설정 화면 왼쪽 메뉴에서 `Permissions & events`를 누릅니다.
9. `Repository permissions` 아래에서 `Contents`를 `Read and write`, `Actions`를 `Read-only`로 설정하고 `Save changes`를 누릅니다.
10. App의 `App ID`를 복사합니다.
11. `Install App`을 눌러 사이트 repository 하나에만 설치합니다.
12. 설치가 끝난 뒤 브라우저 주소창에서 Installation ID를 확인합니다. `App ID`와 Installation ID는 서로 다른 번호입니다.

```text
https://github.com/settings/installations/12345678
                                         ^^^^^^^^
                                         Installation ID
```

주소가 `/settings/installations/12345678`로 끝나면 마지막 숫자만 복사합니다. 조직 계정에 설치한 경우에도 `/organizations/<조직명>/settings/installations/12345678`의 마지막 숫자를 사용합니다. 설치 후 번호가 보이지 않으면 GitHub `Settings` → `Applications` → `Installed GitHub Apps` → 해당 App의 `Configure`를 누르면 같은 주소에서 확인할 수 있습니다.
13. `Private keys` → `Generate a private key`를 누릅니다.
14. 내려받은 `.pem` 파일은 repository에 넣지 않습니다.

`GITHUB_REPO` 값은 다음 형식입니다.

```text
소유자이름/itsdangerous.github.io
```

## 5. Google 통계 권한 만들기

이 단계는 다음 세 가지를 순서대로 진행합니다.

1. Google Cloud 프로젝트에서 API를 켭니다.
2. Google Cloud에서 통계를 읽을 서비스 계정을 만듭니다.
3. Google Analytics 4와 Search Console에서 그 서비스 계정에 읽기 권한을 줍니다.

Google Cloud의 프로젝트와 Google Analytics의 Property는 서로 다른 화면과 개념입니다. Google Cloud 프로젝트를 만들었다고 해서 GA4 Property가 자동으로 만들어지지는 않습니다.

### Google API 켜기

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인합니다.
2. 사이트용 프로젝트를 선택합니다.
3. `APIs & Services` → `Library`에서 다음 두 API를 각각 찾아 `Enable`을 누릅니다.

```text
Google Analytics Data API
Google Search Console API
```

### 서비스 계정 만들기

1. `IAM & Admin` → `Service Accounts` → `Create service account`를 누릅니다.
2. 이름을 `itsdangerous-admin-reader`로 입력합니다.
3. 생성된 서비스 계정을 열고 `Keys` → `Add key` → `Create new key` → `JSON`을 선택합니다.
4. 다운로드된 JSON 파일을 안전하게 보관합니다.
5. JSON 안의 `client_email`과 `private_key`를 나중에 사용합니다.

### GA4 Property가 없는 경우 먼저 만들기

Google Analytics 화면에 사이트나 Property가 보이지 않는 경우에는 권한을 주기 전에 GA4를 먼저 만듭니다.

1. [Google Analytics](https://analytics.google.com/)에 로그인합니다.
2. 왼쪽 아래의 `Admin`(톱니바퀴)을 누릅니다.
3. `Property` 열에서 `Create property`를 누릅니다.
4. Property name에는 사이트 이름을 입력합니다. 예: `itsdangerous.github.io`
5. Reporting time zone은 `South Korea` 또는 `Seoul`로 선택합니다.
6. Currency는 본인이 사용할 통화로 선택하고 `Next` → `Create`를 누릅니다.
7. 데이터 수집 방법을 묻는 화면에서 `Web`을 선택합니다.
8. Website URL에는 `https://itsdangerous.github.io`를 입력합니다. URL 입력란에 `https://`를 중복해서 넣지 않습니다.
9. Stream name에는 사이트 이름을 입력하고 `Create stream`을 누릅니다.
10. 생성된 Web stream의 상세 화면에서 `Measurement ID`를 확인합니다. 형식은 `G-XXXXXXX`입니다.

이 단계에서 만든 `G-XXXXXXX`는 방문자 추적용 Measurement ID입니다. 관리자 Worker가 GA4 Data API를 호출할 때 필요한 숫자 Property ID와는 다른 값입니다.

### GA4에 서비스 계정 권한 주기

1. [Google Analytics](https://analytics.google.com/)에 로그인합니다.
2. 왼쪽 아래의 `Admin`(톱니바퀴)을 누릅니다.
3. 화면 위쪽의 `Property` 선택 상자에서 방금 만든 사이트 Property를 선택합니다. Property가 여러 개면 이름이 `itsdangerous.github.io`인 항목을 선택합니다.
4. `Property access management`를 누릅니다. 화면에 따라 `Property` 열 아래에 표시됩니다.
5. 오른쪽 위의 `+` 또는 `Add users`를 누릅니다.
6. Google Cloud 서비스 계정 JSON의 `client_email` 값을 복사해 붙여 넣습니다. 일반 Google 계정 이메일이 아니라 `...iam.gserviceaccount.com`으로 끝나는 서비스 계정 이메일입니다.
7. 권한은 `Viewer`로 선택하고 `Add` 또는 `Save`를 누릅니다.

### 숫자 GA4 Property ID 확인

1. 같은 GA4 `Admin` 화면에서 올바른 Property가 선택되어 있는지 확인합니다.
2. `Property settings` 또는 `Property details`를 엽니다.
3. `PROPERTY ID`라고 표시된 숫자를 복사합니다. 예: `123456789`
4. 이 숫자를 나중에 Cloudflare Worker의 `GA4_PROPERTY_ID` 값으로 입력합니다.

다음 네 값은 용도가 다릅니다.

| 값 | 어디서 확인하는가 | Worker에 입력하는가 |
|---|---|---|
| `client_email` | Google Cloud 서비스 계정 JSON | 권한 부여에 사용 |
| `private_key` | Google Cloud 서비스 계정 JSON | Secret으로 입력 |
| `G-XXXXXXX` | GA4 Web stream 상세 화면의 Measurement ID | 현재 Worker 설정에는 입력하지 않음 |
| 숫자 `PROPERTY ID` | GA4 Property details | `GA4_PROPERTY_ID`로 입력 |

`Property`가 전혀 표시되지 않는다면 아직 GA4 Property를 만들지 않은 상태이므로, 먼저 위의 `GA4 Property가 없는 경우 먼저 만들기`를 완료합니다. Google Cloud Console의 프로젝트 목록이나 `G-XXXXXXX`만으로는 GA4 Property ID를 대신할 수 없습니다.

### Search Console 권한 주기

#### Search Console 속성이 아직 없는 경우

Search Console에서 사이트가 아직 보이지 않는다면 서비스 계정 이메일을 추가하기 전에 사이트를 먼저 속성으로 등록하고 소유권을 확인해야 합니다.

1. [Google Search Console](https://search.google.com/search-console)에 로그인합니다.
2. 왼쪽 위의 속성 선택 상자를 누르고 `Add property`를 선택합니다.
3. `URL-prefix property`를 선택합니다.
4. 다음 주소를 끝의 `/`까지 그대로 입력합니다.

```text
https://itsdangerous.github.io/
```

5. `Continue`를 누릅니다.
6. 소유권 확인 방법을 선택합니다. GitHub Pages 정적 사이트에서는 `HTML tag` 방식이 가장 단순합니다.
7. Google이 보여주는 `<meta ...>` 태그를 복사합니다.
8. 해당 태그를 사이트 첫 화면(`/`)의 `<head>`에 추가합니다. 이 repository에서는 첫 화면이 `src/domains/main/layouts/SplashLayout.astro`를 사용하므로 그 파일의 `<head>` 안에 붙여 넣습니다. 그 다음 GitHub에 commit/push하고 Pages 배포가 끝난 뒤 Search Console의 확인 창에서 `Verify`를 누릅니다.

HTML 태그를 코드에 추가하기 어렵다면 Search Console이 제시하는 다른 확인 방법을 사용할 수 있습니다. 확인이 완료되어야 해당 속성의 검색 데이터를 보고 사용자를 관리할 수 있습니다.

#### 서비스 계정 이메일 추가

1. Search Console 속성 선택 상자에서 방금 등록하고 소유권 확인을 완료한 `https://itsdangerous.github.io/` 속성을 선택합니다.
2. `Settings` → `Users and permissions`로 이동합니다.
3. `Add user`를 누릅니다.
4. Google Cloud 서비스 계정 JSON의 `client_email`을 입력합니다. 일반 Google 계정 이메일이 아니라 `...iam.gserviceaccount.com`으로 끝나는 주소입니다.
5. 권한은 통계 조회에 필요한 최소 권한인 `Restricted` 또는 화면에서 제공하는 읽기 전용 권한을 선택하고 저장합니다.

검색어 데이터는 권한을 준 직후 바로 나타나지 않을 수 있습니다.

## 6. Cloudflare에 값 등록

Cloudflare Dashboard → `Workers & Pages` → `itsdangerous-admin` → `Settings`로 이동합니다.

### Variables에 등록할 값

```text
GITHUB_CLIENT_ID
GITHUB_ALLOWED_USER_ID
GITHUB_REPO
GITHUB_APP_ID
GITHUB_INSTALLATION_ID
GA4_PROPERTY_ID
GA4_HOSTNAME
SEARCH_CONSOLE_PROPERTY
ADMIN_URL
```

| 변수 | 입력값 |
|---|---|
| `GITHUB_CLIENT_ID` | **GitHub OAuth App**의 `Client ID` |
| `GITHUB_ALLOWED_USER_ID` | 1단계의 숫자 ID |
| `GITHUB_REPO` | `소유자이름/itsdangerous.github.io` |
| `GITHUB_APP_ID` | **GitHub App**의 `App ID` 숫자 |
| `GITHUB_INSTALLATION_ID` | GitHub App을 repository에 설치한 뒤 주소에서 확인한 `Installation ID` 숫자 |
| `GA4_PROPERTY_ID` | GA4의 숫자 `PROPERTY ID` |
| `GA4_HOSTNAME` | `itsdangerous.github.io` |
| `ADMIN_URL` | 관리자 Worker 주소 뒤 `/admin/` |
| `SEARCH_CONSOLE_PROPERTY` | 이번 설정에서는 `https://itsdangerous.github.io/`를 마지막 `/`까지 그대로 입력 |

### Secrets에 등록할 값

```text
GITHUB_CLIENT_SECRET
GITHUB_PRIVATE_KEY
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
```

각 Secret의 출처는 다음과 같습니다.

| Secret 이름 | 가져오는 곳 | 입력할 값 |
|---|---|---|
| `GITHUB_CLIENT_SECRET` | **GitHub OAuth App** → `Client secrets` | OAuth App의 `Generate a new client secret`으로 만든 Secret 전체 |
| `GITHUB_PRIVATE_KEY` | **GitHub App** → `Private keys` | `Generate a private key`로 내려받은 `.pem` 파일의 전체 내용 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud 서비스 계정 JSON | JSON의 `client_email` 값만 입력 |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Google Cloud 서비스 계정 JSON | JSON의 `private_key` 값 전체 입력 |

두 GitHub 앱의 값을 섞으면 안 됩니다.

- **GitHub OAuth App**은 관리자 로그인에 사용합니다. 여기서 `GITHUB_CLIENT_ID`와 `GITHUB_CLIENT_SECRET`을 가져옵니다.
- **GitHub App**은 repository에 글을 commit할 권한에 사용합니다. 여기서 `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_PRIVATE_KEY`를 가져옵니다.
- Google 서비스 계정은 GA4와 Search Console 통계를 읽는 데 사용합니다.

Cloudflare에서 `Settings` → `Variables and Secrets` → `Add`를 누른 뒤, Secret은 `Encrypt` 유형으로 등록합니다. `GITHUB_CLIENT_SECRET`과 두 Google private key는 새로 발급하거나 다운로드한 직후에만 확인할 수 있으므로 안전하게 보관합니다. `.pem` 파일이나 Google JSON 파일 자체를 repository에 올리거나 이 문서에 붙여 넣지 않습니다.

Private key는 내용 전체를 입력합니다. 따옴표를 추가하지 않습니다. Google private key에는 JSON 파일 전체가 아니라 JSON 안의 `private_key` 값만 넣습니다.

## 7. Worker 배포

터미널을 열고 다음 명령을 순서대로 실행합니다.

```bash
cd /Users/gyu/Documents/projects/itsdangerous.github.io/admin
npm install
npm run build
npx wrangler d1 migrations apply itsdangerous-admin --remote
npx wrangler deploy
```

Cloudflare 로그인 화면이 나오면 본인 Cloudflare 계정으로 로그인합니다. 마지막에 표시되는 `https://...workers.dev` 주소가 관리자 Worker 주소입니다.

## 8. 공개 사이트에 관리자 주소 연결

1. GitHub repository → `Settings` → `Secrets and variables` → `Actions` → `Variables`로 이동합니다.
2. `New repository variable`을 누릅니다.
3. 이름은 `PUBLIC_ADMIN_URL`로 입력합니다.
4. 값은 관리자 Worker 주소 뒤에 `/admin/`을 붙여 입력합니다.

```text
https://itsdangerous-admin.사용자계정.workers.dev/admin/
```

5. 저장 후 GitHub Actions의 `Deploy to GitHub Pages`를 수동 실행합니다.
6. 다음 주소를 열어 Worker로 이동하는지 확인합니다.

```text
https://itsdangerous.github.io/admin/
```

## 9. 최초 확인 순서

1. `/admin/`에서 GitHub 로그인을 누릅니다.
2. 본인 계정으로만 로그인되는지 확인합니다.
3. 새 글을 작성하고 `저장`을 누릅니다.
4. 새로고침 후 글이 남아 있는지 확인합니다.
5. 초안 상태의 글이 공개 블로그 목록과 RSS에 나타나지 않는지 확인합니다.
6. `발행`을 누릅니다.
7. GitHub repository에 Markdown commit이 생겼는지 확인합니다.
8. GitHub Actions가 성공하고 Pages 배포가 끝났는지 확인합니다.
9. 공개 글 URL을 엽니다.
10. 관리자 통계에서 GA4 방문자·페이지뷰·세션을 확인합니다.

## 10. 오류가 생겼을 때

| 증상 | 확인할 곳 |
|---|---|
| `ADMIN_NOT_CONFIGURED` | Worker Variables/Secrets 이름과 D1 ID |
| 로그인 callback 오류 | OAuth App의 callback URL |
| 로그인 후 접근 거부 | `GITHUB_ALLOWED_USER_ID` 숫자 |
| 글 저장 401/403 | 로그인 상태와 CSRF 오류 |
| GitHub 발행 실패 | GitHub App 설치 repository와 Contents 권한 |
| 사이트에 글이 안 보임 | GitHub Actions build와 Pages 배포 로그 |
| GA4 권한 오류 | 서비스 계정의 GA4 Property Viewer 권한 |
| GA4 수치 없음 | 숫자 Property ID와 hostname |
| 검색어 없음 | Search Console 권한과 데이터 지연 |

오류를 공유할 때는 secret 값이나 private key를 포함하지 않습니다. 오류 문구와 어느 단계에서 발생했는지만 공유하면 됩니다.
