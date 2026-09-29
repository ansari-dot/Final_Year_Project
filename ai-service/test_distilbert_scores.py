import requests
import json

def test_similarity():
    query = "I need something warm for a snowy trip"
    products = [
        {"id": 1, "title": "Men's Waterproof Puffer Jacket", "text": "Heavy insulated waterproof puffer jacket designed for freezing temperatures, snow, winter travel, and cold outdoor activities."},
        {"id": 2, "title": "Men's Merino Wool Sweater", "text": "Soft merino wool sweater providing warmth during cold weather, suitable for office layering, winter travel, and smart casual outfits."},
        {"id": 3, "title": "Unisex Heavyweight Knit Sweater", "text": "Heavyweight knitted sweater designed to provide warmth during cold days, winter travel, outdoor walks, and casual gatherings."},
        {"id": 4, "title": "Women's Floral Summer Dress", "text": "Lightweight floral summer dress made from breathable fabric, perfect for beach trips, picnics, vacations, and warm-weather outings."},
        {"id": 5, "title": "Women's Linen Button-Up Shirt", "text": "Breathable linen shirt with a relaxed fit, ideal for summer weather, vacations, beach walks, and casual daytime outfits."}
    ]

    print(f"--- Query: '{query}' ---")
    
    # Test POST /api/extract
    ext_resp = requests.post("http://127.0.0.1:5000/api/extract", json={"text": query})
    print(f"Extract Query Vector Status: {ext_resp.status_code}")
    q_emb = ext_resp.json().get("embedding", [])
    print(f"Query Vector Dimensions: {len(q_emb)}")
    
    # Test POST /api/rank
    rank_resp = requests.post("http://127.0.0.1:5000/api/rank", json={
        "query_embedding": q_emb,
        "items": products
    })
    print(f"Rank Endpoint Status: {rank_resp.status_code}")
    rankings = rank_resp.json().get("rankings", [])
    
    prod_map = {p["id"]: p["title"] for p in products}
    print("\n--- DistilBERT Raw Scores & Ranking ---")
    for r in rankings:
        title = prod_map.get(r["id"], "Unknown")
        print(f"Score: {r['score']:.4f} | Product: {title}")

if __name__ == "__main__":
    test_similarity()
