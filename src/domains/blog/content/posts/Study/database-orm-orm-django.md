---
title: "[Database | ORM] ORM이란 무엇인가 (Django)"
description: "ORM의 개념과 객체·관계형 데이터베이스 사이의 매핑 원리를 Django 관점에서 설명"
pubDate: 2022-12-02T07:00:31.000Z
category: "Study"
tags: ["DATABASE","DB","ORM"]
slug: "database-orm-orm-django"
draft: false
---
> ORM이란
>
> Object-Relational Mapping의 약자
>
> 객체(Object)와 관계형 데이터베이스(Relational Database)의 데이터 매핑(Mapping)해주는 것
>
> 객체 지향 프로그래밍은 객체(Class)를 사용관계형 데이터베이스는 테이블(Table)을 사용객체 모델 \<-\> 관계형 모델 사이의 불일치 발생
>
> ORM을 통해 객체간의 관계를 바탕으로 SQL을 자동으로 생성하여, 불일치 해결
>
> DATABASE DATA \<---MAPPING---\> Object Field
>
> 즉, DB TABLE을 객체지향 프로그래밍에서 흔히 사용하는 객체(Class)처럼 사용할 수 있도록 해주는 기술.

- **장점**- 객체 지향적인 코드로 인해 더 직관적이고, 비즈니스 로직에 더 집중할 수 있게 도와준다.
- 선언문, 할당, 종료 등과 같은 부수적인 코드가 급격히 줄어든다.
- 각종 객체에 대한 코드를 별도로 작성하기 때문에 코드의 가동성을 높여준다.
- SQL의 절차적이고 순차적인 접근이 아닌, 객체 지향적인 접근으로 인해 생산성이 증가한다.
- 재사용 및 유지보수의 편리성 증가 - ORM은 독립적으로 작성되었고, 해당 객체들을 재활용이 가능하다.
- 모델에서 가공된 데이터를 컨트롤러에 의해 뷰와 합쳐지는 형태로 디자인 패턴을 견고하게 다지는데 유리하다.
- 매핑 정보가 명확하여, ERD를 보는 것에 대한 의존도를 낮출 수 있다.
- DBMS에 대한 종속성이 줄어든다. - 대부분 ORM 솔루션은 DB에 종속적이지 않다.
- 종속적이지 않다는 것은 구현 방법 뿐만 아니라, 많은 솔루션에서 자료형 타입까지 유효하다.
- 프로그래머는 Object에 집중하기 때문에, 극단적으로 DBMS를 교체하는 거대한 작업에도 비교적 작은 리스크와 시간이 소요된다.
- 단점 - 완벽한 ORM 으로만 서비스를 구현하기가 어렵다. - 사용하기는 편하지만 설계는 매우 신중하게 해야한다.
- 프로젝트의 복잡성이 커질경우 난이도 또한 올라갈 수 있다.
- 잘못 구현된 경우에 속도 저하 및 심각할 경우 일관성이 무너지는 문제점이 생길 수 있다.
- 일부 자주 사용되는 대형 쿼리는 속도를 위해 SP를 쓰는등 별도의 튜닝이 필요한 경우가 있다.
- DBMS의 고유 기능을 이용하기 어렵다. (하지만 이건 단점으로만 볼 수 없다 : 특정 DBMS의 고유기능을 이용하면 이식성이 저하된다.)
- 프로시저가 많은 시스템에선 ORM의 객체 지향적인 장점을 활용하기 어렵다. - 이미 프로시저가 많은 시스템에선 다시 객체로 바꿔야하며, 그 과정에서 생산성 저하나 리스크가 많이 발생할 수 있다.

#### **사용 예시**

- 객체와 테이블 간의 관계를 설정하여, 자동으로 처리

**book 객체에서 저자의 이름이 kim인 책 목록을 가져오고 싶을 때**

- SQL 쿼리문은 다음과 같이 쿼리문을 작성하고, 데이터를 가져오는 일련의 모든 과정들을 코드에 적어야 함.
-

```
book_list = new list();
sql = "SELECT book FROM library WHERE author = 'kim'";
data = query(sql);
while (row = data.next()){
    book = new Book();
    book.setAuthor(row.get('author'));
    book_list.add(book);
}
```

- ORM을 사용할 경우

```
book_list = BookTable.query(author="kim")
```

#### ORM 활용 예시

```
1. objects.all() # 데이터 가져오기
	ex) Book.objects.all()

2. objects.create() # 데이터 추가하기
	ex) Book.objects.create(title='Developer', author='hyelyn')
   
3. objects.filter() # 데이터 검색
	ex) Book.objects.filter(author='heylyn')
4. objects.delete() # 데이터 삭제
	ex) d = Book.objects.get(title='Developer')
    	d.delete()
```

그 외 더 자세한 내용은

[http://www.incodom.kr/Django\_ORM](http://www.incodom.kr/Django_ORM)
