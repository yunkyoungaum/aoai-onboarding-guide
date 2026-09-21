#!/usr/bin/env python3
"""Validate paired Korean and English content in generated guide pages."""

import argparse
import re
from pathlib import Path

from bs4 import BeautifulSoup


ROOT = Path(__file__).resolve().parents[1]
GUIDES = {
    "01": ROOT / "guides/01-oai-to-aoai-onboarding/index.html",
    "02": ROOT / "guides/02-aoai-foundations/index.html",
    "03": ROOT / "guides/03-aoai-deployment-monitoring/index.html",
    "04": ROOT / "guides/04-aoai-high-availability/index.html",
    "05": ROOT / "guides/05-aoai-model-router/index.html",
    "06": ROOT / "guides/06-aoai-cache-performance/index.html",
}
HANGUL = re.compile(r"[가-힣]")
LINK_TAGS = {"a": "href", "img": "src", "source": "src", "iframe": "src"}


def direct_language_child(body, language):
    matches = [
        child
        for child in body.find_all(recursive=False)
        if language in (child.get("class") or [])
    ]
    if len(matches) != 1:
        raise AssertionError(f"expected one direct .{language}, found {len(matches)}")
    return matches[0]


def links(container):
    return [
        (element.name, attribute, element.get(attribute))
        for element in container.find_all(LINK_TAGS)
        for attribute in [LINK_TAGS[element.name]]
        if element.get(attribute)
    ]


def validate(path):
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "html.parser")
    if soup.body is None:
        raise AssertionError("missing body")
    korean = direct_language_child(soup.body, "lang-ko")
    english = direct_language_child(soup.body, "lang-en")

    if not soup.body.get("data-title-ko") or not soup.body.get("data-title-en"):
        raise AssertionError("missing localized document titles")

    ids = [element["id"] for element in soup.find_all(id=True)]
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    if duplicates:
        raise AssertionError(f"duplicate IDs: {', '.join(duplicates)}")

    korean_ids = {element["id"] for element in korean.find_all(id=True)}
    english_ids = {element["id"] for element in english.find_all(id=True)}
    missing_ids = sorted(value for value in korean_ids if f"en-{value}" not in english_ids)
    if missing_ids:
        raise AssertionError(f"missing English IDs: {', '.join(missing_ids)}")

    korean_links = links(korean)
    english_links = links(english)
    if len(korean_links) != len(english_links):
        raise AssertionError("language containers have different link counts")
    for original, translated in zip(korean_links, english_links):
        expected = (
            original[0],
            original[1],
            f"#en-{original[2][1:]}" if original[2].startswith("#") else original[2],
        )
        if translated != expected:
            raise AssertionError(f"link mismatch: {original!r} -> {translated!r}")

    english_copy = BeautifulSoup(str(english), "html.parser")
    for element in english_copy.select("script, style, .mermaid"):
        element.decompose()
    untranslated = sorted({
        text.strip()
        for text in english_copy.find_all(string=HANGUL)
        if text.strip()
    })
    if untranslated:
        sample = " | ".join(untranslated[:10])
        raise AssertionError(f"Hangul remains in English content: {sample}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("guides", nargs="*", choices=GUIDES, default=list(GUIDES))
    args = parser.parse_args()
    for guide in args.guides:
        validate(GUIDES[guide])
        print(f"Guide {guide}: passed")


if __name__ == "__main__":
    main()