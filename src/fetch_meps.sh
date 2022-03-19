#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

(
cd "$SCRIPT_DIR"

if [[ "$#" -eq 1 ]] && [[ "$1" = "--force" ]]
then
  rm -rf build
fi

mkdir -p build
cd build

ISO2=$(cat "$SCRIPT_DIR"/eu_countries.csv | cut -d ',' -f1)

mkdir -p raw_xmls
for iso2 in $ISO2
do
  URL="https://www.europarl.europa.eu/meps/en/download/advanced/xml?name=&groupCode=&countryCode=$iso2&constituency=&bodyType=ALL"
  if [[ ! -f raw_xmls/$iso2.xml ]]
  then
    echo "Fetching raw_xmls/$iso2.xml"
    curl "$URL" 2> /dev/null > raw_xmls/$iso2.xml
  fi
done

mkdir -p raw_jsons
for iso2 in $ISO2
do
  if [[ ! -f raw_jsons/$iso2.json ]]
  then
    echo "Converting raw_xmls/$iso2.xml"
    bash "$SCRIPT_DIR"/mep_xml_to_json.sh < raw_xmls/$iso2.xml > raw_jsons/$iso2.json
  fi
done

if [[ ! -f meps.json ]]
then
  function jsons {
    for iso2 in $ISO2
    do
      cat raw_jsons/$iso2.json | jq ".meps.mep[] + {iso2:\"$iso2\"}"
    done
  }
  jsons | jq -s "." > meps.json
fi

if [[ ! -f mep_emails.json ]]
then
  echo "Fetching MEP emails, this may take a while"
  cat meps.json | jq -r '.[].id' | bash "$SCRIPT_DIR"/crawl_mep_emails.sh > mep_emails.json
fi

cd "$SCRIPT_DIR"
cp build/meps.json meps.json
cp build/mep_emails.json mep_emails.json

)