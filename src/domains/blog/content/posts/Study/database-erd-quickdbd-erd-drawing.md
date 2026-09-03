---
title: "[Database | ERD] QuickDBD 온라인 웹 ERD drawing 서비스 리뷰"
description: "QuickDBD의 텍스트 기반 ERD 작성 방식과 사용 경험을 draw.io 등 다른 도구와 비교해 소개"
pubDate: 2023-12-11T13:16:21.000Z
category: "Study"
tags: ["1년","ERD","ERD다이어그램","PRO","quickDBD","개월","데이터베이스","리뷰","무료"]
slug: "database-erd-quickdbd-erd-drawing"
draft: false
---
## 리뷰

erd 다이어그램을 그리기 위해 drawio, erdCloud, mysql 내장 툴, 이클립스 내장 툴 등 여러 툴을 사용해보았다.

그런데 최근에 신기한 툴을 발견했다

quickDBD라는 것인데. 기존 것들과의 차이점은 텍스트 지향 erd 다이어그램 설계가 가능하다는 것이다.

[QuickDatabaseDiagrams.com  Pretty diagrams make your documents look good and help you communicate clearly.  www.quickdatabasediagrams.com](https://www.quickdatabasediagrams.com/)

사용해보면서 느낀점은.. 나는 원래 마우스를 잘 쓰지 않고 키보드로 왠만한걸 하다보니, 키보드로 타이핑치면서 옆에 그림이 그려지는게 너무 신기했고 작업 속도가 빠르고 직관적이라는 것이다.

문법이 처음에는 조금 어색하고 적응 안됐는데 사실 erd 다이어그램이 많은 기능이 필요하진 않아서 금방 적응했다.

![](/images/posts/database-erd-quickdbd-erd-drawing/f601b3b107ab6a9fbdf3.png)

**먼저, 기본 문법은 table 이름을 적고 대쉬(-)를 사용하여 attribute를 설정할 수 있다. 기본적으로 not null 형태로 제공되고, 필요 시 null 옵션을 줄 수 있는 것 같다.**

**FK 설정은 마우스를 테이블 위에 갖다 대면 끌어서 사용할 수 있는데 그렇게 FK 설정을 할 수 있다.**

**그리고 생각보다 괜찮았던 것이...**

![](/images/posts/database-erd-quickdbd-erd-drawing/330e4780d45bdcc5962f.png)

**이 사진을 보면 알겠지만, 테이블 이름이 중복된다면 오류가 발생한다 이건 좀 좋은 기능같다.ㅎㅎ**

## **아쉬운 점**

**quickDBD의 아쉬운것이 있다면.. 딱! 두개가 있다 ㅋㅋ**

**먼저, 테이블 삭제 기능이다. 이게 조금 까다로웠는데...******

**일단 첫 번째로 delete 버튼이 없다. 그냥 텍스트에서 해당 내용을 지워야한다.**

**이 부분은 그냥... 개인적으로 아쉬운 감이 컸다. ㅋㅋ**

**두 번째는 FK로 참조가 되어있는 테이블이 있다면 오류가 발생한다.**

**다른 erd 툴은 아무래도 이런 제약없이 사용할 수 있어 좋았는데, 이 부분은 조오오오금 아쉬웠던 감이 있다.**

**하지만 이러한 예외 사항 하나하나 따져주니, 익숙해진다면 설계자가 실수할 것을 미리 방지한다는 차원에서는 봐줄만 하다.**

**그 다음은 워크스페이스 기능이다.**

**기존 사용하던 ERDCloud는 여러 팀원과 공유하며 워크스페이스 공간에서 실시간으로 공유하며 작업이 가능했다.**

**하지만... QuickDBD는 그런 기능은 없는 것 같다 PRO 버전 사용하면 제공해줄 수도?ㅠ**

## **비교**

**그리고 텍스트 지향 erd다이어그램 툴중 비슷한 것이 dbdiagram이라고 있는데, 굉장히 유사한 방식으로 erd를 설계하기에 좋다.**

[dbdiagram.io - Database Relationship Diagrams Design Tool   dbdiagram.io](https://dbdiagram.io/home)

**하지만 난 QuickDBD를 선택했다 왜냐하면 일단 텍스트 문법 자체가 quickDBD가 더 직관적이었고, dbdiagram은 json형식이라 좀 불편했나보다.**

**dbdiagram이 나쁘단 것은 아니다! 오히려 무료로 사용하기에는 dbdiagram이 더 좋고, ui 자체는 오히려 dbdiagram이 더 좋았던 것은 사실이다.(다크모드 지원?ㅎㅎ)**

**아무튼 시중에 okky 사이트만 들어가봐도 개인이 만든 erd 툴도 많이 볼 수 있는 현재에... 텍스트로 erd를 그릴 수 있는 툴을 알아보았다.**

## **마치며**

**나는 원래 키보드로 깔짝대는걸 좋아하는 개발자여서, 아마 이 툴을 주로 사용하지 않을까 싶다. SSAFY를 다니면서는 ERDCloud를 메인으로 사용했는데, 현재는 내가 입사한 곳에서 한 프로젝트를 전적으로 다뤄서 DB모델링을 나 혼자 해야하기 때문에 워크스페이스 기능은 필요없고, QuickDBD가 UI측면에서도 훨씬 좋았기 때문이다.**

**아참! 지금은 트위터 태그나 블로그에 리뷰 게시글 올리면 2개월 또는 1년 짜리 pro 버전을 사용할 수 있다! 그 방법은 다른 블로그를 참조하였다.**

> ****\[트위터를 통해 Pro 버전 free 권한 받기\]** **1. 트위터에 @Quick\_DBD에 대해 트윗한다.** **2. 2개월 Pro 버전 free 권한을 얻는다.** \[블로그를 통해 Pro 버전 free 권한 받기\]**
> **1. QuickDBD를 사용한 후 블로그에 review를 작성한다. 이때, 블로그 리뷰는 500 단어 이상을 작성해야 한다. 주의해야 할 것이 500자가 아닌 500 단어라는 점을 숙지해야한다!**
> **2. promo@quickdbd.com 으로 free 권한을 원한다는 이메일을 보낸다. 이때, review 작성한 블로그 링크도 함께 첨부해서 보내야 한다. 이메일 양식은 아래를 참고하면 좋을 것 같다.**
> **============== 이메일 양식 ==============**
> **I posted a QuickDBD review on my blog. -\> 게시물 링크**
> **I want to get 1 year for free Pro Plan.**
> **======================================**
> **3. promo@quickdbd.com 으로 부터 확인 메일을 받는다.**
> **4. 답장 받은 이메일 계정으로 QuickDBD에 로그인하여 등록한다.**
> **QuickDBD의 오른쪽 상단 email을 클릭하여 Account에 접속한다. Pro plan Expires on 부분과 Eamil Confirmed 부분을 확인해서 NO라고 명시되어 있으면, 권한이 아직 부여되지 않은 상황이다.**
