#!/usr/bin/env python3
"""Refresh the public GitHub contribution calendar used by this static site."""

import argparse
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
SOURCE_URL = "https://github.com/users/tannerbjorgan/contributions"


def parse_calendar(source: str) -> dict:
    total_match = re.search(
        r'id="js-contribution-activity-description"[^>]*>\s*([\d,]+)', source
    )
    if not total_match:
        raise ValueError("GitHub contribution total was not found")

    matches = re.findall(
        r'<td\b[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*'
        r'data-level="([0-4])"[^>]*>\s*</td>\s*'
        r'<tool-tip[^>]*>([^<]*)</tool-tip>',
        source,
    )
    days = []
    for day, level, label in matches:
        count_match = re.match(r"(\d+) contributions?", label)
        count = int(count_match.group(1)) if count_match else 0
        days.append({"date": day, "count": count, "level": int(level)})

    days.sort(key=lambda entry: entry["date"])
    total = int(total_match.group(1).replace(",", ""))
    if len(days) < 360 or len({entry["date"] for entry in days}) != len(days):
        raise ValueError("GitHub contribution calendar was incomplete")
    if sum(entry["count"] for entry in days) != total:
        raise ValueError("GitHub contribution count did not match daily values")
    return {
        "username": "tannerbjorgan",
        "profile_url": "https://github.com/tannerbjorgan",
        "through": days[-1]["date"],
        "total": total,
        "days": days,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="Previously downloaded GitHub HTML")
    args = parser.parse_args()
    if args.input:
        source = args.input.read_text()
    else:
        request = Request(SOURCE_URL, headers={"User-Agent": "tannerbjorgan-portfolio"})
        with urlopen(request, timeout=30) as response:
            source = response.read().decode("utf-8")
    data = parse_calendar(source)
    destination = ROOT / "contributions.json"
    destination.write_text(json.dumps(data, indent=2) + "\n")
    print(f"Updated {destination.name}: {data['total']} contributions through {data['through']}")


if __name__ == "__main__":
    main()
