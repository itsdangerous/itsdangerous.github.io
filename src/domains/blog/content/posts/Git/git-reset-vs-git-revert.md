---
title: "git reset vs git revert 차이"
description: "Git reset과 revert의 동작 차이와 커밋 기록에 미치는 영향을 비교하고, 상황별 안전한 사용법을 설명"
pubDate: 2026-03-11T04:42:48.000Z
category: "Git"
tags: []
slug: "git-reset-vs-git-revert"
draft: false
---
Git을 사용하다 보면 이전 커밋을 되돌려야 하는 상황이 종종 발생합니다.

이때 많이 사용되는 명령어가 `git reset`과 `git revert`입니다.

두 명령어 모두 커밋을 되돌린다는 점에서는 비슷해 보이지만, 실제 동작 방식은 꽤 다릅니다.

## git reset

`git reset`은 커밋 기록 자체를 이전 상태로 되돌리는 명령어입니다.

예를 들어 가장 최근 커밋 하나를 삭제하고 싶다면 다음과 같이 사용할 수 있습니다.

```
git reset --hard HEAD~1
```

위 명령어는 현재 HEAD 기준으로 한 단계 이전 커밋 상태로 돌아가게 합니다.

### 특징

- 커밋 기록 자체가 사라집니다.
- Git 히스토리가 변경됩니다.
- 이미 push된 커밋에 사용하면 문제가 발생할 수 있습니다.

예를 들어 현재 커밋 상태가 아래와 같다고 가정해 보겠습니다.

```
A → B → C (현재)
```

이 상태에서 reset을 실행하면 다음과 같이 됩니다.

```
A → B
```

즉, C 커밋이 완전히 삭제됩니다.

## git revert

`git revert`는 기존 커밋을 삭제하는 것이 아니라, 해당 커밋을 취소하는 새로운 커밋을 생성합니다.

```
git revert HEAD
```

위 명령어는 가장 최근 커밋을 되돌리는 새로운 커밋을 추가합니다.

### 특징

- 기존 커밋 기록이 그대로 유지됩니다.
- 되돌리는 내용의 새로운 커밋이 생성됩니다.
- 협업 환경에서 비교적 안전하게 사용할 수 있습니다.

예를 들어 현재 커밋 상태가 다음과 같다면

```
A → B → C
```

revert를 실행하면 다음과 같이 됩니다.

```
A → B → C → D (revert C)
```

C 커밋 자체는 그대로 남아 있고, C의 변경사항을 되돌리는 커밋 D가 추가됩니다.

## reset vs revert 정리

| 명령어 | 동작 방식 |
| --- | --- |
| `git reset` | 커밋 기록 자체를 이전 상태로 되돌림 |
| `git revert` | 기존 커밋을 취소하는 새로운 커밋 생성 |

## 언제 무엇을 사용해야 할까

**개인 작업 중이고 아직 push하지 않았다면**

`git reset`을 사용해도 괜찮습니다.

**이미 push된 커밋이거나 협업 중이라면**

히스토리를 유지할 수 있는 `git revert`를 사용하는 것이 더 안전합니다.

## 정리

- `git reset` → 커밋 기록 자체를 되돌립니다.
- `git revert` → 되돌리는 커밋을 새로 생성합니다.
- 협업 환경에서는 보통 `git revert` 사용이 권장됩니다.

## 참고

- [git reset 공식 문서](https://git-scm.com/docs/git-reset)
- [git revert 공식 문서](https://git-scm.com/docs/git-revert)
