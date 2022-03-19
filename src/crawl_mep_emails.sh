#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

(

cd "$SCRIPT_DIR"
    
if [[ ! -f virtualenv/bin/activate ]]
then
    python3 -m venv virtualenv
fi

. virtualenv/bin/activate

if [[ -z $(find virtualenv -name lxml -type d) ]]
then
    # TODO freeze
    pip install lxml requests
fi

python3 crawl_mep_emails.py

)
