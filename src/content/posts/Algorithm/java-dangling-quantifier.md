---
title: "[Java] Dangling quantifier '+ 오류 해결"
description: "Java에서 문자열을 특정 문자열을 기준으로 나누어서 쓸 때 \"-\", \" \", \";\" 등의 문자는 가능하지만 \"+\", \"*\"와 같이 정규표현식에 활용되는 특별한 의미가 있는 문자는 아래와 같이 Dangling quantifier 오류가 발생한다. 이러한 오류는 다음과 같이 문자임을 표시하여 해결이 가능하다.String[] tmp = str.split(\"\\\\+\");"
pubDate: 2023-03-07T08:01:42.000Z
category: "Algorithm"
tags: []
slug: "java-dangling-quantifier"
sourceUrl: "https://0418.tistory.com/22"
draft: false
---
**Java에서 문자열을 특정 문자열을 기준으로 나누어서 쓸 때**

**"-", " ", ";" 등의 문자는 가능하지만**

**"+", "\*"와 같이 정규표현식에 활용되는 특별한 의미가 있는 문자는 아래와 같이 Dangling quantifier 오류가 발생한다.**

![](/images/posts/java-dangling-quantifier/bc48d1e766012d6325cf.png)

**이러한 오류는 다음과 같이 문자임을 표시하여 해결이 가능하다.**

```
String[] tmp = str.split("\\+");
```
