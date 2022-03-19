import xmltodict
import sys
import json

print(json.dumps(xmltodict.parse(sys.stdin.read()), ensure_ascii=False))