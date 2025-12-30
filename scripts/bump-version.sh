#!/usr/bin/env bash
set -euo pipefail

usage() {
	cat >&2 <<'EOF'
Usage: scripts/bump-version.sh <version>
Example: scripts/bump-version.sh 1.0.1
EOF
	exit 2
}

VERSION="${1:-}"
[[ -n "$VERSION" ]] || usage

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
	echo "Invalid version: $VERSION (expected semver like 1.0.1)" >&2
	exit 2
fi

# Updates package.json + package-lock.json (without creating a git tag)
npm version --no-git-tag-version --allow-same-version "$VERSION" >/dev/null

# Keep manifest.json in sync
python3 - "$VERSION" <<'PY'
import json, sys

version = sys.argv[1]

with open("manifest.json", "r", encoding="utf-8") as f:
	data = json.load(f)

data["version"] = version

with open("manifest.json", "w", encoding="utf-8") as f:
	json.dump(data, f, indent="\t")
	f.write("\n")

print(f"Bumped to {version} (package.json, package-lock.json, manifest.json)")
PY
