---
title: "[Concurrency] Race Condition과 대응: 뮤텍스, 세마포어, 원자적 연산, 불변성"
description: "Race Condition의 원인과 대응 방법을 정리합니다. 뮤텍스, 세마포어, 원자적 연산, 불변성, 트랜잭션, 낙관적 락, 유일성 제약, 멱등성 키 등 다양한 접근을 살펴봅니다."
pubDate: 2026-09-10T13:34:00.000Z
category: "Study"
tags:
  ["Concurrency", "Race Condition", "Mutex", "Semaphore", "Database", "Backend"]
slug: "race-condition-prevention"
draft: false
---

프로그램을 만들다 보면 코드는 분명히 순서대로 실행되는 것처럼 보이는데 결과가 가끔씩 달라지는 일이 생긴다. 재현도 잘 되지 않고, 로그를 찍으면 멀쩡하게 보일 때도 있다. 이런 문제 중 하나가 Race Condition이다.

Race Condition은 두 개 이상의 작업이 같은 상태를 읽거나 변경하면서, 실행 순서에 따라 결과가 달라지는 현상이다. 요청이 정말 동시에 들어오는 경우뿐 아니라, 비동기 작업 사이에 다른 요청이 끼어드는 경우에도 발생한다.

예를 들어 재고가 한 개 남았을 때 두 명의 사용자가 동시에 주문한다고 해보자. 두 요청이 모두 재고를 확인한 뒤 주문을 만들면 재고는 한 개뿐인데 주문은 두 개가 생성될 수 있다.

## Race Condition은 어디에서 생기는가

가장 흔한 형태는 `확인한 다음 변경하는` 코드다.

```text
재고를 조회한다
재고가 0보다 큰지 확인한다
재고를 1 감소시킨다
주문을 만든다
```

코드로 쓰면 대략 다음과 같은 모양이 된다.

```javascript
async function order(productId) {
  const product = await getProduct(productId);

  if (product.stock <= 0) {
    throw new Error("재고가 없습니다.");
  }

  await updateStock(productId, product.stock - 1);
  await createOrder(productId);
}
```

재고가 1인 상태에서 요청 A와 B가 거의 동시에 실행되면 다음과 같은 순서가 가능하다.

```text
요청 A: 재고 조회 → 1
요청 B: 재고 조회 → 1
요청 A: 재고를 0으로 변경
요청 B: 재고를 0으로 변경
요청 A: 주문 생성
요청 B: 주문 생성
```

각 요청은 자기 입장에서 틀린 일을 하지 않았다. 재고를 읽었을 때는 실제로 1이었고, 1보다 큰지도 확인했다. 문제는 확인과 변경 사이에 다른 요청이 들어올 수 있었다는 점이다.

이 사이를 흔히 **check-then-act** 구간이라고 한다. Race Condition을 피하려면 이 구간을 없애거나, 다른 작업이 끼어들 수 없도록 보호해야 한다.

## 대응의 출발점은 상호 배제다

Race Condition에 대응하는 가장 기본적인 생각은 **상호 배제(mutual exclusion)**다. 공유 상태를 변경하는 순간에는 한 번에 하나의 작업만 들어오게 해서, 여러 작업이 같은 값을 동시에 수정하지 못하게 하는 것이다.

상호 배제를 구현하는 대표적인 도구가 **뮤텍스(Mutex, mutual exclusion)**다. 뮤텍스는 잠금의 소유자가 하나뿐인 락이다. 어떤 작업이 뮤텍스를 획득하면 다른 작업은 락이 해제될 때까지 기다린다.

```text
뮤텍스 획득
공유 데이터 읽기
공유 데이터 변경
뮤텍스 해제
```

뮤텍스는 재고 객체를 메모리에서 직접 수정하거나, 한 프로세스 안에서 동시에 실행되면 안 되는 작업을 보호할 때 사용할 수 있다. 다만 락을 잡은 뒤 네트워크 요청이나 오래 걸리는 작업을 수행하면 대기하는 요청이 늘어난다. 따라서 임계 영역, 즉 락을 잡고 실행하는 구간은 가능한 한 짧게 유지해야 한다.

여기서 중요한 점은 뮤텍스가 모든 Race Condition의 정답은 아니라는 것이다. 서버가 여러 대면 각 서버의 메모리에 있는 뮤텍스는 서로 다른 락이다. 서버 A가 락을 잡았다고 해서 서버 B가 같은 데이터에 접근하는 것을 막을 수 없다. 여러 인스턴스가 공유하는 데이터를 보호할 때는 데이터베이스 락, 원자적 연산, 분산 락처럼 공유 시스템이 이해할 수 있는 방법을 선택해야 한다.

## 뮤텍스와 세마포어는 어떻게 다른가

**세마포어(Semaphore)**도 동시 접근을 제한하지만, 하나의 작업만 들어가게 하는 뮤텍스와 달리 동시에 들어갈 수 있는 작업의 수를 정할 수 있다.

```text
세마포어의 허용 수 = 3

작업 A ─┐
작업 B ─┼─ 동시에 실행 가능
작업 C ─┘
작업 D ─── 대기
```

예를 들어 외부 API가 동시에 세 번까지만 호출되도록 제한하거나, 데이터베이스 연결 풀처럼 사용할 수 있는 자원이 제한되어 있을 때 세마포어가 어울린다.

반면 잔액처럼 한 번에 한 작업만 변경해야 하는 공유 상태라면 세마포어의 허용 수를 1로 두는 것보다 뮤텍스라는 의도를 명확히 사용하는 편이 이해하기 쉽다. 세마포어는 “동시 실행 개수 제한”, 뮤텍스는 “공유 상태의 단일 소유권”에 가깝다.

두 도구 모두 반드시 해제되는지 확인해야 한다. 예외가 발생했는데 락이나 세마포어를 반환하지 않으면 이후 작업이 영원히 대기할 수 있다.

```javascript
await mutex.lock();
try {
  await updateSharedState();
} finally {
  mutex.unlock();
}
```

## 원자적 연산은 중간 상태를 노출하지 않는다

**원자적 연산(atomic operation)**은 더 이상 나눌 수 없는 하나의 연산처럼 실행되는 작업이다. 다른 작업이 연산의 중간 상태를 관찰하거나 끼어들 수 없다는 점이 핵심이다.

앞의 재고 차감에서 다음 코드는 원자적이지 않다.

```javascript
const stock = await getStock(productId);
await saveStock(productId, stock - 1);
```

읽기와 쓰기가 분리되어 있기 때문에 두 작업이 같은 재고를 읽을 수 있다. 반면 다음 SQL은 조건 확인과 차감을 하나의 데이터베이스 연산으로 표현한다.

```sql
UPDATE products
SET stock = stock - 1
WHERE id = :product_id
  AND stock > 0;
```

원자적 연산을 사용하면 애플리케이션 코드에서 직접 락을 관리해야 하는 구간이 줄어든다. 카운터 증가, 조건부 상태 변경, 재고·잔액 차감처럼 연산 자체를 저장소가 표현할 수 있다면 가장 먼저 고려할 방법이다.

단, 여러 테이블을 함께 변경하거나 외부 시스템 호출까지 포함해야 한다면 원자적 SQL 하나만으로는 충분하지 않다. 이때는 트랜잭션, 보상 처리, 멱등성 키를 함께 설계해야 한다.

## 불변성으로 공유 상태를 줄인다

Race Condition은 여러 작업이 같은 가변 데이터를 공유할 때 쉽게 발생한다. 그래서 또 하나의 대응 방법은 데이터를 **불변(immutable)** 으로 다루는 것이다.

불변 데이터는 생성된 뒤 내부 값을 직접 바꾸지 않는다. 변경이 필요하면 기존 객체를 수정하는 대신 새로운 값을 만든다.

```javascript
// 공유 객체를 직접 변경
state.items.push(newItem);

// 기존 상태를 보존하고 새로운 상태 생성
const nextState = {
  ...state,
  items: [...state.items, newItem],
};
```

불변성만으로 데이터베이스의 동시 갱신 문제가 해결되는 것은 아니다. 하지만 한 작업이 객체를 읽은 뒤 다른 작업이 같은 객체를 몰래 바꾸는 상황을 줄이고, 상태 변경의 흐름을 추적하기 쉽게 만든다. 함수형 프로그래밍의 순수 함수, 이벤트 로그, 복제 후 교체하는 상태 관리 방식이 이런 생각과 연결된다.

특히 브라우저 상태나 애플리케이션 내부 캐시에서는 불변성을 유지하고, 서버의 영속 데이터는 원자적 연산과 제약 조건으로 보호하는 식으로 역할을 나누는 편이 현실적이다.

## 가장 먼저 사용할 방법은 원자적 갱신이다

재고 차감처럼 조건과 변경을 한 번에 표현할 수 있다면 데이터베이스에 맡기는 것이 가장 단순하다.

```sql
UPDATE products
SET stock = stock - 1
WHERE id = :product_id
  AND stock > 0;
```

이 쿼리를 실행한 뒤 실제로 변경된 행의 개수를 확인한다.

```javascript
const result = await db.query(
  `UPDATE products
   SET stock = stock - 1
   WHERE id = $1 AND stock > 0`,
  [productId],
);

if (result.rowCount !== 1) {
  throw new Error("재고가 없습니다.");
}
```

두 요청이 동시에 실행되어도 데이터베이스는 각 `UPDATE`를 독립적인 연산으로 처리한다. 먼저 성공한 요청이 재고를 0으로 만들면, 뒤의 요청은 `stock > 0` 조건을 만족하지 못해 변경된 행이 0개가 된다.

여기서 중요한 것은 먼저 재고를 조회하고 애플리케이션 코드에서 숫자를 계산한 뒤 다시 저장하지 않는 것이다. 조건과 변경을 하나의 SQL 문장으로 합쳐야 한다.

이 방식은 단순한 카운터, 잔액 차감, 상태 변경에 특히 잘 맞는다.

```sql
UPDATE jobs
SET status = 'processing'
WHERE id = :job_id
  AND status = 'waiting';
```

변경된 행이 1개면 내가 작업을 가져온 것이고, 0개면 이미 다른 작업자가 처리했거나 대상 상태가 바뀐 것이다.

## 여러 작업이 함께 성공해야 한다면 트랜잭션을 사용한다

원자적 갱신 하나로 끝나지 않는 경우도 있다. 재고를 차감하면서 주문을 생성하고 결제 기록까지 남겨야 한다면 중간에 일부만 반영된 상태가 남지 않아야 한다.

이때는 여러 변경을 하나의 트랜잭션으로 묶는다.

```sql
BEGIN;

UPDATE products
SET stock = stock - 1
WHERE id = :product_id
  AND stock > 0;

-- 변경된 행이 0개라면 ROLLBACK

INSERT INTO orders (product_id, user_id)
VALUES (:product_id, :user_id);

COMMIT;
```

트랜잭션을 사용한다고 자동으로 Race Condition이 사라지는 것은 아니다. 트랜잭션 안에서 여전히 다음처럼 읽고 나중에 쓰는 코드를 작성하면 문제가 남을 수 있다.

```text
BEGIN
재고 조회
애플리케이션에서 재고 - 1 계산
재고 저장
COMMIT
```

읽은 행을 다른 트랜잭션이 먼저 바꿀 수 있기 때문이다. 읽은 순간부터 다른 변경을 막아야 한다면 데이터베이스가 제공하는 행 잠금을 사용한다.

```sql
BEGIN;

SELECT stock
FROM products
WHERE id = :product_id
FOR UPDATE;

-- 재고 확인, 주문 생성, 재고 변경

COMMIT;
```

`FOR UPDATE`로 읽은 행은 현재 트랜잭션이 끝날 때까지 다른 트랜잭션이 같은 행을 수정하지 못하게 한다. 다만 잠금은 오래 잡을수록 다른 요청을 기다리게 만들고, 여러 행을 서로 다른 순서로 잠그면 교착 상태가 생길 수 있다. 잠금은 필요한 행에만, 짧은 시간 동안 사용해야 한다.

## 충돌을 감지하는 낙관적 락

모든 요청이 충돌하는 것은 아니고, 충돌이 생기면 작업을 다시 시도하거나 사용자에게 알려도 되는 경우가 있다. 이런 상황에서는 버전 번호를 함께 저장하는 낙관적 락을 사용할 수 있다.

```sql
UPDATE documents
SET content = :content,
    version = version + 1
WHERE id = :document_id
  AND version = :version_read;
```

처음 읽었을 때 버전이 4였다면, 저장할 때도 버전이 4인지 확인한다. 다른 요청이 먼저 저장했다면 버전은 이미 5가 되었으므로 변경된 행은 0개가 된다.

```javascript
const result = await db.query(
  `UPDATE documents
   SET content = $1, version = version + 1
   WHERE id = $2 AND version = $3`,
  [content, documentId, versionRead],
);

if (result.rowCount !== 1) {
  throw new Error("다른 사람이 먼저 수정했습니다. 다시 불러와 주세요.");
}
```

낙관적 락은 편집 화면처럼 사용자가 데이터를 오래 보고 있는 경우에 유용하다. 사용자가 문서를 열어 둔 동안 데이터베이스 행을 계속 잠그는 것은 적절하지 않지만, 저장 시점에 버전만 비교하면 충돌을 놓치지 않을 수 있다.

반대로 충돌이 자주 발생하고 재시도가 어렵다면 비관적 락이나 원자적 갱신이 더 적합할 수 있다. 어떤 락이 더 좋은지는 충돌 빈도와 작업의 길이에 따라 달라진다.

## 중복 생성은 유일성 제약으로 막는다

Race Condition은 숫자를 잘못 계산하는 문제만은 아니다. 회원 가입, 결제 요청, 이벤트 처리처럼 같은 데이터가 두 번 생성되는 문제도 자주 발생한다.

애플리케이션에서 먼저 존재 여부를 확인하는 방식은 안전하지 않다.

```javascript
if (!(await findPayment(id))) {
  await createPayment(id);
}
```

두 요청이 동시에 `findPayment`를 실행하면 둘 다 데이터가 없다고 판단할 수 있다. 이 경우에는 데이터베이스에 유일성 제약을 만들고 삽입 자체가 한 번만 성공하도록 해야 한다.

```sql
ALTER TABLE payments
ADD CONSTRAINT payments_id_unique UNIQUE (payment_id);
```

그 다음 중복 삽입을 안전하게 무시하거나 오류로 처리한다.

```sql
INSERT INTO payments (payment_id, amount)
VALUES (:payment_id, :amount)
ON CONFLICT (payment_id) DO NOTHING;
```

유일성 제약은 데이터베이스가 마지막 방어선이 되어 준다는 점에서 중요하다. 현재 애플리케이션 코드가 한 곳뿐이어도, 나중에 배치 작업이나 다른 API가 추가되면 중복을 확인하는 코드만으로는 규칙을 지키기 어려워진다.

## 여러 서버에서는 메모리 락만으로 부족하다

개발 환경에서 다음과 같이 메모리 변수로 락을 구현하는 경우가 있다.

```javascript
let running = false;

async function runOnce() {
  if (running) return;

  running = true;
  try {
    await doWork();
  } finally {
    running = false;
  }
}
```

이 코드는 같은 프로세스 안에서 들어오는 요청에는 어느 정도 효과가 있다. 하지만 서버가 두 대로 늘어나면 서버 A의 `running`과 서버 B의 `running`은 서로 다른 변수다. 두 서버에서 동시에 작업이 실행될 수 있다.

분산 환경에서는 데이터베이스의 원자적 갱신·유일성 제약·행 잠금처럼 모든 인스턴스가 공유하는 저장소의 규칙을 사용해야 한다. Redis 같은 분산 락을 선택할 수도 있지만, 락을 얻은 서버가 중간에 멈추거나 락의 만료 시간이 작업보다 짧아지는 문제까지 고려해야 한다.

작업을 한 번만 실행해야 한다는 요구라면 락 하나보다 **멱등성 키**를 함께 두는 편이 안전한 경우가 많다.

```sql
INSERT INTO idempotency_keys (key, result)
VALUES (:key, :result)
ON CONFLICT (key) DO NOTHING;
```

같은 키로 들어온 요청은 첫 번째 요청만 처리하고, 나머지는 이미 저장된 결과를 반환한다. 네트워크 오류 때문에 클라이언트가 같은 요청을 재전송할 수 있는 결제나 발행 작업에서 특히 중요하다.

## 자바스크립트는 싱글 스레드인데도 Race Condition이 생긴다

자바스크립트 코드가 한 번에 하나씩 실행된다고 해서 Race Condition이 없는 것은 아니다. `await`를 만나면 현재 함수가 멈추고 다른 작업이 실행될 수 있다.

```javascript
async function addPoint(userId, amount) {
  const point = await getPoint(userId);
  await savePoint(userId, point + amount);
}
```

두 호출이 동시에 실행되면 둘 다 같은 포인트를 읽고, 한쪽의 증가분이 사라질 수 있다. `await` 사이에 다른 작업이 끼어들 수 있기 때문이다.

이 문제를 해결하려면 서버 메모리에서 값을 계산한 뒤 저장하지 말고, 저장소에서 원자적으로 증가시킨다.

```sql
UPDATE users
SET point = point + :amount
WHERE id = :user_id;
```

브라우저에서도 여러 비동기 요청이 같은 상태를 변경한다면 요청 순서를 직접 관리하거나, 최신 요청만 반영하는 식별자를 둘 수 있다.

```javascript
let latestRequest = 0;

async function search(keyword) {
  const requestId = ++latestRequest;
  const result = await fetchResults(keyword);

  if (requestId !== latestRequest) return;
  render(result);
}
```

이 코드는 먼저 시작한 검색 요청이 늦게 도착하면서 최신 검색 결과를 덮어쓰는 문제를 막는다. 여기서의 핵심은 공유 상태를 잠그는 대신, 오래된 결과를 적용하지 않는 것이다.

## 코드를 작성할 때 확인할 것

Race Condition을 의심할 때는 “동시에 실행될 수 있는가?”만 묻기보다 다음 순서로 확인하는 편이 좋다.

1. 같은 데이터를 읽고 변경하는 요청이 있는가?
2. 읽기와 변경 사이에 `await`, 네트워크 요청, 사용자 입력, 다른 함수 호출이 있는가?
3. 두 요청이 같은 값을 읽어도 데이터베이스가 이를 거부할 제약이 있는가?
4. 변경 결과를 행 개수나 버전으로 확인하는가?
5. 서버가 여러 인스턴스로 실행될 때도 같은 규칙이 적용되는가?
6. 클라이언트가 타임아웃 뒤 요청을 다시 보내도 중복되지 않는가?

해결 방법은 상황에 따라 달라진다.

| 상황                      | 우선 검토할 방법              |
| ------------------------- | ----------------------------- |
| 재고·잔액·카운터 증감     | 조건을 포함한 원자적 `UPDATE` |
| 여러 테이블 변경의 일관성 | 트랜잭션과 필요한 행 잠금     |
| 편집 충돌 감지            | 버전 번호를 이용한 낙관적 락  |
| 중복 생성 방지            | 유일성 제약과 `ON CONFLICT`   |
| 재전송되는 요청 처리      | 멱등성 키와 결과 저장         |
| 최신 검색 결과만 반영     | 요청 ID 비교 또는 취소 처리   |

Race Condition은 타이밍이 나쁜 날에만 나타나는 운이 나쁜 버그가 아니다. 시스템이 허용하는 상태와, 그 상태로 들어가는 경로를 코드가 명확히 제한하지 않았을 때 생기는 설계 문제에 가깝다.

그래서 먼저 락을 붙이기보다 어떤 값이 절대로 음수가 되면 안 되는지, 같은 결제가 두 번 생성되면 안 되는지, 누가 먼저 저장했는지를 정해야 한다. 그 규칙을 애플리케이션의 `if` 문에만 두지 않고 데이터베이스의 원자적 연산, 제약 조건, 버전 검증으로 옮겨 두면 실행 순서가 달라져도 결과가 흔들리지 않는다.
