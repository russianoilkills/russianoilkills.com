#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

curl "https://comtrade.un.org/api/get?max=502&type=C&freq=A&px=HS&ps=2020&r=643&p=all&rg=2&cc=27" | jq '[.dataset[]|{iso:.pt3ISO,amount:.TradeValue}]' > "$SCRIPT_DIR"/data.json
