#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install GitHub CLI to verify attestations."
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found. Install jq to parse attestation output."
  exit 1
fi

REPO="${1:-}"
SHA="${2:-}"

if [[ -z "$REPO" || -z "$SHA" ]]; then
  echo "Usage: $0 <owner/repo> <commit_sha>"
  exit 1
fi

echo "==> Verifying provenance attestations for $REPO@$SHA"

gh attestation verify "oci://ghcr.io/${REPO}" \
  --repo "$REPO" \
  --format json > attestation.verify.json || true

if [[ ! -s attestation.verify.json ]]; then
  echo "No verifiable attestation payload was returned."
  exit 2
fi

MATCH_COUNT=$(jq '[.[] | select(.verificationResult.statement.predicate.materials[]?.digest.sha1? == "'"$SHA"'" or .verificationResult.statement.predicate.materials[]?.digest.sha256? == "'"$SHA"'")] | length' attestation.verify.json)

if [[ "$MATCH_COUNT" -gt 0 ]]; then
  echo "Provenance verified: commit linkage detected in attestation materials."
  exit 0
fi

echo "Attestation exists but commit linkage check did not match provided SHA."
exit 3
