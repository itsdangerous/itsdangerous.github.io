---
title: "[Python | Django] 로컬 파이썬 장고 프로젝트를 AWS EC2 서버에 올리기(github)"
description: "로컬 Django 프로젝트를 GitHub와 연동한 뒤 AWS EC2 서버에 배포하는 기본 흐름을 정리"
pubDate: 2022-11-22T09:04:22.000Z
category: "Study"
tags: ["AWS EC2","Django","python","서버"]
slug: "python-django-aws-ec-github"
draft: false
---
```
git add .
git remote add origin https://github.com/itsdangerous/server_dev.git
git commit -m '1st cmt'
git push -u origin main​
```

장고 프로젝트를 생성해주었으니 이제 이걸 github에 올려야겠죠?

올리는 방법은 아래 포스팅에 적어두었습니다.

server\_dev 디렉토리로 가서 다음과 같이 입력하여 깃헙 저장소에 올립니다

```
git init
git add .
git remote add origin https://github.com/itsdangerous/server_dev.git
git commit -m '1st cmt'
git push -u origin main
```

![](/images/posts/python-django-aws-ec-github/0b36f1bc230ea08f5b7f.png)

짝짞짞ㄱ짜!!

이제 이걸 서버에서 가져와서 작업하면 되겠군요?

ec2 서버에 들어가봅시다!

![](/images/posts/python-django-aws-ec-github/c532a1318fa275f76c45.png)

먼저 python과 pip를 설치해봅니다

```
sudo apt update
```

전 로컬에서 파이썬을 3.10 버전을 사용해서, ec2에서도 같은 환경을 적용해줄게요

```
sudo add-apt-repository ppa:deadsnakes/ppa # 선택적
sudo apt install python3.10
```

\* 이게 안된다면

아래꺼 실행해주세요

```
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.10
```

![](/images/posts/python-django-aws-ec-github/104dbdfa7f222c2741bf.png)

잘 설치 됐네요

> 제가 사진은 첨부하지 못했지만,
> 로컬에 설치되어 있는 파이썬 버전으로 가상환경을 만들어주면
>
> 로컬에서 실행한 which python의 결과와
> 가상환경에서 실행한 which python의 결과가 다를거에요.
>
> 그리고 그 가상환경에서 연결된 pip list를 쭉 뽑아보면 로컬 환경에 있는 pip와 다를거에요.
>
> 가상환경은 이처럼 버전관리를 위해 사용합니다.

이제 우분투에서 사용할 파이썬의 기본 버전을 변경해줄거에요

먼저, 파이썬3.10의 위치를 찾아줄게요

![](/images/posts/python-django-aws-ec-github/ed5c77f6fbee7c5ed392.png)

이렇게 확인해보니 링크된 폴더에 파이썬이 여러 버전이 깔려있네요 ㄷ ㄷ

```
sudo update-alternatives --config python # python python의 버전 변경 가능

# --config python : python의 버전 변경
```

```
update-alternatives: error: no alternatives for python
```

만약 위와 같은 에러가 뜰 경우, 변경할 버전이 설정되어 있지 않은 것입니다.

그런 경우에는

```
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1 # 마지막 1은 첫번째 대안이란 뜻
sudo update-alternatives --install /usr/bin/python python /usr/bin/python3.6 2
```

을 입력해주고 다시

```
sudo update-alternatives --config python
```

을 입력해주면 아래와 같이 설정되어있는 python 버전 선택 메뉴가 등장하게 되는데,

![](/images/posts/python-django-aws-ec-github/08c0ccb1853c3e6524be.png)

원하는 Selection의 번호를 입력하고 Enter를 누르면 python의 해당 버전으로 default path로 설정됩니다.

뭐 이방법 말고 저는 bash 쓰니까 .bashrc에 PATH 설정해줘도 되긴 합니다. 이부분은 pass

![](/images/posts/python-django-aws-ec-github/59614ec935c65bec5506.png)

이러고 나서 python -m venv .venv를 입력해서 가상환경을 설정했으나...

```
Error: Command '['/home/ubuntu/server_dev/.venv/bin/python', '-Im', 'ensurepip', '--upgrade', '--default-pip']' returned non-zero exit status 1.
```

와 같은 에러가 떴습니다. pip가 설치가 안되어있거나, PATH 설정이 안되어있어서 그런 것 같습니다.

해결방법은 다음과 같았습니다.

아래 입력으로 pip 설치 및 업그레이드

```
sudo apt install python-pip # pip 설치

pip install --upgrade pip # upgrade pip version
```

다음과 같이 PATH 경로 설정

venv 설치

```
sudo apt-get install python3.10-venv # 3.10 버전 venv 설치
```

그리고 나서

```
python -m venv .venv
```

를 입력하게되면, '.venv'라는 이름으로 가상환경이 생깁니다.

![](/images/posts/python-django-aws-ec-github/c57c43d404e471b2652c.png)

잘 됐네요 ㅎㅎ

자, 이제 ec2 서버에 가상환경도 만들어 주었겠다...

로컬에 있는 환경을 그대로 가져와야겠죠

로컬로 가서 가상환경에 접속한 다음,

```
pip freeze > requirements.txt
```

를 입력하면 txt파일이 하나 생깁니다

만약 mysqlclient 설치에 오류가 난다면

아래 명령어를 입력하면 해결됩니다.

이걸 git에 등록하고 push한 뒤, 서버에서 pull로 받아봅니다.

![](/images/posts/python-django-aws-ec-github/512bec6c5f2885a6ca78.png)

push는 리모트와 브런치가 정해졌다면, 다음과 같이 하면 됩니다.

```
git add .
git commit -m "add reuqirements"
git push -u origin main
```

서버에서는 디렉토리에 들어가서 다음과 같이 입력 하면 내려받을 수 있겠죠.

```
git init

git remote add origin https://github.com/itsdangerous/server_dev.git

git fetch

git pull origin main
```

![](/images/posts/python-django-aws-ec-github/672c89e9eef97efc35ed.png)

잘 내려받았습니다.

이제 requirements.txt에 있는 패키지 버전을 서버 가상환경에 그대로 설치해줍니다.

아래 코드를 입력하고 아래 중 하나로 버전을 확인해봅니다.

```
pip install -r requirements.txt
```

만약 mysqlclient나 uwsgi 설치가 안된다면 아래 줄 입력

```
sudo apt-get update
sudo apt-get install python3.10-dev libmysqlclient-dev gcc # python 버전에 맞게 쓰세요
```

이제 다 되었습니다.

장고서버를 실행시켜봅니다.

```
python manage.py runserver
```

![](/images/posts/python-django-aws-ec-github/1116abe47272a16e0088.png)

성공했슴돠~!~~!!~!

빨간 줄로 you have 18머시기 뜬건 해석해보니

18개의 적용되지 않은 migration(admin, auth, contenttypes...)이 있어서 migrate를 진행하라고 하네요.

장고 default db는 sqllite인데, mysql은 나중에 쓸거고, 일단은 migrate해줄게요.

아래 줄 입력해줍니다.

```
python manage.py migrate
```

입력후 다시 서버 가동 하면?

![](/images/posts/python-django-aws-ec-github/3bfd75064f1db2fc2391.png)

잘 되는 것 같은데요? 자 이제 127.0.0.1:8000로 들어가봅니다.

페이지를 찾을 수 없다고 나옵니다.

이를 해결하기 위해선 3가지가 필요합니다.

1. server\_dev/settings.py의 ALLOWED\_HOSTS 변수에 \['\*'\]를 할당하여, 모든 호스트를 허용케 만들고

2. aws의 보안그룹 인바운드 규칙에서 8000번 포트를 열어주고

3. 서버 실행 시 python manage.py runserver 0:8000 으로 실행

그니까, 다시 로컬에서 1작업을 하고 git으로 push하고 서버에서 pull 해줍니다.

해볼게요

![](/images/posts/python-django-aws-ec-github/581148b78a2f18790cf9.png)

잘 되네요 ㅎㅎ

접속은 URL은 \['ec2의 퍼블릭 dns주소':8000\] 입니다.

다음에는 미들웨어인 NginX와 연결을 해보도록하겠습니다.
