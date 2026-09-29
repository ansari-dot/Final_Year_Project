"""
ReWearX NLP Search — Evaluation Script (Phase 7: Advanced Metrics)
===================================================================

Measures semantic ranking quality for the defined evaluation dataset.

Reports per-query:
  - Top-10 ranking with scores
  - Precision@5, Precision@10
  - Recall@5, Recall@10
  - NDCG@5, NDCG@10
  - MRR

Reports overall:
  - Mean metrics across all queries
  - Performance by query category

Usage:
    python -X utf8 evaluate_search.py
    (Flask AI service must be running on port 5000)
"""
import sys
import os
import math
import requests
from collections import defaultdict

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://127.0.0.1:5000"
SEP  = "=" * 72

# ─────────────────────────────────────────────────────────────────────────────
# EVALUATION DATASET
# ─────────────────────────────────────────────────────────────────────────────
PRODUCTS = [
    {"id": 1, "title": "Men's Waterproof Puffer Jacket", "category": "Jackets", "description": "Heavy insulated waterproof winter jacket", "brand": "The North Face", "gender": "male", "color": "Black", "condition": "like_new", "size": "L"},
    {"id": 2, "title": "Men's Merino Wool Sweater", "category": "Sweaters", "description": "Warm and breathable fine merino wool sweater", "brand": "Uniqlo", "gender": "male", "color": "Grey", "condition": "good", "size": "M"},
    {"id": 3, "title": "Unisex Heavyweight Knit Sweater", "category": "Sweaters", "description": "Chunky knit oversized sweater", "brand": "Zara", "gender": "unisex", "color": "Cream", "condition": "like_new", "size": "XL"},
    {"id": 4, "title": "Women's Fleece Hoodie", "category": "Hoodies", "description": "Soft fleece pullover hoodie for winter", "brand": "Nike", "gender": "female", "color": "Pink", "condition": "good", "size": "S"},
    {"id": 5, "title": "Unisex Lightweight Windbreaker", "category": "Jackets", "description": "Packable lightweight jacket for travel", "brand": "Columbia", "gender": "unisex", "color": "Blue", "condition": "good", "size": "M"},
    {"id": 6, "title": "Men's Formal Blazer", "category": "Suits", "description": "Tailored fit formal blazer for office and weddings", "brand": "Hugo Boss", "gender": "male", "color": "Navy", "condition": "like_new", "size": "42R"},
    {"id": 7, "title": "Women's Evening Gown", "category": "Dresses", "description": "Elegant silk evening gown for parties", "brand": "Vera Wang", "gender": "female", "color": "Red", "condition": "like_new", "size": "M"},
    {"id": 8, "title": "Men's Sherwani", "category": "Cultural", "description": "Traditional embroidered sherwani for weddings", "brand": "J.", "gender": "male", "color": "Gold", "condition": "like_new", "size": "L"},
    {"id": 9, "title": "Women's Embroidered Kurta", "category": "Cultural", "description": "Cotton embroidered kurta for everyday wear", "brand": "Khaadi", "gender": "female", "color": "Green", "condition": "good", "size": "M"},
    {"id": 10, "title": "Girls Lehenga Choli", "category": "Cultural", "description": "Festive lehenga choli", "brand": "Maria B", "gender": "female", "color": "Pink", "condition": "good", "size": "S"},
    {"id": 11, "title": "Men's Shalwar Kameez", "category": "Cultural", "description": "Classic wash and wear shalwar kameez", "brand": "Gul Ahmed", "gender": "male", "color": "White", "condition": "like_new", "size": "M"},
    {"id": 12, "title": "Women's Floral Summer Dress", "category": "Dresses", "description": "Lightweight breathable floral dress", "brand": "H&M", "gender": "female", "color": "Yellow", "condition": "good", "size": "M"},
    {"id": 13, "title": "Women's Linen Shirt", "category": "Shirts", "description": "Breathable linen button-up for summer travel", "brand": "Mango", "gender": "female", "color": "White", "condition": "good", "size": "S"},
    {"id": 14, "title": "Men's Swim Shorts", "category": "Shorts", "description": "Quick dry swim shorts for the beach", "brand": "Speedo", "gender": "male", "color": "Blue", "condition": "good", "size": "M"},
    {"id": 15, "title": "Women's Sundress", "category": "Dresses", "description": "Casual beach sundress", "brand": "Shein", "gender": "female", "color": "White", "condition": "good", "size": "M"},
    {"id": 16, "title": "Men's Casual T-Shirt", "category": "T-Shirts", "description": "Everyday cotton crew neck t-shirt", "brand": "Levi's", "gender": "male", "color": "Black", "condition": "good", "size": "L"},
    {"id": 17, "title": "Men's Slim-Fit Jeans", "category": "Jeans", "description": "Stretch denim jeans for casual wear", "brand": "Levi's", "gender": "male", "color": "Blue", "condition": "good", "size": "32x32"},
    {"id": 18, "title": "Women's Graphic Tee", "category": "T-Shirts", "description": "Vintage style graphic t-shirt", "brand": "Pull&Bear", "gender": "female", "color": "Grey", "condition": "good", "size": "S"},
    {"id": 19, "title": "Men's Formal Dress Shirt", "category": "Shirts", "description": "Wrinkle-free formal office shirt", "brand": "Charles Tyrwhitt", "gender": "male", "color": "White", "condition": "like_new", "size": "15.5"},
    {"id": 20, "title": "Women's Formal Blazer", "category": "Outerwear", "description": "Professional office blazer", "brand": "Zara", "gender": "female", "color": "Black", "condition": "like_new", "size": "M"},
]

for p in PRODUCTS:
    parts = []
    if p.get("title"): parts.append(f"Product title: {p['title']}")
    if p.get("category"): parts.append(f"Product type: {p['category']}")
    if p.get("description"): parts.append(f"Description: {p['description']}")
    if p.get("brand"): parts.append(f"Brand: {p['brand']}")
    if p.get("gender"): parts.append(f"Gender: {p['gender']}")
    if p.get("color"): parts.append(f"Color: {p['color']}")
    if p.get("condition"): parts.append(f"Condition: {p['condition'].replace('_', ' ')}")
    if p.get("size"): parts.append(f"Size: {p['size']}")
    p["text"] = "\n".join(parts)

ID_TO_TITLE = {p["id"]: p["title"] for p in PRODUCTS}


# ─────────────────────────────────────────────────────────────────────────────
# GROUND TRUTH
# Relevance scale: 3=highly relevant, 2=relevant, 1=weakly relevant, 0=irrelevant
# ─────────────────────────────────────────────────────────────────────────────
EVAL_QUERIES = [
    {
        "query": "warm clothes",
        "category": "generic",
        "relevance": {1:3, 2:3, 3:3, 4:2, 5:1},
        "negative": {12, 13, 14, 15}
    },
    {
        "query": "I need something warm for a snowy trip",
        "category": "natural-language",
        "relevance": {1:3, 2:2, 3:2, 4:1, 5:1},
        "negative": {12, 13, 14, 15}
    },
    {
        "query": "party wear",
        "category": "occasion",
        "relevance": {7:3, 6:2, 8:2},
        "negative": {16, 17, 18}
    },
    {
        "query": "party clothes for a wedding",
        "category": "occasion",
        "relevance": {7:3, 8:3, 6:2, 10:2},
        "negative": {16, 17, 18, 14}
    },
    {
        "query": "cultural dress",
        "category": "cultural",
        "relevance": {9:3, 10:3, 11:3, 8:2},
        "negative": {12, 13, 14, 1, 2}
    },
    {
        "query": "traditional clothes for Eid",
        "category": "cultural",
        "relevance": {8:3, 9:3, 10:3, 11:3},
        "negative": {12, 13, 14, 16, 17, 18}
    },
    {
        "query": "summer clothes",
        "category": "seasonal",
        "relevance": {12:3, 13:3, 14:3, 15:3},
        "negative": {1, 2, 3, 4}
    },
    {
        "query": "something breathable for a beach vacation",
        "category": "travel",
        "relevance": {14:3, 12:3, 15:2, 13:2},
        "negative": {1, 2, 3, 4, 8, 10}
    },
    {
        "query": "casual clothes for university",
        "category": "occasion",
        "relevance": {16:3, 17:3, 18:3},
        "negative": {6, 7, 8, 10, 19}
    },
    {
        "query": "formal office clothes",
        "category": "occasion",
        "relevance": {6:3, 19:3, 20:3, 2:1},
        "negative": {14, 16, 18, 10}
    },
    {
        "query": "winter layering",
        "category": "seasonal",
        "relevance": {2:3, 4:3, 3:2, 5:2},
        "negative": {12, 13, 14, 15}
    },
    {
        "query": "lightweight clothes for travel",
        "category": "travel",
        "relevance": {5:3, 13:2, 15:2},
        "negative": {1, 3, 7, 8}
    },
    {
        "query": "outdoor clothing",
        "category": "generic",
        "relevance": {5:3, 1:3, 4:2},
        "negative": {6, 7, 8, 19, 20}
    },
]

ID_TO_TITLE = {p["id"]: p["title"] for p in PRODUCTS}

# ─────────────────────────────────────────────────────────────────────────────
# Metrics helpers
# ─────────────────────────────────────────────────────────────────────────────
def is_relevant(relevance_dict, pid, threshold=1):
    return relevance_dict.get(pid, 0) >= threshold

def precision_at_k(ranked_ids, rel_dict, k=5):
    top_k = ranked_ids[:k]
    hits  = sum(1 for pid in top_k if is_relevant(rel_dict, pid))
    return hits / k if k > 0 else 0.0

def recall_at_k(ranked_ids, rel_dict, k=5):
    relevant_count = sum(1 for v in rel_dict.values() if v >= 1)
    if relevant_count == 0:
        return 0.0
    top_k = ranked_ids[:k]
    hits  = sum(1 for pid in top_k if is_relevant(rel_dict, pid))
    return hits / relevant_count

def mrr(ranked_ids, rel_dict):
    for i, pid in enumerate(ranked_ids, 1):
        if is_relevant(rel_dict, pid):
            return 1.0 / i
    return 0.0

def dcg_at_k(ranked_ids, rel_dict, k):
    dcg = 0.0
    for i, pid in enumerate(ranked_ids[:k], 1):
        rel = rel_dict.get(pid, 0)
        dcg += (2**rel - 1) / math.log2(i + 1)
    return dcg

def ndcg_at_k(ranked_ids, rel_dict, k):
    # Ideal ranking (sort items by relevance desc)
    ideal_ids = sorted(rel_dict.keys(), key=lambda x: rel_dict[x], reverse=True)
    idcg = dcg_at_k(ideal_ids, rel_dict, k)
    if idcg == 0:
        return 0.0
    return dcg_at_k(ranked_ids, rel_dict, k) / idcg

# ─────────────────────────────────────────────────────────────────────────────
# Query helpers
# ─────────────────────────────────────────────────────────────────────────────
def get_embedding(text):
    r = requests.post(f"{BASE}/api/extract", json={"text": text}, timeout=30)
    r.raise_for_status()
    return r.json()["embedding"]

def rank_products(query_emb, query_str, products):
    # Stage 1: Semantic ranking
    r = requests.post(f"{BASE}/api/rank", json={
        "query_embedding": query_emb,
        "items": products,
    }, timeout=60)
    r.raise_for_status()
    rankings = r.json().get("rankings", [])
    
    # Stage 2: Multi-signal re-ranking (Simulating Node.js logic)
    stop_words = {'and', 'for', 'with', 'the', 'made', 'from', 'that', 'this', 'suit', 'suitable', 'perfect', 'ideal', 'designed', 'need', 'something', 'want', 'looking', 'find', 'get', 'clothes', 'clothing'}
    query_tokens = [t for t in query_str.lower().split() if len(t) > 2 and t not in stop_words]
    
    weights = {"semantic": 0.55, "title": 0.20, "attributes": 0.15, "lexical": 0.10}
    
    # Phase 9: Candidate Filtering
    max_candidates = 50
    rankings.sort(key=lambda x: x["score"], reverse=True)
    top_candidates = rankings[:max_candidates]
    rank_map = {r["id"]: r["score"] for r in top_candidates}
    
    final_rankings = []
    # Only re-rank candidate items
    candidate_products = [p for p in products if p["id"] in rank_map]
    
    for p in candidate_products:
        pid = p["id"]
        sem_score = rank_map.get(pid, 0)
        
        def get_overlap(text):
            if not query_tokens or not text: return 0.0
            import re
            target_tokens = set(t for t in re.split(r'[\s,.-]+', text.lower()) if len(t) > 2)
            matches = sum(1 for t in query_tokens if t in target_tokens)
            return matches / len(query_tokens)
            
        title_score = get_overlap(p["title"])
        attr_score  = 0.0 # simplified for evaluation since we don't have separate brand/color here, assume 0 or part of text
        lex_score   = get_overlap(p["text"])
        
        final_score = (sem_score * weights["semantic"]) + (title_score * weights["title"]) + (attr_score * weights["attributes"]) + (lex_score * weights["lexical"])
        final_rankings.append({"id": pid, "score": final_score})
        
    final_rankings.sort(key=lambda x: x["score"], reverse=True)
    return final_rankings

# ─────────────────────────────────────────────────────────────────────────────
# Evaluation loop
# ─────────────────────────────────────────────────────────────────────────────
print(SEP)
print("EVALUATION RESULTS (NDCG / Multi-Signal)")
print(SEP)

cat_metrics = defaultdict(lambda: {"p5":0, "r5":0, "p10":0, "r10":0, "ndcg5":0, "ndcg10":0, "mrr":0, "count":0})

all_p5, all_p10 = [], []
all_r5, all_r10 = [], []
all_ndcg5, all_ndcg10 = [], []
all_mrr = []

for eq in EVAL_QUERIES:
    query   = eq["query"]
    cat     = eq["category"]
    rel_dict = eq["relevance"]
    negative = eq["negative"]

    print(f"\nQuery: \"{query}\" [{cat}]")
    
    try:
        qemb     = get_embedding(query)
        rankings = rank_products(qemb, query, PRODUCTS)
    except Exception as e:
        print(f"  [ERROR] {e}")
        continue

    ranked_ids = [r["id"] for r in rankings]
    id_to_score = {r["id"]: r["score"] for r in rankings}

    # Show top-10
    print(f"  {'Rank':<5} {'Score':<8} {'Rel?':<6} Title")
    print(f"  {'-'*5} {'-'*8} {'-'*6} {'-'*40}")
    for rank, pid in enumerate(ranked_ids[:10], 1):
        score = id_to_score.get(pid, 0)
        rel_val = rel_dict.get(pid, 0)
        is_neg = pid in negative
        
        flag = f" [Rel:{rel_val}]" if rel_val > 0 else ""
        if is_neg: flag += " <-- BAD"
        
        title  = ID_TO_TITLE.get(pid, f"ID:{pid}")
        print(f"  {rank:<5} {score:<8.4f} {rel_val:<6} {title}{flag}")

    # Metrics
    p5  = precision_at_k(ranked_ids, rel_dict, 5)
    p10 = precision_at_k(ranked_ids, rel_dict, 10)
    r5  = recall_at_k(ranked_ids, rel_dict, 5)
    r10 = recall_at_k(ranked_ids, rel_dict, 10)
    ndcg5 = ndcg_at_k(ranked_ids, rel_dict, 5)
    ndcg10 = ndcg_at_k(ranked_ids, rel_dict, 10)
    m   = mrr(ranked_ids, rel_dict)
    
    all_p5.append(p5); all_p10.append(p10)
    all_r5.append(r5); all_r10.append(r10)
    all_ndcg5.append(ndcg5); all_ndcg10.append(ndcg10)
    all_mrr.append(m)
    
    cat_metrics[cat]["p5"] += p5; cat_metrics[cat]["p10"] += p10
    cat_metrics[cat]["r5"] += r5; cat_metrics[cat]["r10"] += r10
    cat_metrics[cat]["ndcg5"] += ndcg5; cat_metrics[cat]["ndcg10"] += ndcg10
    cat_metrics[cat]["mrr"] += m
    cat_metrics[cat]["count"] += 1

    print(f"  NDCG@5: {ndcg5:.3f} | NDCG@10: {ndcg10:.3f} | P@5: {p5:.3f} | R@5: {r5:.3f} | MRR: {m:.3f}")

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
print("\n" + SEP)
print("OVERALL METRICS")
print(SEP)
n = len(all_p5)
if n > 0:
    print(f"  Queries evaluated : {n}")
    print(f"  Mean NDCG@5       : {sum(all_ndcg5)/n:.3f}")
    print(f"  Mean NDCG@10      : {sum(all_ndcg10)/n:.3f}")
    print(f"  Mean Precision@5  : {sum(all_p5)/n:.3f}")
    print(f"  Mean Precision@10 : {sum(all_p10)/n:.3f}")
    print(f"  Mean Recall@5     : {sum(all_r5)/n:.3f}")
    print(f"  Mean Recall@10    : {sum(all_r10)/n:.3f}")
    print(f"  Mean MRR          : {sum(all_mrr)/n:.3f}")
    print("\n  Metrics by Category:")
    print(f"  {'Category':<20} {'NDCG@5':<8} {'NDCG@10':<8} {'P@5':<8} {'R@5':<8}")
    print(f"  {'-'*20} {'-'*8} {'-'*8} {'-'*8} {'-'*8}")
    for c, mets in cat_metrics.items():
        cnt = mets["count"]
        print(f"  {c:<20} {mets['ndcg5']/cnt:<8.3f} {mets['ndcg10']/cnt:<8.3f} {mets['p5']/cnt:<8.3f} {mets['r5']/cnt:<8.3f}")

print("\n" + SEP)
print("EVALUATION COMPLETE")
print(SEP)
