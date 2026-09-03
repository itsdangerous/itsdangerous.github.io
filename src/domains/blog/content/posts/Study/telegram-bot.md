---
title: "Telegram Bot으로 서비스 운영 알림 구축하기"
description: "Telegram Bot API를 이용해 배치·데이터 처리 작업의 완료 알림을 비공개 채널로 보내는 구성을 정리"
pubDate: 2026-08-18T07:10:04.000Z
category: "Study"
tags: []
slug: "telegram-bot"
draft: false
---
배치 작업, 데이터 처리, 리포트 생성처럼 완료까지 시간이 걸리는 기능을 운영하다 보면 작업 상태를 확인하기 위해 관리자 화면을 반복해서 열게 된다. 중요한 작업이 끝났을 때 Telegram으로 알림을 보내면 별도의 모바일 앱을 만들지 않고도 운영 상태를 빠르게 확인할 수 있다.

이 글에서는 알림 전용 Telegram Bot을 만들고 비공개 채널에 연결한 뒤, Bot API로 메시지를 보내는 과정을 처음부터 끝까지 설명한다. 애플리케이션별 구현은 다루지 않고, 어떤 환경에서도 공통으로 필요한 Telegram 설정과 API 검증에 집중한다.

완성되는 흐름은 다음과 같다.

```
백그라운드 작업 완료
  -> 애플리케이션이 Telegram Bot API 호출
  -> 비공개 운영 알림 채널에 메시지 게시
  -> 채널 구독자의 기기에 푸시 알림 표시
```

설정은 세 단계로 나뉜다.

1. Telegram Bot과 비공개 채널을 준비한다.
2. Bot API를 직접 호출해 토큰과 채널 Chat ID를 검증한다.
3. 검증된 값을 배포 환경에 안전하게 보관한다.

먼저 이 글의 직접 전송 테스트까지 완료해 두면, 이후 어떤 언어나 프레임워크에서 연동하더라도 Telegram 설정 문제와 애플리케이션 문제를 쉽게 분리할 수 있다.

## 0. 시작 전에 준비할 것

다음 항목이 필요하다.

- 장기간 관리할 수 있는 Telegram 계정
- 운영 알림 전용으로 사용할 봇 이름과 username
- 비공개 채널을 관리할 담당자
- 외부 HTTPS 요청을 보낼 수 있는 서버 또는 개발 환경
- 명령줄 테스트에 사용할 `curl`
- JSON 응답을 읽기 쉽게 보여주는 `jq`(선택 사항)

이 글에서는 다음과 같은 가상의 이름을 사용한다.

| 구분 | 예시 |
| --- | --- |
| 채널 이름 | `Example Operations Alerts` |
| 봇 표시 이름 | `Example Operations Bot` |
| 봇 username | `example\_operations\_bot` |

봇의 표시 이름과 username은 서로 다르다. 표시 이름은 Telegram 화면에 보이는 이름이고, username은 검색·멘션·링크에 사용하는 고유한 식별자다. 봇 username은 영문, 숫자, 밑줄만 사용할 수 있으며 `bot`으로 끝나야 한다.

봇은 개인 Telegram 계정으로 만들 수 있지만, 토큰은 개인 메모가 아니라 팀이 관리하는 비밀 저장소에 보관하는 것이 좋다. 담당자가 바뀔 때는 봇 소유권과 토큰 관리 상태도 함께 인수인계한다.

## 1. BotFather에서 알림용 봇 만들기

### 1-1. 공식 BotFather 열기

Telegram에서 정확히 `@BotFather`를 검색하거나 다음 링크를 연다.

```
https://t.me/BotFather
```

유사한 이름의 계정과 혼동하지 않도록 username을 확인한 뒤 `Start`를 누른다.

### 1-2. 새 봇 생성하기

BotFather 대화창에 다음 명령을 보낸다.

```
/newbot
```

먼저 표시 이름을 입력한다.

```
Example Operations Bot
```

이어서 username을 입력한다.

```
example_operations_bot
```

username이 이미 사용 중이면 서비스명과 용도를 조합해 다른 이름을 선택한다.

```
example_job_alert_bot
example_ops_notification_bot
```

username은 검색과 봇 링크에 사용되므로 역할을 알아보기 쉬운 이름이 좋다.

### 1-3. 봇 토큰 보관하기

봇 생성이 끝나면 BotFather가 다음과 같은 형식의 인증 토큰을 발급한다.

```
1234567890:문자열...
```

이 값이 이후 `TELEGRAM\_BOT\_TOKEN`으로 사용할 봇 토큰이다. 토큰을 아는 사람은 봇을 제어할 수 있으므로 비밀번호처럼 취급해야 한다.

토큰은 다음 원칙에 따라 관리한다.

- 비밀번호 관리자나 배포 환경의 Secret Manager에 저장한다.
- Git, 소스 코드, 테스트 코드 또는 문서에 직접 넣지 않는다.
- 메신저, 이메일, 이슈, AI 채팅에 붙여 넣지 않는다.
- 토큰이 포함된 터미널이나 설정 화면을 캡처해 공유하지 않는다.
- 로그에 요청 URL 전체가 남지 않도록 주의한다.

토큰이 노출되었다면 BotFather에서 `/token` 명령으로 새 토큰을 발급하고 기존 토큰을 즉시 교체한다.

## 2. 봇 프로필 정리하기

이 단계는 필수는 아니지만, 여러 봇을 운영한다면 용도를 구분하기 쉽도록 설정하는 편이 좋다.

| 항목 | BotFather 명령 | 예시 |
| --- | --- | --- |
| 설명 | `/setdescription` | `서비스 작업 완료와 운영 상태를 알리는 봇입니다.` |
| 짧은 소개 | `/setabouttext` | `Service operations notification bot` |
| 프로필 이미지 | `/setuserpic` | 서비스 로고 또는 알림용 아이콘 |

각 명령을 실행한 뒤 방금 만든 봇을 선택하고 값을 입력한다. 공개 글이나 여러 사람이 보는 화면에 실제 서비스 정보를 노출하고 싶지 않다면, 프로필 설명에도 내부 시스템명이나 인프라 구성을 적지 않는다.

## 3. 그룹과 채널 중 무엇을 사용할까

Telegram Bot은 그룹과 채널 모두에 메시지를 보낼 수 있다. 다만 두 공간의 목적은 다르다.

### 3-1. 그룹: 참여자들이 대화하는 공간

그룹은 여러 참여자가 같은 공간에서 메시지를 주고받는 대화방이다. 운영 담당자가 알림에 답하거나, 봇에게 명령을 보내거나, 장애 상황을 함께 논의해야 한다면 그룹이 적합하다.

그룹은 모든 참여자가 메시지를 보내도록 운영할 수도 있고, 관리자만 게시하도록 제한할 수도 있다. 하지만 기본 목적은 참여자 사이의 대화와 상호작용이다.

### 3-2. 채널: 알림을 전달하는 공간

채널은 관리자나 봇이 게시하고 구독자가 받아보는 공지 공간이다. 배포, 장애, 작업 완료처럼 봇이 알림을 보내고 사람은 읽기만 하면 되는 경우 채널이 더 잘 맞는다. 게시물도 개인 계정이 아니라 채널 이름과 이미지로 표시된다.

토론이 필요하면 채널에 별도의 Discussion Group을 연결할 수 있다. 이 경우 채널은 공지용으로 유지하고, 연결된 그룹은 댓글과 질문을 위한 공간으로 사용한다.

| 필요한 방식 | 권장 대상 |
| --- | --- |
| 봇이 알림을 보내고 사람은 확인만 한다 | 채널 |
| 참여자 간 대화, 질문, 봇 명령이 필요하다 | 그룹 또는 Supergroup |
| 공지와 토론을 분리해서 운영한다 | 채널 + Discussion Group |

이 글에서는 서비스 운영 알림을 일방적으로 전달하는 상황을 가정해 비공개 채널을 사용한다. 이후 절차도 모두 채널을 기준으로 설명한다.

## 4. 비공개 운영 알림 채널 만들기

알림 채널에는 배포 상태나 장애 정보가 포함될 수 있으므로 특별한 이유가 없다면 비공개로 만드는 것을 권장한다. 공개 채널은 username으로 검색될 수 있고 게시물이 외부에 노출될 수 있다.

화면 구성과 메뉴 이름은 Telegram 버전에 따라 조금씩 다를 수 있지만 기본 흐름은 같다.

### Telegram Web

1. Telegram Web에서 왼쪽 메뉴 또는 새 대화 메뉴를 연다.
2. `New Channel`을 선택한다.
3. 채널 이름을 `Example Operations Alerts`로 입력한다.
4. 채널 설명을 입력한다.

```
Operational alerts and service status updates.
```
5. 채널 유형으로 `Private Channel`을 선택한다.
6. 필요한 알림 수신자를 초대한다.

### Telegram Desktop

1. 왼쪽 위 메뉴를 연다.
2. `New Channel`을 선택한다.
3. 채널 이름과 설명을 입력한다.
4. `Private Channel`을 선택한다.
5. 필요한 알림 수신자를 초대한다.

### iPhone 또는 iPad

1. `Chats` 화면에서 오른쪽 위의 새 메시지 아이콘을 누른다.
2. `New Channel`을 선택한다.
3. 채널 이름과 설명을 입력한다.
4. 비공개 채널로 설정한다.
5. 필요한 알림 수신자를 초대한다.

### Android

1. 채팅 목록에서 새 메시지 버튼을 누른다.
2. `New Channel`을 선택한다.
3. 채널 이름과 설명을 입력한다.
4. 비공개 채널로 설정한다.
5. 필요한 알림 수신자를 초대한다.

초대 링크를 공유했다면 필요한 사람이 모두 입장한 뒤 링크를 폐기하거나 새 링크로 교체하는 것도 좋다.

## 5. 봇을 채널 관리자로 추가하기

채널에는 관리자만 게시할 수 있다. 따라서 알림용 봇을 채널 관리자로 추가하고 메시지 게시 권한을 부여해야 한다.

1. `Example Operations Alerts` 채널을 연다.
2. 상단의 채널 이름을 눌러 채널 정보 화면으로 이동한다.
3. `Administrators` 또는 `관리자`를 연다.
4. `Add Admin` 또는 `관리자 추가`를 선택한다.
5. 봇의 정확한 username을 검색해 추가한다.
6. `Post Messages` 또는 `메시지 게시` 권한을 허용한다.

알림만 보내는 봇이라면 게시 권한만으로 충분하다. 메시지를 수정하거나 삭제해야 할 때만 `Edit Messages` 또는 `Delete Messages` 권한을 추가한다. 구성원 관리나 초대 링크 관리처럼 필요하지 않은 권한은 부여하지 않는다.

## 6. 봇 토큰과 채널 Chat ID 확인하기

Telegram Bot API로 메시지를 보내려면 두 값이 필요하다.

- `TELEGRAM\_BOT\_TOKEN`: BotFather가 발급한 봇 인증 토큰
- `TELEGRAM\_NOTIFICATION\_CHAT\_ID`: 메시지를 받을 채널의 숫자 ID

공개 채널은 `@username`으로도 메시지를 보낼 수 있지만, 비공개 채널에는 숫자 Chat ID를 사용하는 것이 확실하다. 채널 Chat ID는 일반적으로 `-100`으로 시작한다.

### 6-1. 터미널에서 토큰 입력하기

토큰이 명령 기록에 그대로 남지 않도록 안전한 터미널에서 숨김 입력을 사용한다.

```
printf 'Telegram bot token: '
read -r -s TELEGRAM_BOT_TOKEN
printf '\n'
```

입력하는 동안 화면에 문자가 표시되지 않는 것이 정상이다.

### 6-2. 토큰 검증하기

다음 명령은 Bot API의 `getMe` 메서드로 현재 봇 정보를 확인한다.

```
curl --silent --show-error --config - <<EOF | jq .
url = "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"
EOF
```

성공하면 다음과 비슷한 응답이 나온다.

```
{
  "ok": true,
  "result": {
    "is_bot": true,
    "username": "example_operations_bot"
  }
}
```

`ok`가 `true`인지, `username`이 방금 만든 봇과 일치하는지 확인한다. `jq`가 없다면 명령 끝의 `| jq .`를 제거해 원본 JSON을 확인해도 된다.

### 6-3. 채널 업데이트 만들기

봇을 채널 관리자로 추가한 뒤 채널에 테스트 게시물을 하나 작성한다. 이 게시물은 Bot API의 업데이트 큐에 `channel\_post` 이벤트를 남기는 역할을 한다.

이제 다음 명령으로 최근 업데이트에서 채널 정보를 찾는다.

```
curl --silent --show-error --config - <<EOF | jq '
  .result[]
  | select(.channel_post.chat.type == "channel")
  | .channel_post.chat
  | {id, title, type}
'
url = "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
EOF
```

출력에서 방금 만든 채널 이름을 찾는다.

```
{
  "id": -1001234567890,
  "title": "Example Operations Alerts",
  "type": "channel"
}
```

여기서 `id`가 채널의 Chat ID다. 앞의 마이너스 기호까지 포함해 전체 값을 보관한다.

`jq` 없이 확인하려면 원본 응답에서 `"title":"Example Operations Alerts"`가 있는 `channel\_post.chat` 객체의 `id`를 찾는다.

```
curl --silent --show-error --config - <<EOF
url = "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates"
EOF
```

### 6-4. 업데이트가 보이지 않을 때

`result`가 빈 배열이거나 채널이 출력되지 않으면 다음 항목을 확인한다.

1. 봇이 해당 채널의 관리자로 등록되어 있는가?
2. 봇에 `Post Messages` 권한이 있는가?
3. 봇을 추가한 뒤 채널에 새 게시물을 작성했는가?
4. 확인 중인 토큰이 다른 봇의 토큰은 아닌가?

이미 webhook을 사용하는 봇이라면 `getUpdates`를 동시에 사용할 수 없다. 다음 명령으로 webhook 상태를 확인한다.

```
curl --silent --show-error --config - <<EOF | jq .
url = "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
EOF
```

응답의 `result.url`에 값이 있다면 다른 시스템이 해당 봇의 업데이트를 받고 있을 수 있다. 기존 webhook을 임의로 삭제하지 말고, 이 글의 용도에는 별도의 알림 전용 봇을 사용하는 편이 안전하다.

## 7. Bot API로 테스트 메시지 보내기

확인한 채널 Chat ID를 현재 터미널의 변수에 넣는다.

```
TELEGRAM_NOTIFICATION_CHAT_ID='-1001234567890'
```

이제 `sendMessage` 메서드로 테스트 메시지를 전송한다.

```
curl --silent --show-error \
  --request POST \
  --data-urlencode "chat_id=${TELEGRAM_NOTIFICATION_CHAT_ID}" \
  --data-urlencode 'text=✅ Telegram 운영 알림 연결 테스트가 완료되었습니다.' \
  --config - <<EOF | jq .
url = "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
EOF
```

응답의 `ok`가 `true`이고 채널에 테스트 메시지가 표시되면 Telegram 설정은 끝난 것이다.

```
{
  "ok": true
}
```

테스트가 끝나면 현재 터미널에서 변수를 제거한다.

```
unset TELEGRAM_BOT_TOKEN TELEGRAM_NOTIFICATION_CHAT_ID
```

### 자주 발생하는 오류

#### `401 Unauthorized`

토큰이 잘못되었거나 폐기된 토큰이다. BotFather에서 현재 토큰을 확인하고 다시 입력한다.

#### `400 Bad Request: chat not found`

Chat ID가 잘못되었거나 봇이 채널에 접근할 수 없다. 마이너스 기호를 포함한 전체 ID를 확인하고, 채널 관리자 목록에서 봇과 게시 권한을 다시 확인한다.

#### `403 Forbidden: bot is not a member of the channel chat`

봇이 채널 관리자가 아니거나 필요한 권한이 없다. 봇을 채널 관리자로 추가하고 `Post Messages` 권한을 허용한다.

#### 메시지는 도착하지만 휴대전화 알림이 오지 않음

Bot API 전송과 기기의 푸시 알림 설정은 별개다. 다음 항목을 확인한다.

1. 채널이 음소거되어 있지 않은가?
2. 채널의 `Notifications`가 활성화되어 있는가?
3. iOS 또는 Android에서 Telegram 알림 권한이 허용되어 있는가?
4. 집중 모드, 방해 금지 모드 또는 절전 설정이 Telegram을 막고 있지 않은가?

## 8. 토큰과 Chat ID 안전하게 보관하기

직접 전송이 성공했다면 배포 환경의 Secret Manager 또는 서버의 `.env`에 두 값을 등록한다.

```
TELEGRAM_BOT_TOKEN=실제_봇_토큰
TELEGRAM_NOTIFICATION_CHAT_ID=-1001234567890
```

실제 애플리케이션에서는 알림을 보내는 프로세스가 이 환경변수를 읽을 수 있어야 한다. 구체적인 주입 방식은 사용하는 언어, 프레임워크, 배포 환경에 맞게 선택한다.

다음 원칙을 지킨다.

- 실제 값은 문서나 `.env.example`에 넣지 않는다.
- `.env`를 Git에 커밋하지 않는다.
- 배포 로그에서 값을 출력하지 않는다.
- 토큰이 담긴 파일은 필요한 계정과 프로세스만 읽을 수 있게 한다.
- Secret Manager를 사용할 수 있다면 평문 `.env`보다 우선한다.

환경변수를 등록하는 것만으로 메시지가 자동 전송되지는 않는다. 애플리케이션 구현 시 이 값을 읽어 Bot API의 `sendMessage`를 호출한다.

## 9. 운영 중 변경과 사고 대응

### 채널 수신자를 변경할 때

채널의 구독자만 추가하거나 제거하면 된다. 채널이 그대로라면 서버 코드와 Chat ID를 변경할 필요가 없다.

### 채널 이름을 변경할 때

일반적인 이름 변경으로 Chat ID가 바뀌지는 않는다. 환경변수도 그대로 사용할 수 있다.

### 봇을 교체할 때

1. BotFather에서 새 알림용 봇을 만든다.
2. 새 봇을 채널 관리자로 추가한다.
3. 새 토큰으로 직접 전송 테스트를 한다.
4. 사용 중인 Secret Manager 또는 환경변수의 `TELEGRAM\_BOT\_TOKEN`을 교체한다.
5. 새 봇의 메시지가 정상적으로 도착하는지 확인한다.
6. 기존 봇을 채널에서 제거한다.

### 토큰이 노출되었을 때

1. BotFather에서 즉시 새 토큰을 발급한다.
2. Secret Manager와 환경변수의 토큰을 교체한다.
3. 새 토큰으로 직접 전송 테스트를 한다.
4. Git, 로그, 채팅, 티켓 또는 문서에 남은 노출 흔적을 찾아 제거한다.

## 공식 참고 문서

- [Telegram BotFather 및 봇 생성](https://core.telegram.org/bots/features#botfather)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Bot API: getUpdates](https://core.telegram.org/bots/api#getupdates)
- [Telegram Bot API: sendMessage](https://core.telegram.org/bots/api#sendmessage)
- [Telegram 그룹과 채널의 차이](https://telegram.org/faq#q-what-s-the-difference-between-groups-and-channels)
- [Telegram Channels](https://telegram.org/tour/channels)
