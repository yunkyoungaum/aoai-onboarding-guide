#!/usr/bin/env python3
"""Build complete Korean/English guide containers from the Korean HTML pages."""

import argparse
import json
import re
import time
from copy import copy
from pathlib import Path

import translators as ts
from bs4 import BeautifulSoup, NavigableString


ROOT = Path(__file__).resolve().parents[1]
CACHE_PATH = ROOT / "scripts" / "translation-cache.json"
GUIDES = {
    "01": ROOT / "guides/01-oai-to-aoai-onboarding/index.html",
    "02": ROOT / "guides/02-aoai-foundations/index.html",
    "03": ROOT / "guides/03-aoai-deployment-monitoring/index.html",
    "04": ROOT / "guides/04-aoai-high-availability/index.html",
    "05": ROOT / "guides/05-aoai-model-router/index.html",
    "06": ROOT / "guides/06-aoai-cache-performance/index.html",
}
HANGUL = re.compile(r"[가-힣]")
SKIP_TAGS = {"script", "style", "code", "pre", "kbd", "samp"}
BLOCK_TAGS = {"h1", "h2", "h3", "h4", "p", "li", "th", "td", "caption", "blockquote"}
TERM_FIXES = (
    (re.compile(r"\bDistribution Type\b", re.I), "Deployment type"),
    (re.compile(r"\bPublic Distribution\b", re.I), "Public deployment"),
    (re.compile(r"\bPrivate Distribution\b", re.I), "Private deployment"),
    (re.compile(r"\bGlobal Distribution\b", re.I), "Global deployment"),
    (re.compile(r"\bCustomer Management Key\b", re.I), "customer-managed key"),
    (re.compile(r"\bquarter\b", re.I), "quota"),
)


def load_cache():
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(cache):
    CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def translate(text, cache):
    if not HANGUL.search(text):
        return text
    key = text.strip()
    if key not in cache:
        for attempt in range(4):
            try:
                cache[key] = ts.translate_text(
                    key,
                    translator="bing",
                    from_language="ko",
                    to_language="en",
                )
                save_cache(cache)
                time.sleep(0.15)
                break
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(2 ** attempt)
    result = text.replace(key, cache[key])
    for pattern, replacement in TERM_FIXES:
        result = pattern.sub(replacement, result)
    return result


def translate_html(element, cache):
    source = str(element)
    translated = translate(source, cache)
    fragment = BeautifulSoup(translated, "html.parser")
    replacement = fragment.find(element.name)
    if replacement is None:
        raise RuntimeError(f"Translator damaged <{element.name}> markup: {translated}")
    element.replace_with(replacement)


def translate_mermaid(container, cache):
    for mermaid in container.select(".mermaid"):
        for node in list(mermaid.find_all(string=True)):
            source = str(node)

            def replace_label(match):
                quote, label = match.groups()
                return quote + translate(label, cache) + quote

            translated = re.sub(r'(["\'])([^"\']*[가-힣][^"\']*)\1', replace_label, source)
            if translated != source:
                node.replace_with(NavigableString(translated))


def translate_code_comments(container, cache):
    for pre in container.find_all("pre"):
        for node in list(pre.find_all(string=True)):
            source = str(node)
            lines = []
            for line in source.splitlines(keepends=True):
                match = re.match(r"(.*?#\s*)(.*[가-힣].*)(\r?\n)?$", line)
                if match:
                    prefix, comment, ending = match.groups()
                    line = prefix + translate(comment, cache) + (ending or "")
                elif HANGUL.search(line):
                    content = line.rstrip("\r\n")
                    ending = line[len(content):]
                    line = translate(content, cache) + ending
                line = line.replace(" 또는 ", " or ")
                lines.append(line)
            translated = "".join(lines)
            if translated != source:
                node.replace_with(NavigableString(translated))


def should_translate(node):
    parent = node.parent
    if not parent or parent.name in SKIP_TAGS or not HANGUL.search(str(node)):
        return False
    if parent.find_parent(class_="mermaid") or "mermaid" in parent.get("class", []):
        return False
    if parent.has_attr("data-no-translate") or parent.find_parent(attrs={"data-no-translate": True}):
        return False
    return True


def prefix_anchors(container):
    for element in container.find_all(id=True):
        element["id"] = "en-" + element["id"]
    for element in container.find_all(href=True):
        if element["href"].startswith("#"):
            element["href"] = "#en-" + element["href"][1:]
    for attribute in ("aria-labelledby", "aria-describedby", "for"):
        for element in container.find_all(attrs={attribute: True}):
            element[attribute] = " ".join("en-" + value for value in element[attribute].split())


def build(path, cache):
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    body = soup.body
    korean = body.select_one(":scope > .wrap, :scope > .layout")
    if not korean:
        raise RuntimeError(f"No guide content container found in {path}")

    existing_english = body.select_one(":scope > .lang-en")
    if existing_english:
        existing_english.decompose()

    korean_classes = [value for value in korean.get("class", []) if value not in {"lang-ko", "lang-en"}]
    korean["class"] = korean_classes + ["lang-ko"]
    english = copy(korean)
    english["class"] = korean_classes + ["lang-en"]
    prefix_anchors(english)

    for element in list(english.find_all(BLOCK_TAGS)):
        if element.find_parent(class_="mermaid") or "mermaid" in element.get("class", []):
            continue
        if element.has_attr("data-no-translate") or element.find_parent(attrs={"data-no-translate": True}):
            continue
        translate_html(element, cache)

    for node in list(english.find_all(string=True)):
        if should_translate(node) and not node.find_parent(BLOCK_TAGS):
            node.replace_with(NavigableString(translate(str(node), cache)))
    translate_mermaid(english, cache)
    translate_code_comments(english, cache)
    for element in english.find_all(attrs={"title": True}):
        element["title"] = translate(element["title"], cache)
    for element in english.find_all(attrs={"aria-label": True}):
        element["aria-label"] = translate(element["aria-label"], cache)

    korean.insert_after(english)
    body["data-lang"] = "ko"
    english_h1 = english.find("h1")
    if english_h1:
        body["data-title-en"] = english_h1.get_text(" ", strip=True)
    body["data-title-ko"] = soup.title.get_text(strip=True)
    path.write_text(str(soup), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--guide", choices=[*GUIDES, "all"], default="all")
    args = parser.parse_args()
    cache = load_cache()
    selected = GUIDES.values() if args.guide == "all" else [GUIDES[args.guide]]
    for path in selected:
        print(f"Building {path.relative_to(ROOT)}")
        build(path, cache)


if __name__ == "__main__":
    main()