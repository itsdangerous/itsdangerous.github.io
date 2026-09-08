---
title: "Test"
description: "Test"
pubDate: 2026-09-08T01:00:00.000Z
category: "Study"
tags: []
slug: "test"
draft: false
---

## Public API `verification_report.amended` 고객 설정 및 공개 계약 설계

## 목적

고객이 Developer Settings에서 `verification_report.amended`를 선택·저장·수정하고,
Public API catalog 및 고객 문서에서 payload 계약을 확인할 수 있는 상태까지 구현한다.
향후 완료된 리포트의 운영 보정이 확정되면 이 이벤트로 최신 결과를 알린다.

새 이벤트 이름은 `verification_report.amended`이며, 최초 완료를 나타내는
`verification_report.succeeded`를 재전송하거나 과거 delivery body를 변경하지 않는다.

## 이번 구현의 완료 범위

구독 저장은 endpoint의 수신 필터를 저장하는 작업이다. 이벤트 등록, catalog 공개,
구독 선택만으로 payload/outbox row가 생성되거나 HTTP 전송이 시작되지 않는다.
따라서 이번 단계에서 사용자 설정과 고객 문서를 정식 공개할 수 있다.

| 포함                                                           | 제외                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| Backend event 등록 및 구독 생성·수정·조회                      | 실제 report repair/promotion 실행 및 연결                     |
| Front event 선택 UI, 저장·재조회, 설명 및 이벤트 수 표시       | 실제 보정 데이터를 갱신하는 service/command                   |
| Public catalog/schema와 영문·국문 고객 문서                    | lifecycle hook, signal, worker, sandbox에서 amended 자동 발생 |
| Payload builder, 버전별 identity 및 명시적 enqueue helper 준비 | 실제 고객 Job에 amended outbox 생성 또는 webhook 전송         |
| APIJob 보정 metadata 및 GET 응답 계약 준비                     | 실제 report/PDF 교체 및 보정 version 증가 실행                |
| 격리된 테스트 DB와 mock HTTP를 통한 동작 검증                  | 이번 문서 작업에서 commit/push/deploy 실행                    |

설정 가능 상태의 배포와 실제 발행 경로 연결은 독립된 단계다. 이번 구현의
enqueue helper는 테스트에서만 호출하며 운영 실행 경로에는 연결하지 않는다.
별도 공개 차단 flag나 사용자 승인 UI는 추가하지 않는다.

## 고객 계약

아래는 향후 발행될 payload의 축약 예시다. 실제 builder/schema에는 기존 공통
필드(usage group, credit, 작업 시각)와 전체 PDF metadata도 포함한다.

```json
{
  "event": "verification_report.amended",
  "version": "2",
  "data": {
    "id": "11111111-2222-3333-4444-555555555555",
    "status": "succeeded",
    "progress": 1.0,
    "amended": true,
    "amended_at": "2026-09-08T01:00:00Z",
    "amendment_version": 1,
    "amendment_reason": "artifact_and_payload_correction",
    "result": { "report": {} },
    "pdf": { "status": "completed", "file_size": 12345 },
    "light_pdf": { "status": "completed", "file_size": 6789 }
  }
}
```

- `status`는 계속 `succeeded`다. `amended`는 APIJob lifecycle status가 아니다.
- `result`는 보정된 최신 report 결과를 담는다.
- `pdf`와 `light_pdf`는 기존 PDF webhook과 동일하게 metadata만 담고
  `download_url`은 포함하지 않는다.
- 고객은 이벤트 수신 뒤 `GET /api/public/v1/reports/{id}/`를 호출해 최신
  결과와 새 presigned URL을 조회한다.
- `amendment_version`은 같은 Job의 보정마다 `1`, `2`, ...로 증가한다.

## Event identity가 필요한 이유

webhook outbox는 같은 이벤트를 같은 endpoint에 중복으로 만들지 않도록
`event_identity`를 deduplication key로 사용한다.

현재 identity는 `event_type`과 `milestone`만으로 생성된다.

```text
v2:verification_report.succeeded:milestone:none
v2:verification_report.progress:milestone:0.5
```

이 규칙을 amended 이벤트에 그대로 적용하면 첫 번째 보정과 두 번째 보정이
둘 다 아래와 같은 identity를 가지게 된다.

```text
v2:verification_report.amended:milestone:none
```

첫 번째 delivery가 이미 존재하므로 두 번째 enqueue는 중복으로 판단되어
새 delivery를 만들지 않는다. 고객은 두 번째 보정 사실을 받지 못한다.

따라서 amended 이벤트만큼은 보정 버전을 identity에 포함해야 한다.

```text
v2:verification_report.amended:amendment:1
v2:verification_report.amended:amendment:2
```

이렇게 하면 다음 두 조건을 동시에 만족한다.

| 상황                             | 결과                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| 같은 보정 version을 다시 enqueue | 같은 identity이므로 중복 최초 delivery를 만들지 않음             |
| 실패한 HTTP 전송을 retry         | 같은 identity와 body를 유지하고 attempt가 증가한 delivery를 생성 |
| 다음 보정 version을 publish      | 다른 identity이므로 새 immutable payload와 delivery를 생성       |

이는 `WebhookEventPayload`의 `(api_job, event_identity)` unique constraint와
`WebhookDelivery`의 `(api_job, event_identity, webhook_endpoint, attempt)`
unique constraint가 보호하는 범위와 일치한다.

## Backend 변경 범위

| 영역              | 파일                                           | 변경                                                                                                                                                  |
| ----------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event registry    | `public_api/services/webhook_delivery.py`      | `V2_EVENT_TYPES`에 event 추가                                                                                                                         |
| Identity/outbox   | `public_api/services/webhook_delivery.py`      | amendment version을 받을 수 있도록 `_event_identity`, `_event_payload_for`, `_bulk_enqueue`, `enqueue_event` 확장 또는 `enqueue_amended_event()` 추가 |
| Payload           | `public_api/services/webhook_delivery.py`      | `_v2_amended_payload()`와 `_PAYLOAD_BUILDERS` 등록                                                                                                    |
| Event catalog     | `public_api/services/webhook_events.py`        | 설명, trigger, schema, example 추가                                                                                                                   |
| 구독 검증         | `public_api/serializers/internal/webhooks.py`  | 목록은 `V2_EVENT_TYPES`에서 파생되므로 registry 변경 후 amended 구독 허용 테스트 추가                                                                 |
| 보정 상태         | `public_api/models/api_job.py`, 신규 migration | `amended=false`, `amended_at=null`, `amendment_version=0`, `amendment_reason=""` 기본값 추가. 이번 단계에서는 실제 보정값 갱신 경로 없음              |
| Result read-back  | `public_api/services/api_result_mapper.py`     | 기존 effective mapper를 재사용. 별도 보정 실행 helper는 추가하지 않음                                                                                 |
| GET Report        | `public_api/serializers/public/reports.py`     | 상세 응답에 네 보정 metadata를 read-only로 추가하고 schema help text 제공                                                                             |
| 향후 Publish 지점 | repair/promotion service 또는 command          | 이번 범위 제외. 이후 별도 구현에서 enqueue helper 연결                                                                                                |

Identity는 payload와 delivery에 동일한 값을 전달한다. amended에 일반
`milestone:none` identity가 사용되지 않도록 일반 enqueue 경로에서도 양수 보정
version을 검증하거나 전용 helper 사용을 강제한다. 기존 이벤트의 identity는 유지한다.
Retry는 저장된 identity/body를 복사하며 현재 Job의 최신 version으로 재생성하지 않는다.

## 향후 발행 경로 연결 시 요구사항 — 이번 구현 제외

보정 publish 순서는 다음을 지킨다.

```text
대상 Job 검증
→ VerificationReport / PDF / APIJobResult snapshot 갱신
→ amendment_version 증가 및 amended metadata 저장
→ verification_report.amended outbox enqueue
→ 고객 delivery
```

고객이 webhook을 받은 시점에는 GET API에서 반드시 같은 보정 결과를 읽을 수
있어야 한다. 따라서 event enqueue는 promotion 데이터가 durable해진 뒤 같은
transaction 안에서 수행하거나, commit 후 안전하게 enqueue해야 한다.

## Frontend 변경 범위

| 영역                        | 파일                                                                  | 변경                                                 |
| --------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| 타입/공용 목록              | `ManuscriptConverter_front/src/types/publicApi.ts`                    | `WebhookEventName`, `V2_WEBHOOK_EVENTS` 추가         |
| endpoint 생성·수정          | `src/views/enterprise/DeveloperSettings/WebhookSecretCreateModal.vue` | Report lifecycle event 그룹에 추가                   |
| endpoint 목록 firehose 표시 | `src/views/enterprise/DeveloperSettings/WebhooksPanel.vue`            | `WEBHOOK_EVENT_NAMES`에 추가                         |
| event 설명                  | `src/locales/*/enterprise.json`                                       | `eventDescriptions.verification_report.amended` 추가 |
| UI 회귀 테스트              | `DeveloperSettingsDropdowns.test.ts` 등                               | selector에 표시되고 선택/수정 시 보존되는지 검증     |

기존 endpoint의 동작은 변경하지 않는다.

- `subscribed_events=[]`인 firehose endpoint는 향후 새 이벤트가 발생하면 수신한다.
- 특정 event를 명시적으로 선택한 endpoint는 `verification_report.amended`를
  별도로 선택해야 수신한다.

기존 명시 구독 목록에는 amended를 자동 추가하지 않는다. 기존 endpoint를 열어
URL/설명만 수정해도 선택하지 않은 amended가 추가되지 않아야 한다.
UI 설명은 “완료된 리포트가 보정되었을 때 최신 결과를 알립니다.”로 제공한다.
현재 모달은 설명이 없으면 설명 줄을 숨기므로 지원 locale마다 새 설명을 추가한다.

## Public API 문서 변경 범위

| 표면              | 파일                                                             | 변경                                                           |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| 기계 판독 catalog | `public_api/services/webhook_events.py`                          | 새 event가 `GET /api/public/v1/webhooks/events/`에 자동 노출됨 |
| OpenAPI 소개      | `public_api/docs/openapi_description.md`, `.ko.md`               | event 의미, polling/read-back, subscription 규칙 설명          |
| Webhook guide     | `templates/public_api/docs/webhook_setup_guide.html`, `.ko.html` | event 목록, handler 예시, 기존 succeeded와의 차이 설명         |
| GET schema        | `public_api/serializers/public/reports.py`                       | 네 보정 metadata의 기본값과 의미를 자동 schema에 반영          |

`public_api/schema_localization.py`은 GET response field 설명을 언어별로 별도
덮어쓰는 경우에만 수정한다.

Catalog trigger는 “완료된 리포트의 보정 확정 시”로 설명하고, 고객 문서에는
“구독을 미리 설정할 수 있으며, 실제 보정 이벤트가 발생할 때만 전달됩니다.”를 명시한다.
구독 저장 즉시 발송, 최초 성공 시 항상 발송, sandbox 자동 발생을 약속하지 않는다.
`amendment_version`은 보정 횟수이고 `report_version`은 산출물 명세 버전임을 구분한다.

## 테스트

아래 발행/전송 검증은 격리된 테스트 DB와 mock HTTP에서 수행한다.

- amended payload가 catalog JSON Schema와 일치하는지
- explicit amended subscription endpoint만 amended delivery를 받는지
- firehose endpoint가 amended delivery를 받는지
- `amendment_version=1`의 재-enqueue가 중복 최초 delivery를 만들지 않는지
- HTTP retry가 같은 identity/body로 다음 attempt row를 만드는지
- `amendment_version=2`가 새 immutable payload와 delivery를 만드는지
- 기존 `verification_report.succeeded` payload/delivery가 변경되지 않는지
- 보정 fixture에서 builder와 GET Report API가 동일한 report/PDF metadata를 반환하는지
- endpoint 생성·수정·재조회에서 amended 선택이 유지되는지
- 구독 저장 및 기존 live/sandbox lifecycle 실행이 amended payload/outbox를 생성하지 않는지
- OpenAPI 및 webhook guide의 영문·국문 응답에서 새 계약이 노출되는지
- 실제 브라우저에서 생성/수정, 기존 명시 구독 유지, firehose 이벤트 수를 확인하는지

Backend는 `make test-fast`를 관련 Public API 테스트로 좁혀 실행하고, frontend는
관련 component 테스트와 타입/빌드를 확인한다. 기존 문서/schema endpoint 테스트도
확장한다. 외부 모델 호출이나 실제 고객 webhook 전송은 검증에 필요하지 않다.
