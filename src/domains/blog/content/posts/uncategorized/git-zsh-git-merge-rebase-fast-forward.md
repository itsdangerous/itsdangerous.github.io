---
title: "[git | zsh] Git merge와 rebase 그리고 fast forward"
description: "Git merge, fast-forward, rebase의 관계와 브랜치 이력이 달라지는 원리를 예시로 설명"
pubDate: 2026-03-11T17:49:20.000Z
category: "uncategorized"
tags: []
slug: "git-zsh-git-merge-rebase-fast-forward"
draft: false
---
Git을 사용하다 보면 `merge`, `fast-forward`, `rebase` 를 자주 사용하게되는데요

처음 Git을 배울 때는 다음과 같은 질문이 자연스럽게 생깁니다.

- merge는 단순히 브랜치를 합치는 것 아닌가?
- fast-forward는 왜 어떤 경우에만 발생할까?
- merge commit은 왜 어떤 경우에만 생성될까?
- rebase는 merge와 무엇이 다른가?

이 글에서는 단순한 명령어 사용법이 아니라 **Git이 내부적으로 어떤 기준으로 동작하는지**를 기준으로 정리해보겠습니다.

## Git에서 브랜치는 무엇인가

Git을 이해할 때 가장 중요한 개념 중 하나는 **브랜치는 복사본이 아니라 특정 commit을 가리키는 포인터**라는 점입니다.

예를 들어 다음과 같은 상태가 있다고 가정해보겠습니다.

```
 A --- B --- C (main)
```

여기서 `main` 브랜치는 commit `C`를 가리키는 포인터입니다.

이 상태에서 새로운 브랜치 `feature`를 만들면 다음과 같습니다.

```
 A --- B --- C (main, feature)
```

처음에는 두 브랜치가 같은 commit을 가리킵니다.

이후 feature 브랜치에서 commit이 추가되면 다음과 같이 그래프가 분기됩니다.

```
 A --- B --- C (main)
                         \
                            D --- E (feature)
```

즉 브랜치가 분기된다는 것은 파일이 복사되는 것이 아니라 **commit 그래프가 분기되는 것**입니다.

## git merge는 내부적으로 무엇을 하는가

`git merge`는 단순히 브랜치를 합치는 명령이 아니라 다음 과정을 수행합니다.

- 두 브랜치의 공통 조상(common ancestor)을 찾는다
- 각 브랜치에서 변경된 내용을 계산한다
- merge 결과를 commit으로 기록한다

하지만 Git은 항상 새로운 commit을 생성하지는 않습니다.

merge를 할 때 Git은 먼저 다음 질문을 합니다.

**현재 브랜치의 HEAD가 병합 대상 브랜치의 조상인가?**

이 조건에 따라 **fast-forward merge** 또는 **merge commit**이 결정됩니다.

## fast-forward merge

다음 commit 그래프를 보겠습니다.

```
 A --- B --- C (main)
                         \ 
                            D --- E (feature)
```

현재 상태

- main → C
- feature → E

이 상태에서 다음 명령을 실행합니다.

```
 git checkout main
 git merge feature
```

Git은 먼저 다음을 확인합니다.

**C가 E의 조상인가?**

commit 관계는 다음과 같습니다.

```
 E | D | C | B | A
```

즉 C는 E의 조상입니다.

이 경우 Git은 새로운 merge commit을 만들 필요가 없습니다.

브랜치 포인터만 이동하면 되기 때문입니다.

```
 A --- B --- C --- D --- E (main, feature)
```

이 동작을 **fast-forward**라고 합니다.

즉 fast-forward merge는 **새로운 commit이 생성되지 않고 브랜치 포인터만 이동하는 merge**입니다.

## merge commit이 생성되는 경우

이번에는 다음 상태를 보겠습니다.

```
 A --- B --- C --- F (main)
                        \
                          D --- E (feature)
```

현재 상태

- main → F
- feature → E

이 상태에서 merge를 실행하면

```
 git checkout main
 git merge feature
```

Git은 다음을 검사합니다.

**F가 E의 조상인가?**

하지만 commit 관계는 다음과 같습니다.

```
 E --- D --- C --- B --- A
 F --- C --- B --- A
```

즉 F는 E의 조상이 아닙니다.

이 경우 Git은 두 히스토리를 연결하기 위해 새로운 commit을 생성합니다.

```
A --- B --- C -------- M   (main)
                        \              /
                          D --- E   (feature)
```

이 commit이 바로 **merge commit**입니다.

merge commit의 특징은 부모(parent)가 두 개라는 것입니다.

- 첫 번째 부모 → 기존 main의 HEAD
- 두 번째 부모 → 병합 대상 브랜치

## --no-ff 옵션

Git은 기본적으로 fast-forward가 가능하면 merge commit을 만들지 않습니다.

하지만 어떤 팀에서는 **기능 단위 merge 기록을 명확히 남기기 위해** 항상 merge commit을 남기기도 합니다.

이때 사용하는 옵션이 `--no-ff` 입니다.

```
 git merge --no-ff feature
```

이 옵션을 사용하면 fast-forward가 가능한 상황에서도 merge commit이 생성됩니다.

```
A --- B --- C -------- M   (main)
                        \             /
                          D --- E   (feature)
```

이렇게 하면 **어떤 브랜치가 언제 merge되었는지**를 히스토리에서 쉽게 확인할 수 있습니다.

## git rebase는 무엇이 다른가

`git rebase`는 merge처럼 히스토리를 연결하는 방식이 아니라 **commit을 다른 기준 위에 다시 적용하는 방식**입니다.

예를 들어 다음 상태에서

```
 A --- B --- C --- F (main)
                         \ 
                           D --- E (feature)
```

다음 명령을 실행하면

```
 git rebase main
```

feature 브랜치의 commit이 main 위로 재배치됩니다.

```
 A --- B --- C --- F --- D' --- E'
```

여기서 `D'`, `E'`는 기존 commit을 복사해서 다시 만든 **새로운 commit**입니다.

그래서 rebase는 히스토리를 직선 구조로 만들 수 있지만 **commit hash가 변경됩니다.**

단, rebase는 **히스토리를 재작성(history rewrite)** 하는 작업이기 때문에, 이미 원격 저장소에 push한 commit에 대해서는 사용하지 않는 것이 좋습니다.

## 정리

- **fast-forward merge**
브랜치 포인터만 이동하며 새로운 commit이 생성되지 않는다.
- **merge commit**
두 브랜치 히스토리가 분기된 경우 새로운 commit을 만들어 연결한다.
- **--no-ff**
fast-forward가 가능해도 merge commit을 강제로 생성한다.
- **rebase**
commit을 다른 기준 위에 다시 적용하여 히스토리를 직선 구조로 만든다.
