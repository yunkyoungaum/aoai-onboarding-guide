/**
 * 가이드 공통 네비게이션
 * 각 가이드 문서 하단에 아래 한 줄을 추가하면 "가이드 목록으로" 링크가 삽입됩니다.
 *   <script src="../../assets/guide-nav.js"></script>
 * 별도의 마크업 수정 없이 동작하며, 문서 본문 스타일에 영향을 주지 않습니다.
 */
(function () {
  if (document.getElementById("guide-nav-back")) return;

  var css = [
    "#guide-nav-back{",
    "  position:fixed;top:14px;left:14px;z-index:9999;",
    "  display:inline-flex;align-items:center;gap:.4rem;",
    "  padding:6px 12px;border-radius:999px;text-decoration:none;",
    "  font-family:'Segoe UI',Aptos,Calibri,-apple-system,BlinkMacSystemFont,sans-serif;",
    "  font-size:12.5px;font-weight:600;",
    "  color:var(--cp-text,#242424);",
    "  background:var(--cp-surface,#fff);",
    "  border:1px solid var(--cp-border,#dedede);",
    "  box-shadow:0 1px 3px rgba(0,0,0,.14);",
    "  opacity:.92;transition:opacity .15s ease,border-color .15s ease,color .15s ease;",
    "}",
    "#guide-nav-back:hover{opacity:1;color:var(--cp-accent,#b11f4b);border-color:var(--cp-accent,#b11f4b);}",
    "@media print{#guide-nav-back{display:none;}}",
    "@media (max-width:640px){#guide-nav-back{position:static;margin:0 0 12px;}}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var a = document.createElement("a");
  a.id = "guide-nav-back";
  a.href = "../../index.html";
  a.textContent = "← 가이드 목록";
  document.body.insertBefore(a, document.body.firstChild);
})();
