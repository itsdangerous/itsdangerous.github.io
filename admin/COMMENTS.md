# 비회원 댓글

게시물은 `/blog/posts/{slug}/`, 방명록은 `/guestbook/`를 page 키로 사용한다. 슬러그를 변경하면 이전 page의 댓글은 자동 이동하지 않는다.

## 배포 순서

기존 관리자 설정과 secret을 유지한다. 코드 작성만으로 운영 DB나 Worker가 바뀌지는 않는다.

1. `admin/`에서 `npx wrangler d1 migrations apply itsdangerous-admin --remote`로 댓글 테이블을 추가한다. 기존 글과 세션 테이블은 변경하지 않는다.
2. `npx wrangler secret put COMMENTS_SECRET`에 암호학적으로 무작위인 32바이트 이상의 secret을 등록한다. 값은 출력·커밋하지 않는다. 이 값은 비밀번호 pepper와 익명 식별자 해시에 사용되므로 별도로 안전하게 보관하고, 기존 댓글이 있는 상태에서 임의 교체하지 않는다.
3. `npm run build` 후 `npx wrangler deploy`로 Worker와 기존 관리자 assets를 함께 배포한다.
4. 댓글 GET과 쓰기 smoke test 후 블로그를 배포한다. `PUBLIC_COMMENTS_API_URL`을 생략하면 현재 관리자 Worker 주소가 사용된다. 도메인이 바뀌면 공개 빌드 설정도 바꾼다.

`COMMENTS_ORIGINS`는 쉼표로 구분한 허용 origin이다. 생략 시 `https://itsdangerous.github.io`만 허용한다. 관리자 API에는 공개 CORS를 적용하지 않는다. 운영 설정에 localhost를 넣지 않는다.

secret 또는 DB 준비가 안 된 경우 댓글 API는 503을 반환하고 UI는 입력을 보존한 채 연결 오류를 안내한다. 이전 GitHub 댓글로 자동 전환하지 않는다.

## 보장 범위

- 비밀번호는 댓글별 salt + Worker secret 기반 HMAC pepper + PBKDF2-SHA256 100,000회로 저장한다. 평문·해시·salt는 공개 응답에 포함하지 않는다. 비밀번호는 4~128자이며 변경·복구 기능은 없다.
- 댓글 본문은 HTML/Markdown 실행 없이 텍스트로 출력한다. 닉네임은 신원 인증이 아니며 중복될 수 있다.
- 비공개 댓글의 닉네임과 본문은 목록 API에서 반환하지 않는다. 댓글 비밀번호를 제출한 뒤에만 해당 내용이 브라우저에 반환된다.
- 등록 IP당 분당 5회, 비밀번호 확인 IP당 분당 10회·댓글당 분당 30회, 좋아요 IP당 분당 60회로 제한한다. IP 원문은 저장하지 않는다. 시간 구간을 포함한 HMAC 키만 저장하며 cron이 만료 bucket을 제거한다. CORS는 봇 인증 수단이 아니며, 공격 규모가 커지면 Turnstile/WAF와 운영자 숨김 기능을 추가한다.
- 좋아요는 localStorage의 무작위 브라우저 ID를 기준으로 한다. 비공개 창·다른 기기·저장소 초기화는 별개 ID다. PUT은 목표 상태를 받아 같은 요청을 반복해도 중복 증가하지 않는다.
- 답글은 원댓글에 한 단계만 달 수 있다. 원댓글을 삭제하면 그 답글과 좋아요도 함께 삭제한다.
- 수정·삭제는 버전을 확인하여 오래된 화면의 덮어쓰기를 거절한다. 삭제 시 좋아요도 삭제한다.
- 등록 응답이 유실되면 자동 재전송하지 않는다. UI 안내에 따라 목록을 확인한 뒤 다시 작성한다.
- 목록은 최신순 20개씩 cursor pagination한다. cursor 댓글이 삭제되면 새로고침을 요청한다.

## 로컬 검증

저장소 루트에서 `.env.development.example`을 `.env.development.local`로, `admin/.dev.vars.example`을 `admin/.dev.vars`로 복사한다. 두 파일은 로컬 전용이며 커밋하지 않는다.

그 다음 `admin/`에서 `npx wrangler d1 migrations apply itsdangerous-admin --local --config wrangler.jsonc`로 별도 local D1에 migration을 적용하고 `npx wrangler dev --local --config wrangler.jsonc --port 8788`를 실행한다. 다른 터미널에서 저장소 루트의 `npm run dev -- --host 127.0.0.1`를 실행하면, 게시글과 방명록이 `http://127.0.0.1:8788`의 local Worker를 사용한다. 실제 운영 DB·API·사용자 댓글은 건드리지 않는다.
