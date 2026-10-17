#!/bin/bash
# Make tester wallets eligible buyers on Truva's demo suite (Bohr testnet).
#   ./onboard.sh 0xWALLET1 0xWALLET2 ...          registers them (about 0.08 test BOT each)
#   ./onboard.sh --check 0xWALLET1 ...            only shows whether they're eligible
set -e
cd "$(dirname "$0")"
RPC=https://rpc.bohr.life
IR=$(python -c "import json;print(json.load(open('deployments/bohr-demo-suite.json'))['identityRegistry'])")

check=false
if [ "$1" = "--check" ]; then check=true; shift; fi
[ $# -gt 0 ] || { echo "usage: ./onboard.sh [--check] 0xWALLET [0xWALLET ...]"; exit 1; }
for w in "$@"; do
  [[ "$w" =~ ^0x[0-9a-fA-F]{40}$ ]] || { echo "not a wallet address: $w"; exit 1; }
done

if ! $check; then
  set -a; . ./.env >/dev/null 2>&1; set +a
  TESTERS=$(IFS=,; echo "$*") forge script script/OnboardTesters.s.sol --rpc-url bohr --broadcast --slow 2>&1 \
    | grep -E "eligible|Error|rror:|revert" | grep -viE "_KEY|private" || true
fi

echo
for w in "$@"; do
  printf "%s  eligible: %s  gas: %s BOT\n" "$w" \
    "$(cast call $IR 'isVerified(address)(bool)' $w --rpc-url $RPC)" \
    "$(cast balance $w --rpc-url $RPC --ether)"
done
