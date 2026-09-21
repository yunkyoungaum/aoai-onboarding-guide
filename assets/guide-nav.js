/** Shared guide navigation and Korean/English switcher. */
(function () {
    var storageKey = "aoai-guide-language";
    var params = new URLSearchParams(window.location.search);
    var requested = params.get("lang");
    var stored = localStorage.getItem(storageKey);
    var browserLanguage = navigator.language.toLowerCase().startsWith("ko") ? "ko" : "en";
    var language = requested === "ko" || requested === "en"
      ? requested
      : (stored === "ko" || stored === "en" ? stored : browserLanguage);

    var css = [
      "body[data-lang='ko'] .lang-en{display:none!important}",
      "body[data-lang='en'] .lang-ko{display:none!important}",
      "#guide-nav-back{position:fixed;top:14px;left:14px;z-index:9999;display:inline-flex;align-items:center;gap:.4rem;padding:6px 12px;border-radius:999px;text-decoration:none;font-family:'Segoe UI',Aptos,Calibri,-apple-system,BlinkMacSystemFont,sans-serif;font-size:12.5px;font-weight:600;color:var(--cp-text,#242424);background:var(--cp-surface,#fff);border:1px solid var(--cp-border,#dedede);box-shadow:0 1px 3px rgba(0,0,0,.14);opacity:.92}",
      "#guide-nav-back:hover{opacity:1;color:var(--cp-accent,#b11f4b);border-color:var(--cp-accent,#b11f4b)}",
      "#guide-language-bar{position:fixed;top:14px;right:14px;z-index:9999;display:inline-flex;padding:3px;border-radius:10px;background:var(--cp-surface,#fff);border:1px solid var(--cp-border,#dedede);box-shadow:0 1px 3px rgba(0,0,0,.14)}",
      "#guide-language-bar button{min-width:70px;padding:5px 10px;border:0;border-radius:7px;cursor:pointer;font:600 12.5px 'Segoe UI',Aptos,Calibri,sans-serif;color:var(--cp-text-muted,#5c5c5c);background:transparent}",
      "#guide-language-bar button[aria-pressed='true']{color:var(--cp-accent-fg,#fff);background:var(--cp-accent,#b11f4b)}",
      "@media print{#guide-nav-back,#guide-language-bar{display:none!important}}",
      "@media(max-width:640px){#guide-nav-back,#guide-language-bar{position:static;margin:0 0 12px}#guide-language-bar{margin-left:8px}}"
    ].join("");

    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    var back = document.createElement("a");
    back.id = "guide-nav-back";
    back.href = "../../index.html";
    document.body.insertBefore(back, document.body.firstChild);

    var bar = document.createElement("div");
    bar.id = "guide-language-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Language / 언어");
    bar.innerHTML = '<button type="button" data-lang-btn="ko">한국어</button>' +
      '<button type="button" data-lang-btn="en">English</button>';
    document.body.insertBefore(bar, back.nextSibling);

    function titleFor(nextLanguage) {
      return document.body.getAttribute("data-title-" + nextLanguage) || document.title;
    }

    function apply(nextLanguage, persist, preservePosition) {
      var previousHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      var progress = window.scrollY / previousHeight;
      language = nextLanguage === "en" ? "en" : "ko";
      document.body.dataset.lang = language;
      document.documentElement.lang = language;
      document.title = titleFor(language);
      back.textContent = language === "en" ? "← Guide list" : "← 가이드 목록";
      bar.querySelectorAll("[data-lang-btn]").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset.langBtn === language));
      });
      params.set("lang", language);
      history.replaceState(null, "", window.location.pathname + "?" + params.toString() + window.location.hash);
      if (persist) localStorage.setItem(storageKey, language);
      if (preservePosition) {
        requestAnimationFrame(function () {
          var nextHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
          window.scrollTo(0, progress * nextHeight);
        });
      }
      window.dispatchEvent(new CustomEvent("aoai-language-change", { detail: language }));
    }

    bar.addEventListener("click", function (event) {
      var button = event.target.closest("[data-lang-btn]");
      if (button) apply(button.dataset.langBtn, true, true);
    });

    apply(language, false, false);
})();
