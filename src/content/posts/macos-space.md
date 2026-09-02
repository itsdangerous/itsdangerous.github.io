---
title: "macOS에서 가상 데스크탑(Space) 전환 애니메이션 제거하기"
description: "macOS의 가상 데스크탑(Space)은 편하지만, 데스크탑을 옮길 때마다 화면이 미끄러지는 애니메이션이 길게 느껴질 수 있다. 이 글에서는 yabai + skhd를 이용해 현재 화면의 이전/다음 Space를 키보드로 전환하고, yabai scripting addition을 통해 전환을 빠르게 처리하는 과정을 정리한다.완료 후 사용할 단축키 예시:단축키동작Ctrl + ←현재 모니터의 이전 SpaceCtrl + →현재 모니터의 다음 Space1. 먼저, 무엇을 바꾸려는가macOS는 기본적으로 Ctrl + ←와 Ctrl + →로 Space를 바꿀 수 있다. 하지만 이 단축키는 macOS Mission Control의 기본 전환 경로를 타므로 yabai가 애니메이션 처리에 개입하지 않는다.이 글의 목표는 ma.."
pubDate: 2026-08-24T11:23:36.000Z
category: "MacOS"
tags: []
slug: "macos-space"
sourceUrl: "https://0418.tistory.com/34"
draft: false
---
macOS의 가상 데스크탑(Space)은 편하지만, 데스크탑을 옮길 때마다 화면이 미끄러지는 애니메이션이 길게 느껴질 수 있다. 이 글에서는 `yabai + skhd`를 이용해 현재 화면의 이전/다음 Space를 키보드로 전환하고, yabai scripting addition을 통해 전환을 빠르게 처리하는 과정을 정리한다.

완료 후 사용할 단축키 예시:

| 단축키 | 동작 |
| --- | --- |
| `Ctrl + ←` | 현재 모니터의 이전 Space |
| `Ctrl + →` | 현재 모니터의 다음 Space |

## 1. 먼저, 무엇을 바꾸려는가

macOS는 기본적으로 `Ctrl + ←`와 `Ctrl + →`로 Space를 바꿀 수 있다. 하지만 이 단축키는 macOS Mission Control의 기본 전환 경로를 타므로 yabai가 애니메이션 처리에 개입하지 않는다.

이 글의 목표는 macOS 기본 단축키를 없애는 것이 아니다. 같은 `Ctrl + ←/→` 입력을 skhd가 받아 yabai의 Space 포커스 명령으로 바꿔, 현재 모니터 안에서 더 빠르게 전환하는 것이다.

## 2. 이때 yabai와 skhd가 각각 하는 일

yabai는 원래 macOS용 타일링 창 관리자다. 창 자동 배치, 창 크기·위치 변경, Space 생성·이동, 다중 모니터 제어 등을 지원한다. 이 글에서는 그중 **기존 창 배치는 유지한 채 Space 포커스만 빠르게 전환하는 기능**만 사용한다.

skhd는 전역 키보드 단축키 데몬이다. 키 입력을 감지해 shell 명령을 실행하지만, 창과 Space를 직접 제어하지는 않는다.

| 도구 | 역할 | 이 글에서 하는 일 |
| --- | --- | --- |
| **yabai** | macOS 창·Space·디스플레이를 제어 | 이전/다음 Space를 실제로 포커스하고 scripting addition을 로드 |
| **skhd** | 전역 키보드 단축키를 감지하고 명령을 실행 | `Ctrl + ←/→`를 받아 yabai 명령을 실행 |

```
Ctrl + ← / →
↓
skhd: 전역 단축키 감지
↓
focus-space-on-current-display.sh
↓
yabai: 현재 모니터의 Space를 포커스
```

즉 skhd는 “키를 듣는 리모컨”이고, yabai는 “창과 Space를 움직이는 엔진”이다. 둘을 함께 써야 원하는 키를 원하는 창 관리 동작에 연결할 수 있다.

이번 글에서 타일링 설정을 따로 켜지 않는다. yabai의 기본 Space 레이아웃은 `float`이므로, 아래 설정만으로 기존 macOS 창 배치가 자동 타일링으로 바뀌지는 않는다. 타일링·창 이동·창 크기 조절은 같은 도구의 별도 기능으로, 필요할 때 이어서 설정할 수 있다.

## 3. 시작 전 macOS 설정

시스템 설정 → **데스크탑 및 Dock** → **Mission Control**에서 다음을 확인한다.

- **디스플레이마다 별도의 Space**: 켬
- **최근 사용 순으로 Space 자동 재정렬**: 끔

Sonoma 이후에는 Desktop & Stage Manager의 다음 옵션도 권장한다.

- **데스크탑에서 항목 보기**: 켬
- **배경화면을 클릭하여 데스크탑 보기**: `Stage Manager에서만`

## 4. yabai와 skhd 설치

Homebrew가 없다면 [Homebrew 공식 사이트](https://brew.sh)에서 먼저 설치한다.

```
brew install asmvik/formulae/yabai asmvik/formulae/skhd jq
```

`jq`는 yabai가 반환하는 JSON에서 현재 모니터의 Space 목록을 고르는 데 사용한다.

서비스를 시작한다.

```
yabai --start-service
skhd --start-service
```

시스템 설정 → **개인정보 보호 및 보안** → **손쉬운 사용**에서 yabai와 skhd를 허용한다.

Apple Silicon + Homebrew의 일반 경로:

```
/opt/homebrew/bin/yabai
/opt/homebrew/bin/skhd
```

실제 경로는 다음으로 확인한다.

```
command -v yabai
command -v skhd
```

권한을 허용했다면 서비스를 재시작한다.

```
yabai --restart-service
skhd --restart-service
```

## 5. Recovery Mode에서 SIP 부분 해제하기

### 왜 필요한가

yabai는 scripting addition을 통해 Dock의 창 서버 기능을 활용한다. 이 추가 기능은 Space/창 제어를 더 안정적으로 처리하지만, SIP가 완전히 켜진 상태에서는 사용할 수 없다.

이는 보안상 중요한 선택이다. 회사 정책이 적용된 기기, 관리형 기기, 보안 설정을 변경할 권한이 없는 기기에서는 여기서 멈추는 편이 낫다.

### Recovery Mode 진입

1. Mac을 종료한다.
2. **Apple Silicon**: 전원 버튼을 길게 눌러 `시동 옵션 로딩 중`이 보일 때까지 기다린다. **옵션** → **계속**을 선택한다.
3. **Intel Mac**: 전원을 켠 직후 `Command + R`을 누른 채 부팅한다.
4. 상단 메뉴에서 **유틸리티(Utilities)** → **터미널**을 연다.

### 자신의 환경에 맞는 명령 하나만 실행

#### Apple Silicon, macOS 13 이상

```
csrutil enable --without fs --without debug --without nvram
```

#### Apple Silicon, macOS 12

```
csrutil disable --with kext --with dtrace --with basesystem
```

#### Intel, macOS 11 이상

```
csrutil disable --with kext --with dtrace --with nvram --with basesystem
```

재시동 후 Apple Silicon에서는 일반 macOS 터미널에서 아래를 실행하고 한 번 더 재시동한다.

```
sudo nvram boot-args=-arm64e_preview_abi
```

상태 확인:

```
csrutil status
```

부분 해제 상태는 macOS 버전에 따라 `disabled` 또는 `unknown`으로 표시될 수 있다.

> 원상 복구가 필요하면 Recovery Mode로 돌아가 `csrutil enable`을 실행하고 재시동한다.

## 6. scripting addition을 안전하게 로드하기

scripting addition 로드는 root 권한이 필요하다. 대신 현재 yabai 바이너리의 `--load-sa` 명령 하나만 허용하도록 sudoers 규칙을 제한한다.

### 5-1. yabai 경로와 SHA-256 확인

```
YABAI_BIN="$(command -v yabai)"
shasum -a 256 "$YABAI_BIN"
```

### 5-2. sudoers 규칙 추가

```
sudo visudo -f /private/etc/sudoers.d/yabai
```

열린 파일에 다음 한 줄을 넣는다. 각 값은 자신의 환경에 맞춰 바꾼다.

```
<사용자명> ALL=(root) NOPASSWD: sha256:<SHA256> <yabai-경로> --load-sa
```

예를 들어 `\<SHA256\>`에는 `shasum` 결과의 첫 번째 값을 넣는다. `visudo`는 기본적으로 vim을 열며, 문법 오류가 있으면 잘못된 sudoers 파일이 저장되지 않도록 검사한다.

### 5-3. yabairc 만들기

```
mkdir -p ~/.config/yabai ~/.config/skhd
vim ~/.config/yabai/yabairc
```

`/opt/homebrew/bin/yabai`는 `command -v yabai` 결과로 바꾼다.

```
#!/bin/sh

sudo /opt/homebrew/bin/yabai --load-sa
yabai -m signal --add label="load_scripting_addition" \
event=dock_did_restart action="sudo /opt/homebrew/bin/yabai --load-sa"
```

```
chmod +x ~/.config/yabai/yabairc
yabai --restart-service
```

## 7. 현재 모니터 안에서만 이전/다음 Space 고르기

`yabai -m space --focus prev`를 그대로 쓰면 다중 모니터 환경에서는 전체 Space 순서를 따라갈 수 있다. 아래 스크립트는 **현재 포커스된 모니터에 속한 Space만** 조회한다.

```
vim ~/.config/yabai/focus-space-on-current-display.sh
```

```
#!/bin/sh

PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
target="$1"
spaces="$(yabai -m query --spaces --display)"

case "$target" in
prev)
space_id="$(printf '%s\n' "$spaces" | jq -r \
'to_entries | (map(select(.value["has-focus"]))[0].key) as $i | if $i > 0 then .[($i - 1)].value.index else empty end')"
;;
next)
space_id="$(printf '%s\n' "$spaces" | jq -r \
'to_entries | (map(select(.value["has-focus"]))[0].key) as $i | .[($i + 1)].value.index // empty')"
;;
*)
exit 2
;;
esac

[ -n "$space_id" ] && yabai -m space --focus "$space_id"
```

```
chmod +x ~/.config/yabai/focus-space-on-current-display.sh
```

첫 번째 Space에서 이전 키를 누르거나 마지막 Space에서 다음 키를 누르면 아무 동작도 하지 않는다.

## 8. skhd 단축키 연결

```
vim ~/.config/skhd/skhdrc
```

```
# 이전/다음 Space: Ctrl + ← / →
ctrl - left : ~/.config/yabai/focus-space-on-current-display.sh prev
ctrl - right : ~/.config/yabai/focus-space-on-current-display.sh next
```

이 설정을 적용하면 `Ctrl + ←/→`는 macOS 기본 Mission Control 전환이 아니라 skhd → yabai 경로로 처리된다.

반영:

```
skhd --restart-service
```

## 9. 재부팅·업데이트 후 확인할 것

한 번 `--start-service`로 시작한 yabai와 skhd는 LaunchAgent로 등록되어 로그인 뒤 자동 시작한다.

```
launchctl list | rg 'yabai|skhd'
```

다만 `brew upgrade yabai`를 실행하면 yabai 바이너리 해시가 바뀐다. 그러면 sudoers에 넣은 SHA-256 규칙도 새 버전에 맞게 갱신해야 scripting addition이 다시 로드된다.

문제가 생기면 다음 로그부터 확인한다.

```
tail -50 /tmp/yabai_$USER.err.log
tail -50 /tmp/skhd_$USER.err.log
```

## 참고 자료

- [yabai: SIP 부분 해제 공식 안내](https://github.com/asmvik/yabai/wiki/Disabling-System-Integrity-Protection)
- [yabai: 설치 및 scripting addition 공식 안내](https://github.com/asmvik/yabai/wiki/Installing-yabai-(latest-release))
- [skhd 공식 README](https://github.com/asmvik/skhd)
- [Apple 지원: 여러 Space 사용하기](https://support.apple.com/guide/mac-help/work-in-multiple-spaces-mh14112/mac)
