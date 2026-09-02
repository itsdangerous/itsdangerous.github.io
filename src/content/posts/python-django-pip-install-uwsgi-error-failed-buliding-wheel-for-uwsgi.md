---
title: "[Python | Django] pip install uwsgi Error : Failed buliding wheel for uwsgi"
description: "ubuntu 18.04에서 uwsgi를 설치하려고 pip install uwsgi를 해보았으나... Failed building wheel for uwsgi 에러가 떠서 구글링 해 본 결과 sudo apt-get install python3.10-dev 을 해주니 해결되었다."
pubDate: 2022-11-23T05:23:55.000Z
category: "Study"
tags: ["error","python","uWSGI","에러"]
slug: "python-django-pip-install-uwsgi-error-failed-buliding-wheel-for-uwsgi"
sourceUrl: "https://0418.tistory.com/11"
draft: false
---
ubuntu 18.04에서 uwsgi를 설치하려고

pip install uwsgi를 해보았으나...

**Failed building wheel for uwsgi**

에러가 떠서 구글링 해 본 결과

```
sudo apt-get install python3.10-dev
```

을 해주니 해결되었다.

![](/images/posts/python-django-pip-install-uwsgi-error-failed-buliding-wheel-for-uwsgi/287fd1630a66b126ae48.png)
