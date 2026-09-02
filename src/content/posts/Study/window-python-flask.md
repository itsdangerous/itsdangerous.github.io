---
title: "[Window | Python] 윈도우에서 Flask로 표정 에측 서버 만들기"
description: "Windows에서 Flask와 얼굴 표정 인식을 이용해 감정 예측 테스트 서버를 만든 경험을 소개"
pubDate: 2023-07-15T17:40:24.000Z
category: "Study"
tags: ["flask","window","감정","비디오","얼굴","이미지","인식","표정","화상"]
slug: "window-python-flask"
draft: false
---
## 23.7.16(일)

현재 나는 웃참 대결 프로젝트를 진행중에 있다.

1:1 랜덤 화상 매칭을 통해 먼저 웃은 사람이 지는 프로젝트이다.

지금은 프로젝트 기획단계이지만, 표정 예측 서버는 미리 만들어놓으면 좋을 것 같아서 테스트겸 만들어보았다.

**지금 만든 테스트 서버의 목적**은 **얼굴 이미지를 입력받으면 표정 인식을 통해 감정 예측결과를 나타내 주는 것**이다.

테스트 방법은 아래 깃허브에 정리해 두었다.

[GitHub - itsdangerous/emotion-predict: Flask를 활용한 표정 예측 서버  Flask를 활용한 표정 예측 서버. Contribute to itsdangerous/emotion-predict development by creating an account on GitHub.  github.com](https://github.com/itsdangerous/emotion-predict)
