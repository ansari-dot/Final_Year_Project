import requests
import re
from evaluate_search import EVAL_QUERIES, PRODUCTS, get_embedding, rank_products, precision_at_k, recall_at_k, ndcg_at_k, mrr

def evaluate_config(weights):
    all_p5, all_r5, all_ndcg5, all_ndcg10, all_mrr = [], [], [], [], []
    for eq in EVAL_QUERIES:
        query = eq["query"]
        rel_dict = eq["relevance"]
        try:
            qemb = get_embedding(query)
            # Fetch base rankings
            r = requests.post("http://127.0.0.1:5000/api/rank", json={
                "query_embedding": qemb, "items": PRODUCTS
            }, timeout=60)
            base_rankings = r.json().get("rankings", [])
            
            stop_words = {'and', 'for', 'with', 'the', 'made', 'from', 'that', 'this', 'suit', 'suitable', 'perfect', 'ideal', 'designed', 'need', 'something', 'want', 'looking', 'find', 'get', 'clothes', 'clothing'}
            query_tokens = [t for t in query.lower().split() if len(t) > 2 and t not in stop_words]
            
            rank_map = {res["id"]: res["score"] for res in base_rankings[:50]}
            
            final_rankings = []
            candidate_products = [p for p in PRODUCTS if p["id"] in rank_map]
            
            for p in candidate_products:
                pid = p["id"]
                sem_score = rank_map.get(pid, 0)
                
                def get_overlap(text):
                    if not query_tokens or not text: return 0.0
                    target_tokens = set(t for t in re.split(r'[\s,.-]+', text.lower()) if len(t) > 2)
                    matches = sum(1 for t in query_tokens if t in target_tokens)
                    return matches / len(query_tokens)
                    
                title_score = get_overlap(p["title"])
                attr_score  = 0.0
                lex_score   = get_overlap(p["text"])
                
                final_score = (sem_score * weights["semantic"]) + (title_score * weights["title"]) + (attr_score * weights["attributes"]) + (lex_score * weights["lexical"])
                final_rankings.append({"id": pid, "score": final_score})
                
            final_rankings.sort(key=lambda x: x["score"], reverse=True)
            ranked_ids = [r["id"] for r in final_rankings]
            
            all_p5.append(precision_at_k(ranked_ids, rel_dict, 5))
            all_r5.append(recall_at_k(ranked_ids, rel_dict, 5))
            all_ndcg5.append(ndcg_at_k(ranked_ids, rel_dict, 5))
            all_ndcg10.append(ndcg_at_k(ranked_ids, rel_dict, 10))
            all_mrr.append(mrr(ranked_ids, rel_dict))
        except Exception as e:
            pass
            
    n = len(all_p5)
    return {
        "mrr": sum(all_mrr)/n,
        "p5": sum(all_p5)/n,
        "r5": sum(all_r5)/n,
        "ndcg5": sum(all_ndcg5)/n,
        "ndcg10": sum(all_ndcg10)/n,
    }

configs = {
    "A: Semantic Only (MiniLM)": {"semantic": 1.0, "title": 0.0, "attributes": 0.0, "lexical": 0.0},
    "B: Semantic + Title": {"semantic": 0.70, "title": 0.30, "attributes": 0.0, "lexical": 0.0},
    "C: Semantic + Lexical": {"semantic": 0.70, "title": 0.0, "attributes": 0.0, "lexical": 0.30},
    "D: Semantic + Title + Lexical": {"semantic": 0.60, "title": 0.20, "attributes": 0.0, "lexical": 0.20},
    "E: Current (0.55/0.20/0.15/0.10)": {"semantic": 0.55, "title": 0.20, "attributes": 0.15, "lexical": 0.10},
    "F: Heavy Semantic (0.80/0.10/0.05/0.05)": {"semantic": 0.80, "title": 0.10, "attributes": 0.05, "lexical": 0.05},
}

print(f"{'Configuration':<40} {'MRR':<8} {'P@5':<8} {'R@5':<8} {'NDCG@5':<8} {'NDCG@10':<8}")
print("-" * 80)
for name, weights in configs.items():
    res = evaluate_config(weights)
    print(f"{name:<40} {res['mrr']:<8.3f} {res['p5']:<8.3f} {res['r5']:<8.3f} {res['ndcg5']:<8.3f} {res['ndcg10']:<8.3f}")
