---
title: "[Window | Linux] 윈도우에서 리눅스 사용하기 (feat. Pycharm, Django)"
description: "Windows에서 WSL로 Ubuntu 개발 환경을 구성하고 PyCharm과 Django를 사용하는 과정을 정리"
pubDate: 2022-12-04T09:24:16.000Z
category: "uncategorized"
tags: ["Django","python","runserver","window","WSL","윈도우","인터프리터"]
slug: "window-linux-feat-pycharm-django"
draft: false
---
매번 맥북으로 개발하려다 집에서 pc로 하고싶은데 terminal에 너무 익숙해서 cmd는 못써먹겠더라..

그래서 윈도우에서 vmware를 사용하는것 말고 ubuntu를 사용할 수 있는 방법을 찾아냈다.

## WSL 설치

는 아래 링크 참고했고

[\[Windows 10\] WSL2 설치 및 사용법  Microsoft에서는 2020년 5월 리눅스를 윈도우와 통합해서 사용할 수 있는 WSL2를 발표했습니다. 이 글에서는 WSL2를 설치하고 사용하는 방법을 소개합니다  www.lainyzine.com](https://www.lainyzine.com/ko/article/how-to-install-wsl2-and-use-linux-on-windows-10/)

## ubuntu에 python 및 장고 설치

는 이전 포스팅에 ec2서버에 python 및 가상환경 설치하는 것을 그대로 적용해줬다.

[\[Python | Django\] 로컬 파이썬 장고 프로젝트를 AWS EC2 서버에 올리기(github)  git add . git remote add origin https://github.com/itsdangerous/server\_dev.git git commit -m '1st cmt' git push -u origin main​ 2022.11.22 - \[Study & 교육\] - \[Python | Django\] 파이썬 장고 설치 (가상환경) \[Python | Django\] 파이썬 장고  0418.tistory.com](https://0418.tistory.com/10)

cmd에서 확인한 python 버전과

ubuntu에서 확인한 python 버전은 달랐다.

애초에 wsl 경로가 C드라이브보다 밑에 잡혀있더라

윈도우 위에 ubuntu가 들어가는게 아닌 것 같다

그래도 우분투에서 윈도우 파일에 접근은 가능하다.

## WSL 인터프리터 설정(Pycharm Professional)

이 기능은 파이참에서는 Professional 버전만 적용 되는 것 같다.

WSL와 연결하고 싶으면 무료로는 VSCode를 사용하면 된다.

파이참에서 WSL환경의 인터프리터를 설정해주어야 한다.

프로젝트를 열어줘야한다. 프로젝트는 C드라이브에 있지 않다.

경로는 \\\\wsl$\\우분투 버전 이다.

기존 프로젝트를 열어준다.

![](/images/posts/window-linux-feat-pycharm-django/f5b6dafd662eaf56fce4.png)

![](/images/posts/window-linux-feat-pycharm-django/d0247af7bbcabd632a95.png)

이제 인터프리터(Interpreter)를 설정해야한다.

인터프리터란, 어떤 버전의, 어느 환경에 있는 파이썬을 써서 그 프로젝트를 돌리는 것인데, WSL의 가상환경에서 쓰고있으니 설정해주도록 한다.

오른쪽 하단 윈도우 작업표시줄의 시간부분 위에 usr/bin/python3이 default를 클릭한 뒤, Interpreter Settings...를 클릭해준다.

![](/images/posts/window-linux-feat-pycharm-django/e506a9c51713a0cd1eec.png)

Add Interpreter를 클릭 후 On WSL ...을 눌러준다.

![](/images/posts/window-linux-feat-pycharm-django/6e8a0bb20c593b591c5e.png)

현재 깔린 ubuntu버전을 자동으로 읽어온다.

Next를 눌러준다.

![](/images/posts/window-linux-feat-pycharm-django/03b0311a61c537d25530.png)

왼쪽의 System Interpreter로 들어가서

본인이 사용하고 싶은 interpreter 경로를 적어주면 된다.

![](/images/posts/window-linux-feat-pycharm-django/0b1276b2a45daae8cb99.png)

나는 /home/gyu/Project/server\_dev/.venv/bin/python 경로에 있다.

> WSL 환경에서는 프로젝트를 /home/사용자명/Proejct 경로에 관리하는 것이 좋다고한다.

자! 이제 인터프리터를 설정하였다.

하지만, 문제가 있다. 분명 터미널에서 python manage.py runserver 8000 을 하면 장고 서버를 돌아가는데,

파이참의 실행 버튼을 누르면 안돌아간다.

이 부분은 다음과 같이 해결할 수 있었다.

![](/images/posts/window-linux-feat-pycharm-django/57b7acf7146e750e5f32.png)

실행 버튼 왼쪽의 Edit COnfigurations... 클릭

![](/images/posts/window-linux-feat-pycharm-django/932c23b1a0fe14e8afe8.png)

Python Configuration을 새로 만들어 준 뒤

![](/images/posts/window-linux-feat-pycharm-django/f91e2aecaa7cbd905588.png)

Name : Runserver

script path : 프로젝트의 manage.py 경로

Parameters : runserver

을 입력해 준 뒤,

프로젝트 실행을 눌러보면

![](/images/posts/window-linux-feat-pycharm-django/33234b727d68b60def55.png)

잘 돌아가는 것을 볼 수 있다.
