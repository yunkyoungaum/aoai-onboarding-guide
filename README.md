# Azure OpenAI 실무 가이드 모음

현장에서 반복적으로 마주치는 Azure OpenAI 설계·운영 주제를 **가이드 단위**로 정리하는 저장소입니다.

🔗 **사이트**: <https://yunkyoungaum.github.io/aoai-onboarding-guide/>

---

## 가이드 목록

| No | 가이드 | 주제 | 링크 |
|----|--------|------|------|
| 01 | OAI → Azure OpenAI 온보딩 가이드 | 온보딩, 마이그레이션, 인증, 네트워크 | [보기](https://yunkyoungaum.github.io/aoai-onboarding-guide/guides/01-oai-to-aoai-onboarding/) |
| 02 | Azure OpenAI 기본 개념 *(draft)* | 리소스·배포·쿼터·용량·PTU 신청·예약 구매 | [보기](https://yunkyoungaum.github.io/aoai-onboarding-guide/guides/02-aoai-foundations/) |
| 03 | Azure OpenAI 배포 & 운영 모니터링 가이드 | 모니터링, PTU, KQL, Alert, APIM | [보기](https://yunkyoungaum.github.io/aoai-onboarding-guide/guides/03-aoai-deployment-monitoring/) |
| 04 | Azure OpenAI 고가용성(HA) 아키텍처 가이드 | HA, Failover, Spillover, 멀티 리전 | [보기](https://yunkyoungaum.github.io/aoai-onboarding-guide/guides/04-aoai-high-availability/) |
| 05 | Azure OpenAI Model Router 가이드 *(draft · WIP)* | 모델 라우팅, 비용 최적화, 배포, 거버넌스 | [보기](https://yunkyoungaum.github.io/aoai-onboarding-guide/guides/05-aoai-model-router/) |
| 06 | Azure OpenAI 캐시 성능 최적화 가이드 *(draft · WIP)* | 프롬프트 캐싱, TTFT, 비용 최적화, PTU, APIM | [보기](https://yunkyoungaum.github.io/aoai-onboarding-guide/guides/06-aoai-cache-performance/) |

### 읽는 순서 추천

```
처음이라면        01 온보딩 → 02 기본 개념
운영 준비 중이면   02 기본 개념 → 03 모니터링
가용성 설계 중이면 04 고가용성
비용 최적화라면    05 Model Router
성능·비용 튜닝이면 06 캐시 성능 최적화
```

> 목록의 **정본(Single Source of Truth)은 [`guides.js`](guides.js)** 입니다.
> 루트 `index.html`(허브)은 이 파일을 읽어 카드를 자동 생성하므로, 허브 HTML을 직접 수정할 필요가 없습니다.

---

## 저장소 구조

```
.
├── index.html                  # 허브(랜딩) 페이지 — guides.js를 읽어 카드 자동 생성
├── guides.js                   # ★ 가이드 목록 정본. 새 가이드는 여기에 항목 추가
├── assets/
│   └── guide-nav.js            # 각 가이드 상단의 "← 가이드 목록" 링크 (공통)
├── guides/
│   ├── 01-oai-to-aoai-onboarding/
│   │   └── index.html
│   ├── 02-aoai-foundations/
│   │   ├── index.html
│   │   └── source.md
│   ├── 03-aoai-deployment-monitoring/
│   │   ├── index.html
│   │   └── source.md
│   ├── 04-aoai-high-availability/
│   │   ├── index.html
│   │   └── source.md
│   ├── 05-aoai-model-router/           # draft / WIP
│   │   ├── index.html
│   │   └── source.md
│   ├── 06-aoai-cache-performance/      # draft / WIP
│   │   ├── index.html
│   │   └── source.md
│   ├── 02-aoai-deployment-monitoring/   # 리다이렉트 스텁 (구 번호 → 03)
│   ├── 03-aoai-high-availability/       # 리다이렉트 스텁 (구 번호 → 04)
│   ├── 05-aoai-cache-performance/       # 리다이렉트 스텁 (구 번호 → 06)
│   └── _template/
│       └── index.html          # 새 가이드 시작용 빈 템플릿
└── README.md
```

### 번호 변경 이력

2026-08-07에 기본 개념 가이드를 02로 추가하면서 이후 번호를 한 칸씩 밀었습니다.
2026-08-31에 Model Router 가이드를 05로 추가하면서 캐시 성능 가이드를 06으로 옮겼습니다.
이전에 공유된 링크가 깨지지 않도록 **구 경로에 리다이렉트 스텁**을 남겨두었습니다.

| 이전 | 현재 |
|---|---|
| `02-aoai-deployment-monitoring` | `03-aoai-deployment-monitoring` |
| `03-aoai-high-availability` | `04-aoai-high-availability` |
| `05-aoai-cache-performance` | `06-aoai-cache-performance` |

---

## 새 가이드 추가하는 방법

### 1단계 — 폴더 만들기

`guides/` 아래에 `<번호>-<영문 슬러그>` 형식으로 폴더를 만듭니다.

```bash
cp -r guides/_template guides/05-rag-design-patterns
```

### 2단계 — 문서 작성

`guides/05-rag-design-patterns/index.html`을 편집합니다.

- 템플릿에는 **Clawpilot 테마 변수(`--cp-*`)** 와 테마 자동 감지 스크립트가 이미 포함되어 있습니다.
- 색상은 반드시 `var(--cp-*)` 변수를 사용하고, 하드코딩된 hex 값은 쓰지 마세요.
- 문서 하단의 `<script src="../../assets/guide-nav.js"></script>` 는 **삭제하지 마세요** (목록으로 돌아가는 링크).
- 마크다운으로 작성했다면 원본을 같은 폴더에 `source.md`로 함께 커밋하면 유지보수가 편합니다.

### 3단계 — `guides.js`에 항목 추가

```js
window.GUIDES = [
  // ... 기존 항목 ...
  {
    no: "05",
    slug: "05-rag-design-patterns",
    title: "RAG 설계 패턴 가이드",
    summary: "청킹 전략, 하이브리드 검색, 재순위화, 평가 지표까지 RAG 파이프라인 설계 선택지를 정리합니다.",
    tags: ["RAG", "AI Search", "평가"],
    updated: "2026-09-01",
    status: "published",   // 작성 중이면 "draft"
    source: "source.md"    // 마크다운 원본이 없으면 이 줄 생략
  }
];
```

| 필드 | 설명 |
|------|------|
| `no` | 가이드 번호 (정렬 기준). 하위 문서가 필요하면 `04-1` 형식 사용 가능 |
| `slug` | `guides/` 하위 폴더명과 **정확히 일치**해야 함 |
| `title` | 카드 제목 |
| `summary` | 1~2문장 요약 |
| `tags` | 배지로 표시될 키워드 배열 (허브 검색에도 사용) |
| `updated` | 최종 수정일 `YYYY-MM-DD` |
| `status` | `published` 또는 `draft` (draft는 배지 표시) |
| `source` | (선택) 마크다운 원본 파일명 |

### 4단계 — README 표에 한 줄 추가하고 커밋

```bash
git add .
git commit -m "docs: add guide 05 - RAG design patterns"
git push
```

GitHub Pages가 자동 배포합니다(보통 1~5분).

> **번호를 바꿔야 한다면** `git mv`로 폴더를 옮기고, 구 경로에 리다이렉트 스텁을 남기세요. 기존에 공유된 링크가 깨집니다.

---

## 로컬 미리보기

`index.html`은 `guides.js`를 `<script src>`로 읽으므로 `file://`로 열어도 동작합니다.
다만 실제 배포 환경과 동일하게 확인하려면 로컬 서버를 쓰는 편이 안전합니다.

```bash
python -m http.server 8000
# → http://localhost:8000
```

---

## 작성 규칙

1. **테마 일관성** — 모든 가이드는 `--cp-*` CSS 변수를 사용합니다. 색상 하드코딩 금지.
2. **폰트** — `"Segoe UI", Aptos, Calibri, ...` / 코드는 `Consolas, "Courier New", ...`
3. **자기완결형(self-contained)** — 가이드 1개는 HTML 파일 1개로 완결되게 유지합니다. 공통 자산은 `assets/`에만 둡니다.
4. **검증 가능한 내용** — 메트릭명·API 이름·정책명 등은 공식 문서로 확인한 값을 사용하고, 참고 링크를 문서 말미에 남깁니다.
5. **가용성 표를 신뢰** — 배포 유형 × 리전 가용성은 개념 문서가 아니라 모델 리전 가용성 표로 확인합니다.
6. **번호는 재사용하지 않음** — 가이드를 폐기해도 번호는 비워두고 다음 번호를 씁니다.
