from lxml import html
import requests
import sys
import multiprocessing as mp
import json
import os

def retrieve_email(id):
    url = "https://www.europarl.europa.eu/meps/en/" + id.strip()

    html_path = "./build/raw_mep_htmls/" + id.strip() + ".html"
    if not os.path.exists(html_path):
        page_contents = requests.get(url).content
        with open(html_path, "wb") as file:
            file.write(page_contents)

    with open(html_path, "rb") as file:
      html_raw = file.read()

    tree = html.fromstring(html_raw)
    emails = tree.xpath('//*[@id="presentationmep"]/div/div[2]/div/div/div[2]/div/a[@data-original-title="E-mail"]/@href')
    emails_decoded = []
    for email in emails:
        email_decoded = ".".join("@".join(email[len("mailto:"):][::-1].split("]ta[")).split("]tod["))
        emails_decoded.append(email_decoded)


    if len(emails_decoded) < 1:
        sys.stderr.write("Something wrong with " + id)
        return None
    sys.stderr.write(emails_decoded[0] + "\n")
    return {
        "id": id.strip(),
        "email": emails_decoded[0]
    }

pool = mp.Pool(16)

os.makedirs("./build/raw_mep_htmls", exist_ok=True)

emails = pool.map(retrieve_email, sys.stdin.readlines())

print(json.dumps(emails))