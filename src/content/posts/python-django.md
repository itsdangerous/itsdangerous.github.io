---
title: "[Python | Django] 파이썬 장고 설치 (가상환경)"
description: "2022.11.22 - [Study & 교육] - [Python | 가상환경] 파이썬 가상환경 venv 사용 [Python | 가상환경] 파이썬 가상환경 venv 사용프로젝트 마다 버전을 관리하기 위해서 가상환경을 사용합니다. python의 가상환경으로는 크게 2가지가 있습니다. 1. virtualenv 2. venv 먼저, virtualenv는 python3에서도 사용할 수 있지만... python2 버전에0418.tistory.com 여기서 가상환경 세팅에 대해 다뤘으니 가상환경 위에서 Django 프로젝트를 생성해보도록 하겠습니다. 먼저, 가상환경을 설치한 디렉토리에 들어가서 pip install django를 입력하여 장고를 설치해줍니다. 만약 pip 버전이 낮아 설치가 안된다면, 다음과 같이 .."
pubDate: 2022-11-22T05:57:31.000Z
category: "Study"
tags: ["Django","mysql","python"]
slug: "python-django"
sourceUrl: "https://0418.tistory.com/9"
draft: false
---
[2022.11.22 - \[Study & 교육\] - \[Python | 가상환경\] 파이썬 가상환경 venv 사용](https://0418.tistory.com/8)

[\[Python | 가상환경\] 파이썬 가상환경 venv 사용 프로젝트 마다 버전을 관리하기 위해서 가상환경을 사용합니다. python의 가상환경으로는 크게 2가지가 있습니다. 1. virtualenv 2. venv 먼저, virtualenv는 python3에서도 사용할 수 있지만... python2 버전에 0418.tistory.com](https://0418.tistory.com/8) 여기서 가상환경 세팅에 대해 다뤘으니

가상환경 위에서 Django 프로젝트를 생성해보도록 하겠습니다.

먼저, 가상환경을 설치한 디렉토리에 들어가서

```
pip install django
```

를 입력하여 장고를 설치해줍니다.

만약 pip 버전이 낮아 설치가 안된다면, 다음과 같이 커맨드 입력

```
pip install --upgrade pip
```

django 버전 확인

```
python -m django --version
```

장고 프로젝트 생성은 다음과 같습니다. 맨 뒤에 .을 붙이는 경우는 현재 디렉토리를 장고 프로젝트로 설정하는 옵션입니다.

```
django-admin startproject '프로젝트명' .
```

저의 디렉토리 상황은 이렇습니다.

```
Server_dev
ㄴ server_dev
ㄴ .venv
manage.py
server_dev
ㄴ __init__.py
asgi.py
settings.py
urls.py
wsgi.py
```

다음과 같은 창이 뜨면 성공입니다.

![](/images/posts/python-django/5bbe8beb2b988513cafc.png) Django version은 4.1.3을 쓰고 있고, server\_dev.settings의 세팅을 사용하고 있다고 하네요.

아무 브라우저나 켜서 주소입력창에 127.0.0.1:8000 또는 localhost:8000을 입력해보시면 다음과 같은 창에 접속되실 겁니다!

![](/images/posts/python-django/979ac210cab5faeb0923.png)축하합니다!! 짝짝짝짝 빨간색 warning의 의미는 "18개의 적용이 되지 않은 migration이 있다 이와 관련된 앱은 'admin', 'auth', .. 등이 있다." 라는 말입니다.

이 앱들은 장고 프로젝트를 만들었을 때 자동으로 만들어지는 앱으로써, 관련된 정보는 server\_dev.settings.py 파일의 INSTALLED\_APPS 에서 확인 가능합니다.

![](/images/posts/python-django/14abd61206facaad10d5.png) 위에 출력된 것들 외의 messages와 staticfiles는 DB와는 상관이 없습니다.

DB엔진은 sqlite를 사용하고 있네요. 저는 MySQL을 사용할 것이기 때문에, 수정해주고 migrate를 해주겠습니다.

![](/images/posts/python-django/fbf482f4b638d669e1f9.png) 만약 DB를 갖고계신다면, mysql 연동은 다음과 같이 해주시면 됩니다.

```
'ENGINE': 'django.db.backends.mysql',
'HOST': 'host name',
'NAME': 'db_name',
'USER': 'db_user_name',
'PASSWORD': 'db_password!',
'PORT': '3306',
'OPTIONS': {'charset': 'utf8mb4'},
```
