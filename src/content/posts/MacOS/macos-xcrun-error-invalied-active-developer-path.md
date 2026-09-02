---
title: "[MacOS] 오류 해결xcrun: error: invalied active developer path ..."
description: "xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun error: command '/usr/bin/clang' failed with exit code 1 [end of output] pip install mysqlclient 설치할 때 위와 같은 오류가 떠서 구글링을 해보니... 내가 얼마전에 Ventura로 업그레이드 했기 때문이었다. 해결 방법!! xcode-select --install 해결 후 출처 Mac 업그레이드 후 xcrun: error: invalid active develop.."
pubDate: 2022-12-01T17:12:32.000Z
category: "MacOS"
tags: []
slug: "macos-xcrun-error-invalied-active-developer-path"
sourceUrl: "https://0418.tistory.com/17"
draft: false
---
```
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools),
missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
error: command '/usr/bin/clang' failed with exit code 1
[end of output]
```

pip install mysqlclient 설치할 때 위와 같은 오류가 떠서 구글링을 해보니...

내가 얼마전에 Ventura로 업그레이드 했기 때문이었다.

해결 방법!!

```
xcode-select --install
```

해결 후

![](/images/posts/macos-xcrun-error-invalied-active-developer-path/56e722f4cf3a1f08a0f9.png)

![](/images/posts/macos-xcrun-error-invalied-active-developer-path/6f442076331308888dc4.png)

출처

[Mac 업그레이드 후 xcrun: error: invalid active developer path 에러 해결하기  MacOS 업그레이드 시 어김없이 발생하는 문제가 하나 있습니다 😫 바로 개발 관련 도구 사용 시 대다수가 발생하는 missing xcrun 에러인데요.  www.hahwul.com](https://www.hahwul.com/2019/11/18/how-to-fix-xcrun-error-after-macos-update/)
