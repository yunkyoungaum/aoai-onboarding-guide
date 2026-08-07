/**
 * ─────────────────────────────────────────────────────────────
 *  가이드 목록 (Single Source of Truth)
 * ─────────────────────────────────────────────────────────────
 *  새 가이드를 추가할 때는 이 파일의 GUIDES 배열에 항목 하나만 추가하세요.
 *  index.html(허브)은 이 배열을 읽어 카드를 자동 생성합니다.
 *
 *  필드 설명
 *   no       : 가이드 번호 (예: "03", "04-1")
 *   slug     : guides/ 하위 폴더명
 *   title    : 카드 제목
 *   summary  : 1~2문장 요약
 *   tags     : 배지로 표시될 키워드 배열
 *   updated  : 최종 수정일 (YYYY-MM-DD)
 *   status   : "published" | "draft"  (draft는 카드에 DRAFT 배지 표시)
 *   source   : (선택) 마크다운 원본 파일명. 있으면 "원본(.md)" 링크 노출
 * ─────────────────────────────────────────────────────────────
 */
window.GUIDES = [
  {
    no: "01",
    slug: "01-oai-to-aoai-onboarding",
    title: "OAI → Azure OpenAI 온보딩 가이드",
    summary:
      "OpenAI를 쓰던 팀이 Azure OpenAI로 전환할 때 필요한 리소스 생성, 인증, 네트워크, 배포 절차를 단계별로 정리했습니다.",
    tags: ["온보딩", "마이그레이션", "인증", "네트워크"],
    updated: "2026-08-05",
    status: "published"
  },
  {
    no: "02",
    slug: "02-aoai-foundations",
    title: "Azure OpenAI 기본 개념 — 리소스 · 배포 · 쿼터 · PTU 신청과 예약",
    summary:
      "리소스와 배포의 관계, 배포 유형 전체 지도, 쿼터와 용량의 차이, PTU 쿼터 신청부터 Azure 예약 구매까지의 순서를 정리했습니다. 헷갈리기 쉬운 개념을 먼저 잡고 싶다면 여기서 시작하세요.",
    tags: ["기본 개념", "쿼터", "용량", "PTU", "예약"],
    updated: "2026-08-07",
    status: "draft",
    source: "source.md"
  },
  {
    no: "03",
    slug: "03-aoai-deployment-monitoring",
    title: "Azure OpenAI 배포 & 운영 모니터링 가이드",
    summary:
      "PTU/표준 배포 설계부터 Diagnostic Settings, 메트릭·KQL, Alert Rule, APIM AI Gateway, 장애 대응 Runbook까지 운영 관측 체계를 다룹니다.",
    tags: ["모니터링", "PTU", "KQL", "Alert", "APIM"],
    updated: "2026-08-06",
    status: "published",
    source: "source.md"
  },
  {
    no: "04",
    slug: "04-aoai-high-availability",
    title: "Azure OpenAI 고가용성(HA) 아키텍처 가이드",
    summary:
      "장애 유형 분류부터 Spillover, APIM 백엔드 풀·서킷 브레이커, 멀티 리전 Failover, 쿼터 확보, 성능 저하 모드, Failover 훈련까지 가용성 설계를 다룹니다.",
    tags: ["HA", "Failover", "Spillover", "APIM", "멀티 리전"],
    updated: "2026-08-07",
    status: "draft",
    source: "source.md"
  },
  {
    no: "04-1",
    slug: "04-1-aoai-ha-summary",
    title: "Azure OpenAI 고가용성(HA) — 핵심 요약",
    summary:
      "가이드 04의 5분 압축판. 배경과 코드를 걷어내고 의사결정에 필요한 결론만 담았습니다. 엔드포인트 vs 용량 이중화 구분, PTU 3종, Spillover 페어링, 체크리스트 중심.",
    tags: ["HA", "요약", "체크리스트", "PTU", "Spillover"],
    updated: "2026-08-07",
    status: "draft",
    source: "source.md"
  }
];
