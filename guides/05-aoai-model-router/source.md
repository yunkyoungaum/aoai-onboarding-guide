# Azure OpenAI Model Router 가이드 — 요청별 모델 자동 선택으로 비용과 지연 줄이기

> 🚧 **WIP / Draft** &nbsp;·&nbsp; 계속 갱신 중인 문서입니다. 모델 목록·리전·가격은 배포 전 공식 문서로 재확인하세요.
>
> **대상** &nbsp;·&nbsp; 여러 모델 사이에서 품질과 비용을 저울질하며 라우팅 로직을 직접 짜고 있는 애플리케이션·플랫폼 팀
>
> **범위** &nbsp;·&nbsp; 개념 → 라우팅 모드 → 포털 배포 → 호출·검증 → 운영·거버넌스 → 관측과 비용
>
> **관련 가이드** &nbsp;·&nbsp; [01 온보딩](../01-oai-to-aoai-onboarding/) · [02 기본 개념](../02-aoai-foundations/) · [03 배포 & 운영 모니터링](../03-aoai-deployment-monitoring/) · [04 고가용성(HA)](../04-aoai-high-availability/) · [06 캐시 성능 최적화](../06-aoai-cache-performance/)

---

## 0. TL;DR

**Model router는 프롬프트를 실시간으로 분석해 가장 적합한 모델로 라우팅하는, 그 자체가 학습된 모델입니다.** 하나의 배포(deployment)처럼 다루면 되고, 쉬운 요청은 작고 싼 모델로, 어려운 요청은 큰 모델·추론 모델로 보내 **비용과 지연을 줄이면서 품질을 유지**합니다.

| 질문 | 답 |
|---|---|
| 하부 모델을 따로 배포해야 하나? | **아니요.** 단 **Claude(Anthropic)** 만 예외로 사전 배포 필요 |
| 추가 요금이 있나? | 없음. **선택된 하부 모델의 토큰 요금 합산**으로 과금 |
| 어떤 모델이 응답했는지 알 수 있나? | 응답 JSON의 **`model` 필드**와 Playground에 표시됨 |
| 라우팅 대상을 제한할 수 있나? | **Model subset**으로 가능 (컴플라이언스·비용·컨텍스트 제어) |
| 최신 버전은? | **`2025-11-18`** — 버전 번호 변경 없이 신규 모델이 계속 추가됨 |

### 최소 도입 순서

1. Foundry 포털에서 `model-router` 배포 (Default = Balanced + 전체 모델 풀)
2. Playground에서 대표 프롬프트를 던져 **어떤 모델이 선택되는지** 확인
3. 기존 단일 모델 배포를 baseline으로 두고 **품질·비용·지연 A/B 비교**
4. 결과에 따라 **routing mode** 또는 **model subset** 중 한 레버만 조정
5. Azure Monitor / Cost analysis에 배포명 필터를 걸어 상시 관측

---

## 1. Model Router란

### 1.1 동작 원리

Model router는 프롬프트의 **복잡도, 추론 필요성, 태스크 유형** 등을 실시간으로 판단하는 경량 ML 모델입니다.

- 프롬프트를 **저장하지 않습니다.**
- 사용자의 **접근 권한과 배포 유형에 맞는 모델만** 후보로 삼고, **데이터 존(data zone) 경계를 준수**합니다.
- 요청 단위로 모델을 고르므로, 같은 애플리케이션 안에서도 요청마다 다른 모델이 응답할 수 있습니다.

### 1.2 언제 쓰고, 언제 쓰지 않나

| 잘 맞는 경우 | 재고해야 하는 경우 |
|---|---|
| 요청 난이도가 **섞여 있는** 워크로드 (챗봇, 고객 지원, 사내 어시스턴트) | 모든 요청이 **동일한 난이도**로 균질한 워크로드 |
| 여러 모델을 비교하며 라우팅 로직을 **직접 구현 중**인 팀 | 특정 모델의 **고유 출력 특성에 강하게 의존**하는 파이프라인 |
| 신규 모델을 빠르게 흡수하고 싶은 팀 | **긴 컨텍스트**가 상시 필요한 워크로드 (§8 참고) |
| 비용 상한은 있으나 품질도 포기할 수 없는 경우 | 응답 모델이 **고정되어야 하는** 규제·감사 요건 |

> 💡 Model router는 "드롭인 배포"인 동시에 **최적화 레이어**입니다. 모델 탐색(hill-climbing)에 드는 시간을 줄여줄 뿐, 평가를 대체하지는 않습니다.

---

## 2. 라우팅 모드

배포 시 **routing mode**로 라우팅 로직의 성향을 정합니다. 지정하지 않으면 **Balanced**가 기본값입니다.

| 모드 | 동작 | 적합한 워크로드 |
|---|---|---|
| **Balanced** (기본) | 최고 품질 모델 대비 **약 1~2% 품질 밴드** 안에서 가장 저렴한 모델 선택 | 범용 |
| **Cost** | **약 5~6% 품질 밴드**까지 허용하고 최저 비용 우선 | 대량·예산 민감 (분류, 단순 Q&A) |
| **Quality** | 비용을 무시하고 해당 프롬프트에 **최고 품질** 모델 선택 | 법률 검토, 의료 요약, 복잡 추론 |

> ⚠️ 라우팅 모드 변경은 반영까지 **최대 5분** 걸립니다.

---

## 3. 지원 모델과 리전

### 3.1 버전 정책

| 버전 | 상태 | 설명 |
|---|---|---|
| `2025-11-18` | **Active (latest)** | 신규 모델·기능이 **버전 번호 변경 없이 in-place로 추가** |
| `2025-08-07` | Frozen | 모델 세트 고정 |
| `2025-05-19` | Frozen | 모델 세트 고정 |

배포 시 **Auto-update**를 켜면 신규 버전이 자동 적용됩니다. 이때 **하부 모델 구성이 바뀌면서 성능과 비용도 함께 변할 수 있다**는 점을 감안하세요.

### 3.2 라우팅 풀 (`2025-11-18` 기준)

| 제공자 | 모델 |
|---|---|
| OpenAI | `gpt-5.6-sol` / `-terra` / `-luna`, `gpt-5.5`, `gpt-5.4` · `-mini` · `-nano`, `gpt-5.2`, `gpt-5` · `-mini` · `-nano`, `o4-mini`, `gpt-4.1` · `-mini` · `-nano`, `gpt-4o` · `-mini`, `gpt-oss-120b` |
| Anthropic | `claude-opus-4-8` / `4-7` / `4-6`, `claude-sonnet-4-5`, `claude-haiku-4-5` |
| xAI | `grok-4`, `grok-4-1-fast-reasoning` |
| DeepSeek | `DeepSeek-V3.2` |
| Meta | `Llama-4-Maverick-17B-128E-Instruct-FP8` |

> ⚠️ **Claude 모델만 예외입니다.** 라우팅 풀에 포함하려면 **같은 Foundry 계정에 동일한 SKU로 먼저 배포**해야 합니다. 배포하지 않고 `routing.models`에 넣으면 `InvalidResourceProperties` 오류가 납니다.

### 3.3 리전

**Global Standard**는 Korea Central을 포함해 28개 리전에서 지원되며, 그중 대부분이 **Data Zone Standard**도 지원합니다. 다만 **각 리전에서 라우팅 가능한 모델은 그 리전에 존재하는 하부 모델로 한정**됩니다 — 리전마다 실효 라우팅 풀이 다를 수 있습니다.

---

## 4. 배포 — 포털(UI) 절차

### 4.1 사전 준비

- [Microsoft Foundry 포털](https://ai.azure.com) 로그인 → 우측 상단 **New Foundry 토글 ON**
- Foundry 리소스(또는 프로젝트) 준비
- Claude를 라우팅에 포함하려면 **모델 카탈로그에서 Claude 먼저 배포**
- Azure Policy로 모델 배포를 통제하는 조직이라면, 허용 게시자에 **`Microsoft`**(model router의 게시자)와 포함할 모델의 게시자(예: `Anthropic`)가 모두 있어야 합니다. 없으면 배포가 차단됩니다.

### 4.2 기본 배포 (Default settings)

1. 좌측 **Model catalog** → `model-router` 검색 → 선택 → **Deploy**
2. 배포 정보 입력
    - **Deployment name** — 예: `model-router-deployment`
    - **Deployment type** — `Global Standard` 또는 `Data Zone Standard`
    - **Model version** — `2025-11-18`
    - **Auto-update** — 신규 버전 자동 적용 여부
    - **Content filter / TPM** — ⚠️ **여기서 한 번만** 설정합니다
3. **Default settings** 선택 → **Balanced 모드 + 전체 지원 모델 풀**
4. **Deploy**

> ⚠️ 콘텐츠 필터와 분당 토큰(TPM) 한도는 **model router 배포 단위**에 적용됩니다. 하부 모델별로 따로 설정하지 마세요. 하부 모델을 별도로 배포할 필요도 없습니다(Claude 제외).

### 4.3 커스텀 배포 (Custom settings)

**① Routing mode 드롭다운** — `Balanced` / `Quality` / `Cost` 중 선택 (§2)

**② Route to a subset of models** — 라우팅에 쓸 하부 모델을 직접 선택

- 최소 1개 필요. **페일오버를 살리려면 2개 이상**을 고르세요 (§6.1)
- 아무것도 고르지 않으면 해당 모드의 기본 모델 세트를 사용
- **나중에 추가되는 신규 모델은 자동 포함되지 않습니다** — 명시적으로 추가해야 합니다
- 긴 컨텍스트가 필요하면 여기서 **큰 컨텍스트 모델만** 선택하세요 (§8)
- 반영까지 최대 5분

### 4.4 REST API 배포 (자동화용)

```bash
export AZURE_AI_AUTH_TOKEN=$(az account get-access-token \
  --resource https://management.azure.com --query accessToken -o tsv)
```

기본 배포:

```bash
curl -X PUT "https://management.azure.com/subscriptions/<SUB_ID>/resourceGroups/<RG>/providers/Microsoft.CognitiveServices/accounts/<ACCOUNT>/deployments/model-router-deployment?api-version=2025-10-01-preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AZURE_AI_AUTH_TOKEN" \
  -d '{
    "sku": {"name": "GlobalStandard", "capacity": 10},
    "properties": {
      "model": {"format": "OpenAI", "name": "model-router", "version": "2025-11-18"}
    }
  }'
```

라우팅 모드 + 모델 서브셋 지정:

```bash
  -d '{
    "sku": {"name": "GlobalStandard", "capacity": 10},
    "properties": {
      "model": {"format": "OpenAI", "name": "model-router", "version": "2025-11-18"},
      "routing": {
        "mode": "balanced",
        "models": [
          {"format": "OpenAI", "name": "gpt-4.1",     "version": "2025-04-14"},
          {"format": "OpenAI", "name": "gpt-5.6-sol", "version": "2026-07-09"},
          {"format": "Meta",   "name": "Llama-4-Maverick-17B-128E-Instruct-FP8", "version": "1"}
        ]
      }
    }
  }'
```

> 💡 `routing` 블록은 **기본값을 바꿀 때만** 넣으면 됩니다. 이 REST 경로는 Foundry 프로젝트 없이 계정 리소스에 직접 배포하므로 기존 고객의 자동화에 적합합니다.

---

## 5. 호출과 검증

### 5.1 코드에서 호출

일반 chat 모델과 **완전히 동일하게** 호출합니다. `model` 파라미터에 **배포 이름**을 넣으면 끝입니다.

```python
# Chat Completions (openai>=1.75.0)
response = client.chat.completions.create(
    model=deployment,                     # model router 배포 이름
    messages=[{"role": "user", "content": "..."}],
)

# Foundry Responses (azure-ai-projects>=2.0.0)
response = openai_client.responses.create(model=deployment, input="...")
```

### 5.2 어떤 모델이 응답했는지 확인

응답 JSON은 표준 chat completions 스키마와 동일하며, **`model` 필드가 실제 선택된 하부 모델**을 알려줍니다.

```json
{
  "model": "gpt-5-mini-2025-08-07",
  "usage": {
    "prompt_tokens": 3254,
    "prompt_tokens_details": { "cached_tokens": 3200 },
    "completion_tokens": 163,
    "completion_tokens_details": { "reasoning_tokens": 128 }
  }
}
```

Playground(**Models + endpoints** → 배포 선택)에서도 응답마다 선택된 모델이 표시됩니다.

### 5.3 파라미터 주의

| 파라미터 | 동작 |
|---|---|
| `temperature`, `top_p`, `stop`, `presence_penalty`, `frequency_penalty`, `logit_bias`, `logprobs` | 추론(o-series) 모델이 선택되면 **무시됨**. 그 외 모델에서는 정상 적용 |
| `reasoning_effort` | `2025-11-18` 버전부터 **지원** — 추론 모델이 선택되면 그대로 전달됨 |

---

## 6. 운영 — 페일오버 · 캐싱 · 거버넌스

### 6.1 자동 페일오버

특정 모델에 일시적 문제가 생기면 **다음으로 적합한 모델로 투명하게 재라우팅**됩니다. 기본 활성이며 별도 설정이 필요 없습니다.

- 커스텀 배포에서도 **선택한 routing mode가 페일오버 중에도 그대로 적용**됩니다.
- **model subset이 곧 fallback set**입니다. 승인되지 않은 모델로 프롬프트가 흘러가는 것을 막아주는 대신, **1개만 선택하면 페일오버가 사라집니다.** → 최소 2개 이상 선택하세요.

### 6.2 프롬프트 캐싱

하부 모델이 캐싱을 지원하면 **자동으로 적용**되며 별도 설정이 없습니다. 다만 캐시 효과는 **같은 모델이 연속 요청을 처리할 때만** 발생하므로, 라우팅 결정이 흔들리면 캐시 이득이 끊깁니다.

> 캐시 히트율을 본격적으로 올리려면 [06 캐시 성능 최적화 가이드](../06-aoai-cache-performance/)를 참고하세요. 안정적인 캐시가 중요한 워크로드라면 **model subset을 좁혀 라우팅 변동을 줄이는 것**이 한 가지 레버가 됩니다.

### 6.3 Azure Policy 거버넌스

Model router는 일반 모델 배포를 통제하는 **동일한 built-in Foundry 모델 배포 정책**을 따릅니다. 정책은 개발자가 **model subset에 넣을 수 있는 모델 범위**에 적용되며, **Foundry 포털 · REST API · Azure CLI · ARM 템플릿 전반에서 일관되게** 배포 시점에 강제됩니다.

---

## 7. 관측 — 성능과 비용

### 7.1 성능

Azure Portal → 리소스 → **Monitoring > Metrics**

1. **배포 이름**으로 필터
2. 필요하면 **하부 모델별로 split** — 어떤 모델이 트래픽을 얼마나 가져가는지 보입니다

### 7.2 비용

Model router의 비용은 **하부 모델들이 발생시킨 비용의 합**입니다. 라우터 자체의 추가 과금은 없습니다.

Azure Portal → **Cost analysis**

1. Azure 리소스로 필터
2. **Tag** 필터 → 타입 `Deployment` → 값에 **model router 배포 이름** 선택

### 7.3 비용을 줄이는 3가지 레버

| 레버 | 효과 | 트레이드오프 |
|---|---|---|
| Routing mode를 **`Cost`** 로 | 품질 밴드를 5~6%까지 열어 저렴한 모델 비중 ↑ | 품질 소폭 하락 |
| **Model subset**에서 고가 모델 제외 | 비용 상한을 구조적으로 고정 | 어려운 요청의 품질 하락 · 페일오버 폭 축소 |
| **프롬프트 캐싱** 활용 | 입력 토큰 비용·TTFT ↓ | 라우팅이 흔들리면 효과 감소 |

### 7.4 프로덕션 전 평가

**첫 배포는 최종 구성이 아니라 시작 구성**으로 다루세요. 프로덕션 트래픽을 넘기기 전에 기존 모델 배포를 baseline으로 두고 **응답 품질 · 예상 비용 · 지연**을 비교한 뒤, 한 번에 **레버 하나만** 바꾸며 조정합니다. 워크로드 일부는 직접 모델 배포로 남겨두는 하이브리드도 정당한 결론입니다.

---

## 8. 제약과 함정

| 항목 | 내용 | 대응 |
|---|---|---|
| **컨텍스트 윈도우** | **하부 모델 중 가장 작은 모델 기준**으로 제한됨 | model subset으로 큰 컨텍스트 모델만 선택 |
| **파라미터 호환성** | 추론 모델 선택 시 `temperature` 등 무시 | 결정적 출력이 필요하면 subset에서 추론 모델 제외 |
| **응답 모델 비고정** | 요청마다 다른 모델이 응답 | 감사 요건이 있으면 `model` 필드를 로깅 |
| **Auto-update** | 하부 모델 세트가 바뀌며 성능·비용 변동 | 변동을 원치 않으면 auto-update 끄고 subset 고정 |
| **Claude 사전 배포** | 미배포 시 `InvalidResourceProperties` | 같은 계정·SKU로 먼저 배포 |
| **설정 반영 지연** | mode·subset 변경에 최대 5분 | 배포 직후 곧바로 검증하지 말 것 |
| **Rate limit** | TPM은 라우터 배포 단위 | 쿼터 상향 또는 재시도 로직 |

---

## 9. 도입 체크리스트

- ☐ 워크로드의 요청 난이도가 실제로 **섞여 있는지** 확인했다
- ☐ Claude를 쓸 계획이면 **사전 배포**를 마쳤다
- ☐ Azure Policy 허용 게시자에 `Microsoft` + 필요한 게시자가 포함되어 있다
- ☐ Content filter와 **TPM을 라우터 배포 단위로만** 설정했다
- ☐ Model subset을 쓴다면 **모델을 2개 이상** 선택해 페일오버를 유지했다
- ☐ 최소 컨텍스트 윈도우가 워크로드 요구를 **충족**하는지 확인했다
- ☐ 응답의 **`model` 필드를 로깅**해 모델 분포를 추적하고 있다
- ☐ baseline 대비 **품질 · 비용 · 지연 평가**를 마쳤다
- ☐ Azure Monitor 메트릭과 **Cost analysis 태그 필터**를 설정했다

---

## 참고 자료

- Model router 개념: https://learn.microsoft.com/azure/foundry/openai/concepts/model-router
- 라우팅 동작 원리: https://learn.microsoft.com/azure/foundry/openai/concepts/model-router-how-it-works
- 배포와 사용 방법: https://learn.microsoft.com/azure/foundry/openai/how-to/model-router
- 워크로드 평가: https://learn.microsoft.com/azure/foundry/openai/how-to/evaluate-model-router
- Foundry 에이전트와 함께 쓰기: https://learn.microsoft.com/azure/foundry/openai/how-to/model-router-agents
- Azure Policy로 거버넌스: https://learn.microsoft.com/azure/foundry/how-to/model-router-policy
- Claude 모델 배포: https://learn.microsoft.com/azure/foundry/foundry-models/how-to/use-foundry-models-claude
- 프롬프트 캐싱: https://learn.microsoft.com/azure/foundry/openai/how-to/prompt-caching
- 쿼터와 한도: https://learn.microsoft.com/azure/foundry/openai/quotas-limits
- Azure OpenAI 가격: https://azure.microsoft.com/pricing/details/cognitive-services/openai-service/
- Python 샘플: https://github.com/microsoft-foundry/foundry-samples/tree/main/samples/python/foundry-models/model-router
