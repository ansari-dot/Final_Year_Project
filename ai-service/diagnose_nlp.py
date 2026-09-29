"""
ReWearX NLP Search — Full Pipeline Diagnostic
Run: .venv\Scripts\python.exe diagnose_nlp.py
"""
import sys
import os

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import requests

BASE = "http://127.0.0.1:5000"
SEP  = "=" * 70

QUERIES = [
    "warm clothes",
    "party wear",
    "cultural dress",
    "winter clothing",
    "summer clothes",
    "something warm for a snowy trip",
    "casual university clothes",
]

FAKE_PRODUCTS = [
    {"id": 1, "title": "Men's Waterproof Puffer Jacket",
     "text": "Men's Waterproof Puffer Jacket. Brand: None. heavy insulated waterproof puffer jacket freezing temperatures snow winter travel"},
    {"id": 2, "title": "Men's Merino Wool Sweater",
     "text": "Men's Merino Wool Sweater. Brand: None. soft merino wool sweater warmth cold weather winter travel smart casual"},
    {"id": 3, "title": "Unisex Heavyweight Knit Sweater",
     "text": "Unisex Heavyweight Knit Sweater. Brand: None. heavyweight knitted sweater warmth cold days winter outdoor casual"},
    {"id": 4, "title": "Women's Embroidered Kurta",
     "text": "Women's Embroidered Kurta. Brand: Khaadi. embroidered cotton kurta ethnic cultural festive traditional"},
    {"id": 5, "title": "Men's Formal Blazer",
     "text": "Men's Formal Blazer. Brand: None. formal blazer party event wedding celebration evening"},
    {"id": 6, "title": "Women's Floral Summer Dress",
     "text": "Women's Floral Summer Dress. Brand: None. lightweight floral summer dress breathable beach vacation warm weather"},
    {"id": 7, "title": "Women's Linen Shirt",
     "text": "Women's Linen Shirt. Brand: None. breathable linen shirt relaxed summer casual daytime"},
    {"id": 8, "title": "Men's Casual T-Shirt",
     "text": "Men's Casual T-Shirt. Brand: None. everyday casual t-shirt cotton comfortable university college"},
    {"id": 9, "title": "Girls Lehenga Choli",
     "text": "Girls Lehenga Choli. Brand: None. traditional cultural lehenga choli ethnic wear festival ceremony"},
    {"id": 10, "title": "Men's Denim Jeans",
     "text": "Men's Denim Jeans. Brand: None. regular fit denim jeans casual everyday university"},
]

# ─────────────────────────────────────────────────────────────────────────────
print(SEP)
print("STEP 1 -- MODEL AUDIT")
print(SEP)

MODEL_DIMS = 0
try:
    r = requests.post(f"{BASE}/api/extract", json={"text": "test"}, timeout=30)
    emb = r.json().get("embedding", [])
    MODEL_DIMS = len(emb)
    print(f"  /api/extract status  : {r.status_code}")
    print(f"  Embedding dimensions : {MODEL_DIMS}")
    if MODEL_DIMS == 768:
        print("  [WARNING] MODEL = distilbert-base-uncased (768-dim)")
        print("            Expected: sentence-transformers/all-MiniLM-L6-v2 (384-dim)")
        print("            MISMATCH: AI service is running DistilBERT, NOT MiniLM!")
    elif MODEL_DIMS == 384:
        print("  [OK] MODEL = all-MiniLM-L6-v2 (384-dim)")
    else:
        print(f"  [UNKNOWN] {MODEL_DIMS} dimensions")
    print(f"  First 5 values: {[round(v,4) for v in emb[:5]]}")
except Exception as e:
    print(f"  [ERROR] Cannot reach Flask: {e}")
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────
print()
print(SEP)
print("STEP 2 -- ROUTE AVAILABILITY")
print(SEP)

routes = [
    ("GET",  "/health/", None),
    ("POST", "/api/extract", {"text": "test query"}),
    ("POST", "/api/query/attributes", {
        "query": "warm clothes",
        "categories": [{"name": "Jackets", "description": "Jackets"}],
        "colors": [], "conditions": [],
        "genders": [{"name": "male", "description": "male"}],
    }),
    ("POST", "/api/rank", {
        "query_embedding": [0.01] * MODEL_DIMS,
        "items": [{"id": 1, "text": "test"}],
    }),
]

for method, path, body in routes:
    try:
        resp = requests.get(f"{BASE}{path}", timeout=10) if method == "GET" else \
               requests.post(f"{BASE}{path}", json=body, timeout=30)
        ok = "[OK]" if resp.status_code in (200, 201) else "[FAIL]"
        print(f"  {ok}  {method} {path} -> {resp.status_code}")
        if resp.status_code not in (200, 201):
            print(f"       {resp.text[:200]}")
    except Exception as e:
        print(f"  [ERROR]  {method} {path} -> {e}")

# ─────────────────────────────────────────────────────────────────────────────
print()
print(SEP)
print("STEP 3 -- RAW SIMILARITY SCORES (zero filtering)")
print(SEP)

def get_embedding(text):
    r = requests.post(f"{BASE}/api/extract", json={"text": text}, timeout=30)
    r.raise_for_status()
    return r.json()["embedding"]

def get_rankings(qemb, items):
    r = requests.post(f"{BASE}/api/rank", json={"query_embedding": qemb, "items": items}, timeout=60)
    r.raise_for_status()
    return r.json().get("rankings", [])

query_embeddings = {}
all_scores = {}

for q in QUERIES:
    print(f"\n  Query: \"{q}\"")
    try:
        qemb = get_embedding(q)
        query_embeddings[q] = qemb
        rankings = get_rankings(qemb, FAKE_PRODUCTS)
        id_to_title = {p["id"]: p["title"] for p in FAKE_PRODUCTS}

        print(f"  {'Rank':<5} {'Score':<10} Product")
        print(f"  {'-'*5} {'-'*10} {'-'*45}")

        scores = []
        for rank, rk in enumerate(rankings, 1):
            s = rk["score"]
            scores.append(s)
            title = id_to_title.get(rk["id"], f"ID:{rk['id']}")
            note = ""
            if s >= 0.70: note = "<-- ABOVE old 0.70"
            elif s >= 0.40: note = "<-- ABOVE floor 0.40"
            print(f"  {rank:<5} {s:<10.4f} {title}  {note}")

        all_scores[q] = scores
        if scores:
            top = max(scores)
            dyn = max(0.40, top * 0.82)
            passing = len([s for s in scores if s >= dyn])
            print(f"\n  Top score        = {top:.4f}")
            print(f"  dynamicThreshold = max(0.40, {top:.4f} x 0.82) = {dyn:.4f}")
            print(f"  Products passing : {passing} / {len(scores)}")
            if passing == 0:
                print(f"  [FAIL] ALL PRODUCTS REMOVED BY THRESHOLD")
    except Exception as e:
        print(f"  [ERROR] {e}")

# ─────────────────────────────────────────────────────────────────────────────
print()
print(SEP)
print("STEP 4 -- ATTRIBUTE EXTRACTION (threshold=0.75)")
print(SEP)

sample_cats = [
    {"name": "Jackets",  "description": "Jackets outerwear cold weather"},
    {"name": "Dresses",  "description": "Dresses frocks for women"},
    {"name": "Kurtas",   "description": "Traditional kurta shalwar kameez"},
    {"name": "Sweaters", "description": "Sweaters knitwear"},
    {"name": "T-Shirts", "description": "T-shirts casual tops"},
    {"name": "Blazers",  "description": "Formal blazers suit jackets"},
    {"name": "Lehenga",  "description": "Traditional lehenga choli ethnic wear"},
]
sample_genders = [
    {"name": "male",   "description": "male"},
    {"name": "female", "description": "female"},
    {"name": "unisex", "description": "unisex"},
]

for q in ["warm clothes", "party wear", "cultural dress"]:
    print(f"\n  Query: \"{q}\"")
    try:
        resp = requests.post(f"{BASE}/api/query/attributes", json={
            "query": q,
            "categories": sample_cats,
            "colors":     [],
            "conditions": [],
            "genders":    sample_genders,
            "threshold":  0.75,
        }, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            cats = data.get("category", [])
            genders = data.get("gender", [])
            print(f"  Categories matched (>=0.75): {cats}")
            print(f"  Genders matched   (>=0.75): {genders}")
            if not cats:
                print("  [INFO] No category matched threshold -- should do FULL DB scan")
            if not genders:
                print("  [INFO] No gender matched -- should NOT add gender WHERE clause")
        else:
            print(f"  [FAIL] {resp.status_code}: {resp.text[:300]}")
    except Exception as e:
        print(f"  [ERROR] {e}")

# ─────────────────────────────────────────────────────────────────────────────
print()
print(SEP)
print("STEP 5 -- THRESHOLD MATRIX (how many products pass each cutoff?)")
print(SEP)

thresholds = [0.70, 0.50, 0.40, 0.30, 0.20, 0.10]
header = f"  {'Query':<40}"
for t in thresholds:
    header += f" {str(t):<7}"
header += " Dynamic"
print(header)
print(f"  {'-'*40}", end="")
for t in thresholds:
    print(f" {'-'*7}", end="")
print(" -------")

for q, scores in all_scores.items():
    if not scores:
        continue
    top = max(scores)
    dyn = max(0.40, top * 0.82)
    row = f"  {q[:38]:<40}"
    for t in thresholds:
        n = len([s for s in scores if s >= t])
        row += f" {n:<7}"
    dyn_n = len([s for s in scores if s >= dyn])
    row += f" {dyn_n}"
    print(row)

# ─────────────────────────────────────────────────────────────────────────────
print()
print(SEP)
print("STEP 6 -- DETAILED NODE.JS FILTER SIMULATION (top 3 queries)")
print(SEP)

stop_words = {'and','for','with','the','made','from','that','this',
              'suit','suitable','perfect','ideal','designed'}

for q in ["warm clothes", "party wear", "cultural dress"]:
    if q not in query_embeddings:
        continue
    print(f"\n  Query: \"{q}\"")
    tokens = [t for t in q.lower().split() if len(t) > 2 and t not in stop_words]
    print(f"  Keyword tokens: {tokens}")

    try:
        rankings = get_rankings(query_embeddings[q], FAKE_PRODUCTS)
        rank_map = {r["id"]: r["score"] for r in rankings}
        scored = []
        for p in FAKE_PRODUCTS:
            raw = rank_map.get(p["id"], 0)
            full_text = p["text"].lower()
            match_count = sum(1 for t in tokens if t in full_text)
            boost = (match_count / len(tokens)) * 0.25 if tokens else 0
            final = raw + boost
            scored.append({"id": p["id"], "title": p["title"],
                           "raw": raw, "boost": boost, "final": final})
        scored.sort(key=lambda x: x["final"], reverse=True)

        top = scored[0]["final"] if scored else 0
        dyn = max(0.40, top * 0.82)
        print(f"\n  {'Rank':<4} {'RawSem':<10} {'Boost':<8} {'Final':<10} {'Pass?':<8} Title")
        print(f"  {'-'*4} {'-'*10} {'-'*8} {'-'*10} {'-'*8} {'-'*40}")
        for i, item in enumerate(scored, 1):
            flag = "PASS" if item["final"] >= dyn else "FAIL"
            print(f"  {i:<4} {item['raw']:<10.4f} {item['boost']:<8.4f} {item['final']:<10.4f} {flag:<8} {item['title']}")

        passing = [x for x in scored if x["final"] >= dyn]
        print(f"\n  topScore         = {top:.4f}")
        print(f"  dynamicThreshold = max(0.40, {top:.4f} x 0.82) = {dyn:.4f}")
        print(f"  Final results    = {len(passing)} / {len(FAKE_PRODUCTS)}")
        if len(passing) == 0:
            print(f"  [ROOT CAUSE] ALL ITEMS ELIMINATED AT THRESHOLD STAGE")
    except Exception as e:
        print(f"  [ERROR] {e}")

# ─────────────────────────────────────────────────────────────────────────────
print()
print(SEP)
print("STEP 7 -- FINAL VERDICT")
print(SEP)

if MODEL_DIMS == 768:
    print()
    print("  Model running    : distilbert-base-uncased (768-dim)")
    print("  Expected model   : sentence-transformers/all-MiniLM-L6-v2 (384-dim)")
    print()
    print("  ai-service/.env contains:")
    print("    MODEL_NAME=distilbert-base-uncased")
    print()
    print("  The .env was NEVER changed to MiniLM.")
    print()
    print("  However, model mismatch between QUERY and PRODUCT embeddings")
    print("  is NOT the issue -- both use the same Flask /api/rank which")
    print("  generates product embeddings internally using the same model.")
    print()
    print("  The real question is: are the raw DistilBERT scores high enough")
    print("  to pass the dynamicThreshold = max(0.40, top x 0.82)?")
    print()
    print("  See the tables above for concrete answers per query.")
    print()
    print("  Key .env fix needed: change MODEL_NAME to:")
    print("    sentence-transformers/all-MiniLM-L6-v2")
    print("  Then restart the Flask service.")
elif MODEL_DIMS == 384:
    print()
    print("  Model running    : all-MiniLM-L6-v2 (384-dim) -- CORRECT")
    print("  If results are still empty, the issue is threshold or DB candidate count.")
    print("  Review the threshold table in STEP 5 above.")

print()
print(SEP)
print("DIAGNOSTIC COMPLETE")
print(SEP)
