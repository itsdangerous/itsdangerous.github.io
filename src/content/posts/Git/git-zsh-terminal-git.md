---
title: "[git | zsh] terminal git 명령어"
description: "저는 VSCode의 Git Tool을 사용하는 것보다 terminal에서 git을 사용하는 것이 더 편합니다.그래서 평소에 자주 사용하는 git 명령어들을 정리해 보았습니다.Staging 관리git add는 현재 작업 디렉터리의 변경사항을 스테이징 영역(Staging Area) 에 추가하는 명령어입니다.보통은 아래처럼 사용합니다.git add 파일명하지만 -i 옵션을 사용하면 interactive 모드로 실행됩니다.git add -i이 모드에서는 대화형으로 파일을 선택하면서 스테이징을 관리할 수 있습니다.interactive 모드 메뉴git add -i를 실행하면 스테이징되지 않은 파일 목록을 먼저 보여주고이후 다음과 같은 메뉴가 나타납니다.명령어 설명status현재 staged / unstaged 상태.."
pubDate: 2026-02-20T09:08:09.000Z
category: "Git"
tags: ["github","Push"]
slug: "git-zsh-terminal-git"
sourceUrl: "https://0418.tistory.com/4"
draft: false
---
저는 VSCode의 Git Tool을 사용하는 것보다 terminal에서 git을 사용하는 것이 더 편합니다.

그래서 평소에 자주 사용하는 git 명령어들을 정리해 보았습니다.

## Staging 관리

git add는 현재 작업 디렉터리의 변경사항을 **스테이징 영역(Staging Area)** 에 추가하는 명령어입니다.

보통은 아래처럼 사용합니다.

```
git add 파일명
```

하지만 -i 옵션을 사용하면 **interactive 모드**로 실행됩니다.

```
git add -i
```

이 모드에서는 대화형으로 파일을 선택하면서 스테이징을 관리할 수 있습니다.

### interactive 모드 메뉴

![](/images/posts/git-zsh-terminal-git/f49ac4ba26e01dcc6574.png)

git add -i를 실행하면 스테이징되지 않은 파일 목록을 먼저 보여주고 이후 다음과 같은 메뉴가 나타납니다.

명령어 설명

| status | 현재 staged / unstaged 상태 확인 |
| --- | --- |
| update | 수정된 파일을 스테이징 |
| revert | 스테이징된 파일을 unstaging |
| add untracked | 새로 생성된 파일을 스테이징 |
| patch | 변경된 코드 중 일부만 선택적으로 스테이징 |
| diff | staged / unstaged 변경사항 비교 |
| quit | interactive 모드 종료 |
| help | 도움말 |

특히 **patch 기능**이 매우 유용합니다.

```
git add -p
```

**git add -p** 는 파일 전체를 한 번에 스테이징하는 것이 아니라, **변경된 코드 일부만 선택해서 스테이징**할 수 있게 해줍니다.

즉, 하나의 파일 안에 여러 수정이 섞여 있어도 원하는 부분만 골라서 커밋할 수 있습니다.

### patch가 유용한 이유

실제로 작업하다 보면 하나의 파일에서 아래와 같은 수정이 섞이는 경우가 많습니다.

- 버그 수정
- 리팩토링
- 디버깅용 출력 코드 추가
- 주석 정리

이런 상태에서 그냥 `git add 파일명` 을 하면 모든 변경이 한 번에 스테이징됩니다.

하지만 **git add -p** 를 사용하면 의미 있는 변경만 따로 골라서 커밋할 수 있습니다.

### 실행 예시

```
git add -p
```

실행하면 Git이 변경 내용을 **hunk 단위**로 보여주고, 각 덩어리를 스테이징할지 묻게 됩니다.

```
diff --git a/app.py b/app.py
@@ -10,6 +10,7 @@
 def login():
     user = request.user
+    print(user)

Stage this hunk [y,n,q,a,d,e,?]?
```

여기서 입력하는 문자에 따라 동작이 달라집니다.

| y | 현재 hunk를 스테이징 |
| --- | --- |
| n | 현재 hunk를 스테이징하지 않음 |
| q | patch 모드 종료 |
| a | 현재 파일의 남은 hunk를 모두 스테이징 |
| d | 현재 파일의 남은 hunk를 모두 스테이징하지 않음 |
| e | 패치를 직접 편집해서 선택적으로 반영 |
| ? | 도움말 보기 |

### 실무에서 좋은 점

예를 들어 한 파일에 아래와 같은 수정이 함께 들어갔다고 가정해보겠습니다.

```
# 버그 수정
if user is None:
    return redirect("/login")

# 디버그 코드
print(user)

# 리팩토링
user_name = user.name
```

이 상태에서 전체를 한 번에 커밋하면, 나중에 커밋 로그를 볼 때 의도가 모호해질 수 있습니다.

반면 **git add -p** 를 사용하면:

- 버그 수정만 먼저 스테이징해서 커밋하고
- 리팩토링은 다음 커밋으로 분리하고
- 디버그 코드는 제외하는 식으로

커밋을 훨씬 깔끔하게 관리할 수 있습니다.

### 개인적으로 느끼는 장점

- 커밋 메시지를 더 명확하게 쓸 수 있습니다.
- 코드 리뷰할 때 변경 의도를 파악하기 쉬워집니다.
- 나중에 `git log` 를 봤을 때 기록이 훨씬 깔끔합니다.
- 실수로 디버그 코드까지 같이 커밋하는 일을 줄일 수 있습니다.

특히 협업할 때는 **작은 단위로 잘 정리된 커밋**이 정말 큰 차이를 만듭니다.

## **Log 확인**

제가 자주 사용하는 git log 옵션입니다.

```
git log --oneline --graph --decorate=short \
  --date=format:"%Y-%m-%d %H:%M" \
  --pretty=format:"%C(yellow)%h %C(cyan)%ad %C(green)%an %C(reset)%s %C(auto)%d"
```

이 명령어는 커밋 로그를 그래프 형태 + 색상 표시로 출력해줍니다.

### 옵션 설명

| oneline | 커밋을 한 줄로 출력 |
| --- | --- |
| graph | 브랜치 구조를 그래프로 표시 |
| decorate | branch / tag / HEAD 정보 표시 |
| date | 날짜 포맷 지정 |
| pretty | 출력 형식 커스터마이징 |

출력 형식은 다음과 같습니다.

- 커밋 해시
- 커밋 날짜
- 작성자
- 커밋 메시지
- 브랜치 정보

### Alias 등록

이 명령어는 길기 때문에 저는 alias로 등록해서 사용합니다.

```
echo "alias glg='git log --graph --decorate=short --date=format:\"%Y-%m-%d %H:%M\" --pretty=format:\"%C(yellow)%h %C(cyan)%ad %C(green)%an %C(reset)%s %C(auto)%d\"'" >> ~/.zshrc
```

적용

```
source ~/.zshrc
```

이제 아래 명령어로 바로 사용할 수 있습니다.

```
glg
```

## 기타 자주 사용하는 명령어

### Commit

```
git commit -m "message"
```

### Stash

작업 중인 변경사항을 **임시로 보관할 때** 사용합니다.

- `git stash`: 현재 변경사항 임시 저장
- `git stash -u`: untracked 파일 포함 stash
- `git stash pop`: stash 적용 후 제거
- `git stash pop stash@\{n\}`: 특정 stash 적용
- `git stash drop`: stash 삭제
- `git stash clear`: 모든 stash 삭제

## 마무리

터미널에서 git을 사용하면 **조금 더 세밀하게 작업을 관리할 수 있어서 개인적으로 선호합니다.**

앞으로도 자주 사용하는 git 명령어가 생기면 계속 추가로 정리해 볼 예정입니다.
