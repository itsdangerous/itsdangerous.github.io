---
title: "[Mac] 디스크 용량 확보 - Spotlight index"
description: "macOS 시스템 데이터가 비정상적으로 커졌을 때 Spotlight 인덱스를 점검하고 디스크 공간을 확보하는 방법을 정리"
pubDate: 2026-03-31T02:22:34.000Z
category: "uncategorized"
tags: []
slug: "mac-spotlight-index"
draft: false
---
## 1. 문제 상황

어느 날 저장 공간을 보니 `시스템 데이터`가 **약 300GB** 가까이 차지하고 있었다.

처음에는 개발 환경 때문에 당연히 Docker를 의심했다. 하지만 Docker 관련 디렉터리를 확인해도 결정적인 수치는 나오지 않았고, 다른 원인을 추적해야 했다.

## 2. 처음 의심했던 것들

시스템 데이터가 갑자기 커졌을 때 흔히 의심하는 후보는 대체로 비슷하다.

- Docker Desktop 디스크 이미지
- Time Machine 로컬 스냅샷
- iPhone/iPad 로컬 백업
- Xcode / Simulator / DerivedData
- 대형 캐시, 로그, 임시 파일

Apple도 저장 공간 설정에서 카테고리별 사용량과 추천 정리를 확인할 수 있다고 안내한다. 다만 `시스템 데이터`는 이름 그대로 범위가 넓어서, 실제 범인은 전혀 다른 곳일 수 있다.

## 3. 내가 실제로 확인한 항목들

먼저 아래 항목들을 순서대로 점검했다.

Time Machine 로컬 스냅샷

```
tmutil listlocalsnapshots /
```

결과는 비어 있었다. 즉, 로컬 스냅샷이 원인은 아니었다.

### 3-1. iPhone / iPad 로컬 백업

```
du -sh ~/Library/Application\ Support/MobileSync/Backup 2>/dev/null
```

결과는 `0B`였다. 아이폰 로컬 백업도 아니었다.

### 3-2. Xcode / CoreSimulator

```
du -sh ~/Library/Developer/Xcode 2>/dev/null
du -sh ~/Library/Developer/CoreSimulator 2>/dev/null
```

사실상 큰 수치가 잡히지 않았다. Xcode 쪽도 주범은 아니었다.

### 3-3. 사용자 Library 전체 크기

```
du -xhd 1 ~/Library 2>/dev/null | sort -h
```

여기서 확인된 주요 수치는 대략 이랬다.

- `~/Library/Containers` : **25G**
- `~/Library/Application Support` : **8.0G**
- `~/Library/Caches` : **888M**
- `~/Library` 전체 : **39G**

즉, 사용자 홈 아래의 Library는 어느 정도 크긴 했지만, **시스템 데이터 300GB급 폭증을 설명할 정도는 아니었다.**

## 4. 원인: Spotlight

결정적인 단서는 이 명령에서 나왔다.

```
sudo du -xhd 1 /System/Volumes/Data 2>/dev/null | sort -h
```

당시 결과의 핵심은 아래와 같았다.

![](/images/posts/mac-spotlight-index/7e59a979bafbc62eccfd.png)

이 시점에서 거의 확신할 수 있었다. 내 맥에서 시스템 데이터를 비정상적으로 부풀린 건 Docker가 아니라 **Spotlight 인덱스 데이터**였다.

## 5. 왜 이게 중요했나

Apple 문서를 보면, macOS의 시작 디스크는 보통 APFS 볼륨 그룹으로 구성되고, **시스템용 볼륨(Macintosh HD)** 과 **데이터용 볼륨(Macintosh HD - Data)** 으로 나뉜다. 즉 `/System/Volumes/Data`는 정리 대상 폴더 하나가 아니라, **실제 쓰기 가능한 데이터 볼륨 전체**에 가깝다.

그래서 `/System/Volumes/Data`가 크다고 해서 그 폴더를 지우는 식으로 접근하면 안 된다. 그 안에서 **어떤 하위 항목이 비정상적으로 큰지** 찾아야 한다.

## 6. 해결 방법: Apple 공식 방식대로 Spotlight 인덱스 재구성

(참고: [https://support.apple.com/en-us/102321)](https://support.apple.com/en-us/102321)

이 문제는 `.Spotlight-V100` 폴더를 수동으로 지우기보다, **Apple이 안내하는 Spotlight 재인덱싱 방법**으로 해결하는 게 안전하다.

1. **시스템 설정** 열기
2. **Spotlight** 이동
3. **검색 개인정보 보호(Search Privacy)** 또는 **Spotlight Privacy** 열기
4. 시작 디스크(`Macintosh HD` 등)를 목록에 **추가**
5. 몇 초 기다린 뒤, 방금 추가한 디스크를 다시 **제거**
6. Spotlight가 해당 디스크를 다시 인덱싱하도록 둔다

Apple은 이 절차를 통해 Spotlight 인덱스를 다시 구성할 수 있다고 안내한다. 또한 **재인덱싱에는 시간이 걸릴 수 있고**, 그동안 Spotlight 창 상단에 인덱싱 진행 표시가 나타날 수 있다고 설명한다.

---

## 7. 재인덱싱 후 결과

다음 명령 재실행

```
sudo du -xhd 1 /System/Volumes/Data 2>/dev/null | sort -h
```

결과는 확연히 달라졌다.

![](/images/posts/mac-spotlight-index/a090c8377f6316a02070.png)

## 8. 참고 자료

- Apple Support, **Mac에서 Spotlight 인덱스 재구성하기**
[https://support.apple.com/ko-kr/102321](https://support.apple.com/ko-kr/102321)
- Apple Support, **Mac에서 저장 공간 확보하기**
[https://support.apple.com/ko-kr/102624](https://support.apple.com/ko-kr/102624)
- Apple Disk Utility Guide, **APFS 볼륨 추가, 삭제 또는 지우기**
[https://support.apple.com/guide/disk-utility/add-delete-or-erase-apfs-volumes-dskua9e6a110/mac](https://support.apple.com/guide/disk-utility/add-delete-or-erase-apfs-volumes-dskua9e6a110/mac)
- Apple Mac Help, **Mac에서 저장 공간 설정 변경하기**
[https://support.apple.com/guide/mac-help/change-storage-settings-mchl3d437fbc/mac](https://support.apple.com/guide/mac-help/change-storage-settings-mchl3d437fbc/mac)
- Apple Mac Help, **Mac에서 사용 중인 저장 공간 및 사용 가능한 저장 공간 보기**
[https://support.apple.com/guide/mac-help/storage-space-mac-syspf9b375b9/mac](https://support.apple.com/guide/mac-help/storage-space-mac-syspf9b375b9/mac)
