/**
 * ─────────────────────────────────────────────────────────────
 *  가이드 목록 (Single Source of Truth)
 * ─────────────────────────────────────────────────────────────
 *  새 가이드를 추가할 때는 이 파일의 GUIDES 배열에 항목 하나만 추가하세요.
 *  index.html(허브)은 이 배열을 읽어 카드를 자동 생성합니다.
 *
 *  필드 설명
 *   no       : 가이드 번호 (2자리 문자열, 예: "03")
 *   slug     : guides/ 하위 폴더명 (예: "03-my-new-guide")
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
    slug: "02-aoai-deployment-monitoring",
    title: "Azure OpenAI 배포 & 운영 모니터링 가이드",
    summary:
      "PTU/표준 배포 설계부터 Diagnostic Settings, 메트릭·KQL, Alert Rule, APIM AI Gateway, 장애 대응 Runbook까지 운영 관측 체계를 다룹니다.",
    tags: ["모니터링", "PTU", "KQL", "Alert", "APIM"],
    updated: "2026-08-05",
    status: "published",
    source: "source.md"
  }
];
