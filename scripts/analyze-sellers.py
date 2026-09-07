#!/usr/bin/env python3

import argparse
import csv
import json
from pathlib import Path


def parse_ads_txt(path, ad_system):
    records = []

    for lineno, raw in enumerate(
        path.read_text(errors="replace").splitlines(), 1
    ):
        line = raw.split("#", 1)[0].strip()

        if not line:
            continue

        parts = [part.strip() for part in line.split(",")]

        if len(parts) < 3:
            continue

        if parts[0].lower() != ad_system.lower():
            continue

        records.append(
            {
                "ads_txt_line": lineno,
                "ad_system": parts[0].lower(),
                "seller_id": parts[1],
                "relationship": parts[2].upper(),
                "cert_authority_id": parts[3] if len(parts) >= 4 else "",
            }
        )

    return records


def load_sellers_json(path):
    with path.open() as f:
        data = json.load(f)

    sellers = {}

    for seller in data.get("sellers", []):
        seller_id = str(seller.get("seller_id", ""))

        if seller_id:
            sellers[seller_id] = seller

    return data.get("version"), sellers


def main():
    parser = argparse.ArgumentParser(
        description="Compare ads.txt seller records with sellers.json."
    )

    parser.add_argument("--ads", required=True)
    parser.add_argument("--sellers", required=True)
    parser.add_argument("--system", required=True)
    parser.add_argument("--output", required=True)

    args = parser.parse_args()

    ads_path = Path(args.ads)
    sellers_path = Path(args.sellers)
    output_path = Path(args.output)

    ads_records = parse_ads_txt(ads_path, args.system)
    version, sellers = load_sellers_json(sellers_path)

    output_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "ads_txt_line",
        "ad_system",
        "seller_id",
        "relationship",
        "cert_authority_id",
        "sellers_json_found",
        "seller_type",
        "seller_name",
        "seller_domain",
    ]

    found = 0

    with output_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for record in ads_records:
            seller = sellers.get(record["seller_id"])
            exists = seller is not None

            if exists:
                found += 1

            writer.writerow(
                {
                    **record,
                    "sellers_json_found": "YES" if exists else "NO",
                    "seller_type": seller.get("seller_type", "") if seller else "",
                    "seller_name": seller.get("name", "") if seller else "",
                    "seller_domain": seller.get("domain", "") if seller else "",
                }
            )

    print("=== SELLER CONSISTENCY ANALYSIS ===")
    print(f"Ad system:             {args.system}")
    print(f"sellers.json version:  {version}")
    print(f"ads.txt records:       {len(ads_records):,}")
    print(f"Unique seller IDs:     {len({r['seller_id'] for r in ads_records}):,}")
    print(f"Found records:         {found:,}")
    print(f"Not found records:     {len(ads_records) - found:,}")
    print(f"Output:                {output_path}")


if __name__ == "__main__":
    main()
