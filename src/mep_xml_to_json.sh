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

if [[ -z $(find virtualenv -name xmltodict.py -type f) ]]
then
    # TODO freeze
    pip install xmltodict
fi

python3 mep_xml_to_json.py

)
