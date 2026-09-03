---
title: "[Python | Django] makemigrations 오류 해결"
description: "Django makemigrations 실행 중 mysqlclient 설치 오류가 발생할 때 필요한 개발 패키지와 해결 명령어를 정리"
pubDate: 2022-11-30T07:46:42.000Z
category: "Study"
tags: []
slug: "python-django-makemigrations"
draft: false
---
python manage.py makemigrations를 하니... mysqlclient가 없어서 안된다나 머라나

그래서 pip install mysqlclient를 했더니 설치가 안된다드라

구글링 결과

다음을 하니 해결이 되었다....

```
sudo apt-get update
sudo apt-get install python3.10-dev libmysqlclient-dev gcc # python 버전에 맞게 쓰세요
pip install mysqlclient
```
