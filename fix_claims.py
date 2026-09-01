"""Align the 'no tracking' marketing claim with the shipped build and the Play listing.

Evidence forcing this change (all VERIFIED 2026-09-01):
  - emberdelve-v0.59.0.apk (the version string the live store serves) contains
    the Firebase Analytics SDK, GMS measurement/AppMeasurement, google_app_id,
    project_id and google_api_key, plus the Play install-referrer service binding.
  - The app's own public Play "Data safety" page declares: "Device or other IDs -
    Optional - Analytics" and "App interactions - Optional - Analytics".
So "no tracking" contradicts his own store page. That is a factual defect, not a
style preference — the same class of fix as the APK-filename correction (C250).

The replacement is deliberately MORE specific, not weaker: "nothing is sent unless
you opt in" is a stronger, checkable promise than a vague "no tracking", and it is
exactly what the privacy policy and the Data safety declaration already say.
Nothing else on these pages is touched.
"""
import re
import subprocess
import urllib.request

ROOT = "/work/temp/pf"

EDITS = [
    ("emberdelve/index.html",
     "Free, no ads, no tracking, no energy timers.",
     "Free, no ads, no energy timers, and nothing sent unless you opt in."),
    ("emberdelve/index.html",
     "Free on Google Play &mdash; no ads, no tracking, no energy timers.",
     "Free on Google Play &mdash; no ads, no energy timers, analytics off by default."),
    ("emberdelve/index.html",
     "Free on Google Play — no ads, no tracking, no energy timers.",
     "Free on Google Play — no ads, no energy timers, analytics off by default."),
    ("emberdelve/index.html",
     "Free with no ads, no tracking and no energy timers.",
     "Free with no ads and no energy timers; optional analytics is off by default."),
    ("emberdelve/index.html",
     '<div class="promise"><strong>No tracking</strong>plays offline</div>',
     '<div class="promise"><strong>Nothing sent by default</strong>analytics is opt-in</div>'),
    ("emberdelve/press/index.html",
     "Free. No ads, no tracking, no energy timers. One optional one-time unlock ($3.99); no other purchases.",
     "Free. No ads, no energy timers. Optional anonymous analytics, off by default. "
     "One optional one-time unlock ($3.99); no other purchases."),
    ("emberdelve/press/index.html",
     "no ads, no tracking, no energy timers, no gacha. One optional one-time unlock.",
     "no ads, no energy timers, no gacha. Analytics is opt-in and off by default. "
     "One optional one-time unlock."),
    ("index.html",
     "Free, no ads, no tracking.",
     "Free, no ads, analytics off by default."),
]

LIVE = {
    "emberdelve/index.html": "https://tapiwa.me/emberdelve/",
    "emberdelve/press/index.html": "https://tapiwa.me/emberdelve/press/",
    "index.html": "https://tapiwa.me/",
}


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "replace")


def main():
    # STANDING PRE-FLIGHT: never edit a site repo without proving repo == live.
    print("=== pre-flight: repo vs live ===")
    ok = True
    for path, url in LIVE.items():
        repo = open(f"{ROOT}/{path}", encoding="utf-8").read()
        live = fetch(url)
        same = len(repo) == len(live)
        print(f"  {path:28} repo={len(repo):6} live={len(live):6} identical_len={same}")
        if not same:
            ok = False
    if not ok:
        print("\nABORT — repo and live differ; something deploys from elsewhere or is stale.")
        return

    print("\n=== applying ===")
    touched = {}
    for path, old, new in EDITS:
        full = f"{ROOT}/{path}"
        s = open(full, encoding="utf-8").read()
        if old not in s:
            print(f"  skip (anchor absent): {path} :: {old[:60]}")
            continue
        s = s.replace(old, new)
        open(full, "w", encoding="utf-8").write(s)
        touched[path] = True
        print(f"  ok  {path} :: {old[:58]}")

    print("\n=== post-conditions ===")
    for path in LIVE:
        s = open(f"{ROOT}/{path}", encoding="utf-8").read()
        left = len(re.findall(r"no tracking", s, re.I))
        print(f"  {path:28} remaining 'no tracking': {left}")
        assert left == 0, f"{path} still claims 'no tracking'"
    # things that must survive untouched
    ed = open(f"{ROOT}/emberdelve/index.html", encoding="utf-8").read()
    for must in ["Ember Forge", "privacy-policy.html", "No ads", "No timers",
                 "Free = full game", "press/"]:
        assert must in ed, f"lost from landing page: {must}"
    pr = open(f"{ROOT}/emberdelve/press/index.html", encoding="utf-8").read()
    for must in ["Press Kit", "177 countries", "Flutter", "Offline-first"]:
        assert must in pr, f"lost from press kit: {must}"
    print("  all guards passed")

    if not touched:
        print("nothing to commit")
        return
    subprocess.run(["git", "-C", ROOT, "add", "-A"], check=True)
    subprocess.run(
        ["git", "-C", ROOT, "-c", "user.name=Tapiwa Makandigona",
         "-c", "user.email=tapiwamakandigoner@gmail.com", "commit", "-q", "-m",
         "site: state the data promise accurately - the shipped build carries "
         "opt-in Firebase Analytics, so 'no tracking' contradicted our own Play "
         "Data safety declaration; say 'nothing sent unless you opt in' instead"],
        check=True)
    print(subprocess.run(["git", "-C", ROOT, "log", "--oneline", "-1"],
                         capture_output=True, text=True).stdout.strip())


if __name__ == "__main__":
    main()
